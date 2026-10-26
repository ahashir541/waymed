"""Deterministic, fictional symptom examples for the recommender baseline."""

import random

DEPARTMENTS = [
    ("child_emergency", "Child Emergency", "بچوں کی ایمرجنسی", "ٻارن جي ايمرجنسي"),
    ("paediatrics", "Paediatrics", "بچوں کا شعبہ", "ٻارن جو شعبو"),
    ("adult_emergency", "Emergency (adult)", "بالغوں کی ایمرجنسی", "وڏن جي ايمرجنسي"),
    ("general_medicine", "General Medicine", "جنرل میڈیسن", "جنرل ميڊيسن"),
    ("surgery", "Surgery", "سرجری", "سرجري"),
    ("gynaecology", "Gynaecology", "امراضِ نسواں", "عورتن جو شعبو"),
    ("orthopaedics", "Orthopaedics", "ہڈیوں کا شعبہ", "هڏن جو شعبو"),
    ("ent_eye", "ENT/Eye", "ناک، کان، گلا اور آنکھ", "نڪ، ڪن، ڳلي ۽ اک"),
    ("cardiology", "Cardiology", "امراضِ قلب", "دل جو شعبو"),
    ("skin", "Skin", "جلد کا شعبہ", "چمڙي جو شعبو"),
]

# These examples are fabricated only to exercise the demo classifier. They are
# not patient records and do not represent validated clinical pathways.
SYMPTOM_TERMS = {
    "child_emergency": [
        ("child very unwell and struggling to breathe", "بچہ بہت بیمار ہے اور سانس لینے میں مشکل", "ٻار تمام بيمار آهي ۽ ساهه کڻڻ ۾ تڪليف"),
        ("child has a serious injury", "بچے کو شدید چوٹ لگی ہے", "ٻار کي سخت چوٽ لڳي آهي"),
        ("child is unconscious", "بچہ بے ہوش ہے", "ٻار بيهوش آهي"),
        ("child needs urgent emergency assessment", "بچے کو فوری ایمرجنسی معائنے کی ضرورت", "ٻار کي ترت ايمرجنسي جاچ جي ضرورت"),
        ("young patient has a sudden severe concern", "کم عمر مریض کو اچانک شدید مسئلہ", "ننڍڙي مريض کي اوچتو سخت تڪليف"),
    ],
    "paediatrics": [
        ("my child has a fever", "میرے بچے کو بخار ہے", "منهنجي ٻار کي بخار آهي"),
        ("child has a cough", "بچے کو کھانسی ہے", "ٻار کي کنگهه آهي"),
        ("my son has stomach pain", "میرے بیٹے کے پیٹ میں درد ہے", "منهنجي پٽ جي پيٽ ۾ سور آهي"),
        ("child has a skin irritation", "بچے کی جلد پر جلن", "ٻار جي چمڙي تي ساڙو"),
        ("child needs a general check-up", "بچے کے عمومی معائنے کی ضرورت", "ٻار جي عام جاچ جي ضرورت"),
    ],
    "adult_emergency": [
        ("sudden severe injury", "اچانک شدید چوٹ", "اوچتو سخت چوٽ"),
        ("adult is unconscious", "بالغ شخص بے ہوش ہے", "وڏو ماڻهو بيهوش آهي"),
        ("sudden breathing trouble", "اچانک سانس لینے میں مشکل", "اوچتو ساهه کڻڻ ۾ تڪليف"),
        ("urgent assessment after a serious fall", "شدید گرنے کے بعد فوری معائنہ", "سخت ڪرڻ کان پوءِ ترت جاچ"),
        ("person needs urgent emergency assessment", "شخص کو فوری ایمرجنسی معائنے کی ضرورت", "ماڻهو کي ترت ايمرجنسي جاچ جي ضرورت"),
    ],
    "general_medicine": [
        ("adult fever and weakness", "بالغ کو بخار اور کمزوری", "وڏي ماڻهو کي بخار ۽ ڪمزوري"),
        ("ongoing stomach discomfort", "مسلسل پیٹ کی تکلیف", "مسلسل پيٽ جي تڪليف"),
        ("headache and tiredness", "سر درد اور تھکاوٹ", "مٿي جو سور ۽ ٿڪاوٽ"),
        ("ongoing fatigue and low energy", "مسلسل تھکاوٹ اور کمزوری", "مسلسل ٿڪاوٽ ۽ ڪمزوري"),
        ("general health check-up", "عمومی صحت کا معائنہ", "عام صحت جي جاچ"),
    ],
    "surgery": [
        ("need a surgical consultation", "سرجری کے مشورے کی ضرورت", "سرجري جي صلاح جي ضرورت"),
        ("pain around a wound", "زخم کے اردگرد درد", "زخم جي چوڌاري سور"),
        ("lump that needs assessment", "گلٹی کا معائنہ", "ڳوڙهي جو معائنو"),
        ("cut that needs assessment", "کٹ کا معائنہ", "ڪٽ جو معائنو"),
        ("follow-up after a procedure", "طریقہ کار کے بعد فالو اپ", "طريقيڪار کان پوءِ فالو اپ"),
    ],
    "gynaecology": [
        ("pregnancy related appointment", "حمل سے متعلق معائنہ", "حمل سان لاڳاپيل معائنو"),
        ("women's health concern", "خواتین کی صحت کا مسئلہ", "عورتن جي صحت جو مسئلو"),
        ("pelvic discomfort", "پیڑو میں تکلیف", "پيٽ جي هيٺئين حصي ۾ تڪليف"),
        ("menstrual health appointment", "ماہواری کی صحت سے متعلق ملاقات", "ماهواري جي صحت بابت ملاقات"),
        ("women's health check-up", "خواتین کی صحت کا معائنہ", "عورتن جي صحت جي جاچ"),
    ],
    "orthopaedics": [
        ("joint pain after a fall", "گرنے کے بعد جوڑوں میں درد", "ڪرڻ کان پوءِ جوڙن ۾ سور"),
        ("difficulty moving an arm", "بازو ہلانے میں مشکل", "ٻانهن هلائڻ ۾ تڪليف"),
        ("bone injury follow-up", "ہڈی کی چوٹ کا فالو اپ", "هڏي جي چوٽ جو فالو اپ"),
        ("back discomfort while walking", "چلتے وقت کمر میں تکلیف", "هلڻ وقت پٺيءَ ۾ تڪليف"),
        ("joint stiffness", "جوڑوں میں اکڑاؤ", "جوڙن ۾ سختي"),
    ],
    "ent_eye": [
        ("ear discomfort", "کان میں تکلیف", "ڪن ۾ تڪليف"),
        ("sore throat and voice concern", "گلے میں درد اور آواز کا مسئلہ", "ڳلي ۾ سور ۽ آواز جو مسئلو"),
        ("eye irritation", "آنکھ میں جلن", "اک ۾ ساڙو"),
        ("hearing concern", "سننے سے متعلق مسئلہ", "ٻڌڻ بابت مسئلو"),
        ("nose congestion", "ناک بند ہونا", "نڪ بند ٿيڻ"),
    ],
    "cardiology": [
        ("heart check-up appointment", "دل کے معائنے کی ملاقات", "دل جي جاچ جي ملاقات"),
        ("heart beats feel irregular", "دل کی دھڑکن بے ترتیب محسوس ہوتی ہے", "دل جي ڌڙڪن بي ترتيب محسوس ٿئي ٿي"),
        ("chest discomfort for assessment", "سینے کی تکلیف کا معائنہ", "ڇاتي جي تڪليف جو معائنو"),
        ("heart follow-up appointment", "دل کے فالو اپ کی ملاقات", "دل جي فالو اپ جي ملاقات"),
        ("cardiac health check-up", "دل کی صحت کا معائنہ", "دل جي صحت جي جاچ"),
    ],
    "skin": [
        ("itchy skin irritation", "جلد پر خارش اور جلن", "چمڙي تي خارش ۽ ساڙو"),
        ("skin rash to be checked", "جلد پر دانوں کا معائنہ", "چمڙي جي ريش جو معائنو"),
        ("ongoing skin concern", "جلد کا مسلسل مسئلہ", "چمڙي جو مسلسل مسئلو"),
        ("dry skin patch", "جلد پر خشک دھبہ", "چمڙي تي سڪل نشان"),
        ("skin irritation follow-up", "جلد کی جلن کا فالو اپ", "چمڙي جي ساڙي جو فالو اپ"),
    ],
}


def build_synthetic_records(records_per_department: int = 500) -> list[dict[str, object]]:
    """Return a reproducible, balanced dataset with English, Urdu, and Sindhi text."""
    randomizer = random.Random(2601)
    records: list[dict[str, object]] = []

    for code, phrases in SYMPTOM_TERMS.items():
        examples = []
        for index in range(records_per_department):
            phrase_index = index % len(phrases)
            english, urdu, sindhi = phrases[phrase_index]
            variation = (index // len(phrases)) % 5
            if variation:
                english = f"{english} (demo variation {variation})"
            examples.append(
                {
                    "complaint_en": english,
                    "complaint_ur": urdu,
                    "complaint_sd": sindhi,
                    "department_code": code,
                    "split": (
                        "train" if phrase_index < 3 else
                        "validation" if phrase_index == 3 else
                        "test"
                    ),
                    "is_synthetic": True,
                }
            )

        randomizer.shuffle(examples)
        records.extend(examples)

    return records
