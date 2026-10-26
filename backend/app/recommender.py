"""Explainable, demo-only department suggestions and synthetic ML baseline."""

import re
import threading
import unicodedata
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, top_k_accuracy_score
from sklearn.pipeline import Pipeline
from sqlalchemy.orm import Session

from .models import SyntheticSymptom

ARTIFACT_PATH = Path(__file__).resolve().parents[1] / "model_artifacts" / "department_model.joblib"
_MODEL = None
_MODEL_LOCK = threading.Lock()

# These are navigation hints, not a clinical pathway or a diagnosis.
SYMPTOM_KEYWORDS = {
    "child_emergency": ["child very unwell", "بچہ بہت بیمار", "ٻار تمام بيمار"],
    "paediatrics": ["my child", "child has a fever", "بچے کو بخار", "ٻار کي بخار", "ٻار کي کنگهه"],
    "adult_emergency": ["adult is unconscious", "severe injury", "اچانک شدید چوٹ", "اوچتو سخت چوٽ"],
    "general_medicine": ["adult fever", "general checkup", "عمومی صحت کا معائنہ", "وڏي ماڻهو کي بخار", "عام صحت جي جاچ"],
    "surgery": ["surgical consultation", "wound", "سرجری", "سرجري"],
    "gynaecology": ["pregnancy", "women's health", "حمل سے متعلق", "حمل سان لاڳاپيل"],
    "orthopaedics": ["joint pain", "bone injury", "جوڑوں میں درد", "هڏن ۾ سور"],
    "ent_eye": ["ear discomfort", "sore throat", "eye irritation", "کان میں تکلیف", "ڪن ۾ تڪليف", "اک ۾ ساڙو"],
    "cardiology": ["heart check-up", "heart beats feel irregular", "دل کے معائنے", "دل کی دھڑکن", "دل جي جاچ", "دل جي ڌڙڪن"],
    "skin": ["itchy skin", "skin rash", "جلد پر خارش", "چمڙي تي خارش"],
}

RED_FLAG_KEYWORDS = {
    "chest_pain": [
        "chest pain",
        "chest discomfort",
        "سینے میں درد",
        "سيني ۾ سور",
        "ڇاتي ۾ سور",
    ],
    "breathing_trouble": [
        "trouble breathing",
        "breathing trouble",
        "difficulty breathing",
        "shortness of breath",
        "سانس لینے میں مشکل",
        "ساهه کڻڻ ۾ تڪليف",
    ],
    "heavy_bleeding": [
        "heavy bleeding",
        "severe bleeding",
        "بہت زیادہ خون",
        "گهڻو رت وهي",
    ],
    "stroke_signs": [
        "stroke signs",
        "face drooping",
        "sudden weakness on one side",
        "فالج",
        "منهن هڪ پاسي لڙڪي",
    ],
    "unconsciousness": [
        "unconscious",
        "not waking",
        "بے ہوش",
        "بيهوش",
    ],
    "severe_injury": [
        "severe injury",
        "serious injury",
        "major injury",
        "شدید چوٹ",
        "سخت چوٽ",
    ],
}

DEPARTMENT_NAMES = {
    "en": {
        "child_emergency": "Child Emergency",
        "adult_emergency": "Emergency (adult)",
        "paediatrics": "Paediatrics",
        "general_medicine": "General Medicine",
        "surgery": "Surgery",
        "gynaecology": "Gynaecology",
        "orthopaedics": "Orthopaedics",
        "ent_eye": "ENT/Eye",
        "cardiology": "Cardiology",
        "skin": "Skin",
    },
    "ur": {
        "child_emergency": "بچوں کی ایمرجنسی",
        "adult_emergency": "بالغوں کی ایمرجنسی",
        "paediatrics": "بچوں کا شعبہ",
        "general_medicine": "جنرل میڈیسن",
        "surgery": "سرجری",
        "gynaecology": "امراضِ نسواں",
        "orthopaedics": "ہڈیوں کا شعبہ",
        "ent_eye": "ناک، کان، گلا اور آنکھ",
        "cardiology": "امراضِ قلب",
        "skin": "جلد کا شعبہ",
    },
    "sd": {
        "child_emergency": "ٻارن جي ايمرجنسي",
        "adult_emergency": "وڏن جي ايمرجنسي",
        "paediatrics": "ٻارن جو شعبو",
        "general_medicine": "جنرل ميڊيسن",
        "surgery": "سرجري",
        "gynaecology": "عورتن جو شعبو",
        "orthopaedics": "هڏن جو شعبو",
        "ent_eye": "نڪ، ڪن، ڳلي ۽ اک",
        "cardiology": "دل جو شعبو",
        "skin": "چمڙي جو شعبو",
    },
}


def _normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text).lower()
    return re.sub(r"\s+", " ", normalized).strip()


def find_red_flags(complaint_text: str, reported_flags: list[str]) -> list[str]:
    """Match recognized safety flags against both answers and free text."""
    text = _normalize(complaint_text)
    flags = set()
    recognized_flags = set(RED_FLAG_KEYWORDS)
    for reported_flag in reported_flags:
        normalized_flag = _normalize(reported_flag)
        if normalized_flag in recognized_flags:
            flags.add(normalized_flag)
    for flag, keywords in RED_FLAG_KEYWORDS.items():
        if any(_normalize(keyword) in text for keyword in keywords):
            flags.add(flag)
    return sorted(flags)


def build_classifier() -> Pipeline:
    """Build the small multilingual-friendly baseline for synthetic examples."""
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    analyzer="char",
                    ngram_range=(2, 5),
                    min_df=2,
                    max_features=100_000,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    random_state=2601,
                ),
            ),
        ]
    )


def _load_or_train_model(db: Session) -> Pipeline:
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    with _MODEL_LOCK:
        if _MODEL is not None:
            return _MODEL
        if ARTIFACT_PATH.exists():
            _MODEL = joblib.load(ARTIFACT_PATH)
            return _MODEL

        records = (
            db.query(SyntheticSymptom)
            .filter(SyntheticSymptom.split == "train")
            .order_by(SyntheticSymptom.id)
            .all()
        )
        if not records:
            raise RuntimeError(
                "No synthetic training examples are available. "
                "Run `python backend\\scripts\\seed.py` first."
            )
        texts = [
            " ".join(
                (record.complaint_en, record.complaint_ur, record.complaint_sd)
            )
            for record in records
        ]
        labels = [record.department_code for record in records]
        model = build_classifier()
        model.fit(texts, labels)
        ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, ARTIFACT_PATH)
        _MODEL = model
        return model


def train_and_evaluate(db: Session) -> dict:
    """Train on the seeded training split and report untouched test metrics."""
    train_records = (
        db.query(SyntheticSymptom)
        .filter(SyntheticSymptom.split == "train")
        .order_by(SyntheticSymptom.id)
        .all()
    )
    test_records = (
        db.query(SyntheticSymptom)
        .filter(SyntheticSymptom.split == "test")
        .order_by(SyntheticSymptom.id)
        .all()
    )
    if not train_records or not test_records:
        raise RuntimeError(
            "Synthetic train/test examples are missing. "
            "Run `python backend\\scripts\\seed.py --reset` first."
        )

    def text_for(record: SyntheticSymptom) -> str:
        return " ".join(
            (record.complaint_en, record.complaint_ur, record.complaint_sd)
        )

    model = build_classifier()
    train_texts = [text_for(record) for record in train_records]
    train_labels = [record.department_code for record in train_records]
    test_texts = [text_for(record) for record in test_records]
    test_labels = [record.department_code for record in test_records]
    model.fit(train_texts, train_labels)
    predictions = model.predict(test_texts)
    probabilities = model.predict_proba(test_texts)
    labels = list(model.named_steps["classifier"].classes_)

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACT_PATH)
    global _MODEL
    _MODEL = model

    return {
        "training_examples": len(train_records),
        "test_examples": len(test_records),
        "top_1_accuracy": accuracy_score(test_labels, predictions),
        "top_3_accuracy": top_k_accuracy_score(
            test_labels,
            probabilities,
            k=3,
            labels=labels,
        ),
        "per_department_recall": classification_report(
            test_labels,
            predictions,
            labels=labels,
            output_dict=True,
            zero_division=0,
        ),
        "artifact_path": str(ARTIFACT_PATH),
        "data_notice": "Synthetic demo data only; not a medical tool.",
    }


def recommend_department(
    db: Session,
    complaint_text: str,
    patient_age: int,
    patient_role: str,
    language: str,
    reported_flags: list[str],
) -> dict:
    """Apply red-flag safety, then explainable symptom rules, then synthetic ML."""
    normalized_text = _normalize(complaint_text)
    flags = find_red_flags(complaint_text, reported_flags)
    is_child = patient_age < 18 or patient_role == "my_child"

    if flags:
        emergency_code = "child_emergency" if is_child else "adult_emergency"
        return {
            "emergency": True,
            "red_flags": flags,
            "recommendations": [
                {
                    "department_code": emergency_code,
                    "department": DEPARTMENT_NAMES[language][emergency_code],
                    "confidence": 100,
                    "confidence_source": "safety_rule",
                    "reason": {
                        "en": "You reported an emergency warning sign. Go to the emergency department now.",
                        "ur": "آپ نے ہنگامی خطرے کی علامت بتائی ہے۔ ابھی ایمرجنسی شعبے میں جائیں۔",
                        "sd": "توهان هنگامي خطري جي نشاني ٻڌائي آهي. هاڻي ايمرجنسي شعبي ۾ وڃو.",
                    }[language],
                    "why": {
                        "en": "This safety rule routes warning signs to emergency care. WayMed does not diagnose.",
                        "ur": "یہ حفاظتی اصول خطرے کی علامات پر ایمرجنسی کی طرف رہنمائی کرتا ہے۔ WayMed تشخیص نہیں کرتا۔",
                        "sd": "هي حفاظتي اصول خطري جي نشانين تي ايمرجنسي ڏانهن رهنمائي ڪري ٿو. WayMed تشخيص نٿو ڪري.",
                    }[language],
                }
            ],
            "ask_human": True,
            "next_step": {
                "en": "Go to emergency now or ask a human at reception for immediate directions.",
                "ur": "ابھی ایمرجنسی جائیں یا فوری راستے کے لیے استقبالیہ کے عملے سے پوچھیں۔",
                "sd": "هاڻي ايمرجنسي وڃو يا ترت رستي لاءِ استقباليه جي عملي کان پڇو.",
            }[language],
            "disclaimer": {
                "en": "WayMed is a navigation prototype, not a medical tool. Do not delay urgent care.",
                "ur": "WayMed راستہ دکھانے کا نمونہ ہے، طبی آلہ نہیں۔ فوری طبی مدد میں تاخیر نہ کریں۔",
                "sd": "WayMed رستو ڏيکارڻ جو نمونو آهي، طبي اوزار ناهي. ترت طبي مدد ۾ دير نه ڪريو.",
            }[language],
            "confidence_notice": {
                "en": "This score describes a demo navigation rule, not a medical assessment.",
                "ur": "یہ اسکور ڈیمو میں راستہ دکھانے کے اصول کا ہے، طبی معائنے کا نہیں۔",
                "sd": "هي اسڪور ڊيمو ۾ رستو ڏيکارڻ جي اصول جو آهي، طبي جاچ جو نه.",
            }[language],
            "synthetic_demo": True,
        }

    rule_matches = []
    for department_code, keywords in SYMPTOM_KEYWORDS.items():
        matched = [keyword for keyword in keywords if _normalize(keyword) in normalized_text]
        if matched:
            rule_matches.append((department_code, matched[0]))

    model = _load_or_train_model(db)
    probabilities = model.predict_proba([complaint_text])[0]
    model_scores = {
        code: float(probability)
        for code, probability in zip(
            model.named_steps["classifier"].classes_,
            probabilities,
        )
    }

    ranked_codes = [code for code, _ in rule_matches]
    ranked_codes.extend(
        code
        for code, _score in sorted(
            model_scores.items(),
            key=lambda item: item[1],
            reverse=True,
        )
        if code not in ranked_codes
    )
    ranked_codes = ranked_codes[:3]
    rules_by_code = dict(rule_matches)
    recommendations = []

    for department_code in ranked_codes:
        matched_keyword = rules_by_code.get(department_code)
        if matched_keyword:
            confidence = 0.93 if len(rule_matches) == 1 else 0.90
            source = "explainable_keyword_rule"
            reason = {
                "en": (
                    f'Because you mentioned "{matched_keyword}", this department '
                    "usually handles this kind of visit."
                ),
                "ur": (
                    f'آپ نے "{matched_keyword}" بتایا؛ یہ شعبہ عموماً اس طرح کے '
                    "معائنے میں رہنمائی کرتا ہے۔"
                ),
                "sd": (
                    f'توهان "{matched_keyword}" ٻڌايو؛ هي شعبو عام طور اهڙي '
                    "معائني ۾ رهنمائي ڪندو آهي."
                ),
            }[language]
        else:
            confidence = model_scores[department_code]
            source = "synthetic_tfidf_logistic_regression"
            reason = {
                "en": (
                    "The demo model found a text similarity to this department; "
                    "its synthetic-data suggestion is uncertain."
                ),
                "ur": (
                    "ڈیمو ماڈل کو اس شعبے سے متن کی مماثلت ملی؛ مصنوعی ڈیٹا پر "
                    "اس کی تجویز یقینی نہیں۔"
                ),
                "sd": (
                    "ڊيمو ماڊل کي هن شعبي سان متن جي مشابهت ملي؛ مصنوعي ڊيٽا "
                    "تي ان جي تجويز پڪ سان ناهي."
                ),
            }[language]
        recommendations.append(
            {
                "department_code": department_code,
                "department": DEPARTMENT_NAMES[language][department_code],
                "confidence": round(confidence * 100),
                "confidence_source": source,
                "reason": reason,
                "why": reason,
            }
        )

    top_score = max(
        [0.93 if recommendation["confidence_source"] == "explainable_keyword_rule"
         else recommendation["confidence"] / 100 for recommendation in recommendations],
        default=0,
    )
    low_confidence = not rule_matches and top_score < 0.35
    return {
        "emergency": False,
        "red_flags": [],
        "recommendations": recommendations,
        "ask_human": low_confidence,
        "next_step": (
            {
                "en": "Ask a human at reception to help choose the right department.",
                "ur": "درست شعبہ چننے کے لیے استقبالیہ کے عملے سے پوچھیں۔",
                "sd": "صحيح شعبو چونڊڻ لاءِ استقباليه جي عملي کان پڇو.",
            }[language]
            if low_confidence
            else {
                "en": "Check the suggested department with a human at reception if you are unsure.",
                "ur": "اگر یقین نہ ہو تو تجویز کردہ شعبے کے بارے میں استقبالیہ کے عملے سے پوچھیں۔",
                "sd": "جيڪڏهن پڪ نه هجي ته تجويز ڪيل شعبي بابت استقباليه جي عملي کان پڇو.",
            }[language]
        ),
        "disclaimer": {
            "en": "WayMed does not diagnose or provide medical advice. Suggestions are for navigation only.",
            "ur": "WayMed تشخیص یا طبی مشورہ نہیں دیتا۔ تجاویز صرف راستہ چننے کے لیے ہیں۔",
            "sd": "WayMed تشخيص يا طبي صلاح نٿو ڏئي. تجويزون رڳو رستو چونڊڻ لاءِ آهن.",
        }[language],
        "confidence_notice": {
            "en": "Department scores are uncalibrated demo estimates, not probabilities of a medical condition.",
            "ur": "شعبے کے اسکور ڈیمو کے غیر متوازن اندازے ہیں، کسی طبی حالت کے امکانات نہیں۔",
            "sd": "شعبي جا اسڪور ڊيمو جا غير ترتيب ڏنل اندازا آهن، ڪنهن طبي حالت جا امڪان نه.",
        }[language],
        "synthetic_demo": True,
        "model_notice": (
            "Machine-learning suggestions use synthetic demo data and are not clinically validated."
        ),
    }
