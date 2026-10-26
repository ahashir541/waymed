// Design-thinking story content for the presenter show, "Walk in their shoes" and the journey map.
// Uses ONLY the interview evidence from Civil Hospital Karachi. No invented statistics.
// "Expected" feelings are hypotheses to be tested in the pilot, and are labelled as such.
// TODO: native review - every `sd` string in this file needs review by a native Sindhi speaker.
import type { L10n } from '../lib/types.ts';

export const HMW: L10n = {
  en: 'How might we help first-time visitors reach the right department the first time?',
  ur: 'ہم پہلی بار آنے والوں کو پہلی ہی بار صحیح شعبے تک پہنچنے میں کیسے مدد کر سکتے ہیں؟',
  sd: 'اسين پهريون ڀيرو ايندڙن کي پهرين ئي ڀيري صحيح شعبي تائين پهچڻ ۾ ڪيئن مدد ڪري سگهون ٿا؟', // TODO: native review
};

export interface Persona {
  id: 'khurshid' | 'shams' | 'ashok' | 'abdullah' | 'tahira' | 'adil';
  code: string;
  name: L10n;
  role: L10n;
  evidence: L10n[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'khurshid',
    code: 'P1',
    name: { en: 'Khurshid', ur: 'خورشید', sd: 'خورشيد' }, // TODO: native review
    role: { en: 'Attendant from Thatta', ur: 'تیماردار، ٹھٹھہ سے', sd: 'سنڀاليندڙ، ٺٽي کان' }, // TODO: native review
    evidence: [
      { en: 'Did not know where to go or whom to ask.', ur: 'نہیں جانتے تھے کہاں جائیں یا کس سے پوچھیں۔', sd: 'خبر نه هئي ته ڪٿي وڃن يا ڪنهن کان پڇن.' }, // TODO: native review
      { en: 'No place for attendants to sit; told to move on.', ur: 'تیمارداروں کے بیٹھنے کی جگہ نہیں؛ آگے بڑھنے کو کہا گیا۔', sd: 'سنڀاليندڙن لاءِ ويهڻ جي جاءِ ناهي؛ اڳتي وڃڻ لاءِ چيو ويو.' }, // TODO: native review
      { en: 'Early discharge with unclear follow-up.', ur: 'جلد چھٹی، مگر آگے کیا کرنا ہے واضح نہیں۔', sd: 'جلد موڪل، پر اڳتي ڇا ڪجي واضح ناهي.' }, // TODO: native review
    ],
  },
  {
    id: 'shams',
    code: 'P2',
    name: { en: 'Shams', ur: 'شمس', sd: 'شمس' }, // TODO: native review
    role: { en: 'Father of a 7-year-old', ur: '7 سالہ بچے کے والد', sd: '7 سالن جي ٻار جو پيءُ' }, // TODO: native review
    evidence: [
      { en: 'One person said "emergency no. 3", another sent him elsewhere.', ur: 'ایک نے کہا "ایمرجنسی نمبر 3"، دوسرے نے کہیں اور بھیج دیا۔', sd: 'هڪ چيو "ايمرجنسي نمبر 3"، ٻئي ڪنهن ٻئي هنڌ موڪليو.' }, // TODO: native review
      { en: 'Hours lost while the child got worse.', ur: 'گھنٹے ضائع ہوئے اور بچے کی حالت بگڑتی رہی۔', sd: 'ڪلاڪ ضايع ٿيا ۽ ٻار جي حالت خراب ٿيندي رهي.' }, // TODO: native review
      { en: 'No news from inside.', ur: 'اندر سے کوئی خبر نہیں۔', sd: 'اندران ڪا خبر ناهي.' }, // TODO: native review
      { en: 'The mother could not follow medical language.', ur: 'ماں طبی زبان نہیں سمجھ پائیں۔', sd: 'ماءُ طبي ٻولي سمجهي نه سگهي.' }, // TODO: native review
    ],
  },
  {
    id: 'ashok',
    code: 'P3',
    name: { en: 'Ashok', ur: 'اشوک', sd: 'اشوڪ' }, // TODO: native review
    role: { en: 'Attendant from Sanghar', ur: 'تیماردار، سانگھڑ سے', sd: 'سنڀاليندڙ، سانگهڙ کان' }, // TODO: native review
    evidence: [
      { en: 'Lab reports pending for weeks.', ur: 'لیب رپورٹیں ہفتوں سے رکی ہوئی۔', sd: 'ليب رپورٽون هفتن کان رڪيل.' }, // TODO: native review
      { en: 'The family slept on the floor.', ur: 'گھر والے فرش پر سوئے۔', sd: 'گهر وارا فرش تي سمهيا.' }, // TODO: native review
      { en: 'Daily food costs.', ur: 'روزانہ کھانے کا خرچ۔', sd: 'روزانو کاڌي جو خرچ.' }, // TODO: native review
    ],
  },
  {
    id: 'abdullah',
    code: 'S1',
    name: { en: 'Abdullah', ur: 'عبداللہ', sd: 'عبدالله' }, // TODO: native review
    role: { en: "Doctor's assistant", ur: 'ڈاکٹر کے معاون', sd: 'ڊاڪٽر جو مددگار' }, // TODO: native review
    evidence: [
      { en: 'Patients arrive with little early guidance.', ur: 'مریض بہت کم ابتدائی رہنمائی کے ساتھ آتے ہیں۔', sd: 'مريض تمام گهٽ شروعاتي رهنمائي سان اچن ٿا.' }, // TODO: native review
      { en: 'There is a follow-up gap.', ur: 'دوبارہ آنے میں خلا ہے۔', sd: 'ٻيهر اچڻ ۾ خال آهي.' }, // TODO: native review
    ],
  },
  {
    id: 'tahira',
    code: 'D1',
    name: { en: 'Dr. Tahira', ur: 'ڈاکٹر طاہرہ', sd: 'ڊاڪٽر طاهره' }, // TODO: native review
    role: { en: 'Child specialist, Child Emergency', ur: 'ماہر اطفال، چائلڈ ایمرجنسی', sd: 'ٻارن جي ماهر، چائلڊ ايمرجنسي' }, // TODO: native review
    evidence: [
      { en: 'Reported 6 to 9 attendants crowding each child.', ur: 'بتایا کہ ہر بچے کے گرد 6 سے 9 تیماردار ہوتے ہیں۔', sd: 'ٻڌايو ته هر ٻار جي چوڌاري 6 کان 9 سنڀاليندڙ هوندا آهن.' }, // TODO: native review
      { en: 'Pharmacy is not digitised; shifts are irregular.', ur: 'فارمیسی ڈیجیٹل نہیں؛ شفٹیں بے قاعدہ ہیں۔', sd: 'فارميسي ڊجيٽل ناهي؛ شفٽون بي ترتيب آهن.' }, // TODO: native review
    ],
  },
  {
    id: 'adil',
    code: 'S2',
    name: { en: 'Adil', ur: 'عادل', sd: 'عادل' }, // TODO: native review
    role: { en: 'Nurse intern, Emergency', ur: 'نرس انٹرن، ایمرجنسی', sd: 'نرس انٽرن، ايمرجنسي' }, // TODO: native review
    evidence: [
      { en: 'Sometimes a patient needs a doctor but only an intern is there.', ur: 'کبھی مریض کو ڈاکٹر چاہیے ہوتا ہے مگر صرف انٹرن موجود ہوتا ہے۔', sd: 'ڪڏهن مريض کي ڊاڪٽر گهرجي پر رڳو انٽرن موجود هوندو آهي.' }, // TODO: native review
      { en: 'About 6 people crowd around each patient, with few resources.', ur: 'ہر مریض کے گرد تقریباً 6 لوگ، وسائل کم۔', sd: 'هر مريض جي چوڌاري لڳ ڀڳ 6 ماڻهو، وسيلا گهٽ.' }, // TODO: native review
    ],
  },
];

export type Mood = 'lost' | 'worried' | 'tired' | 'oriented' | 'informed' | 'calm';
export const MOOD_ICON: Record<Mood, string> = { lost: 'compass', worried: 'alert', tired: 'clock', oriented: 'route', informed: 'bell', calm: 'check' };
export const MOOD_LABEL: Record<Mood, L10n> = {
  lost: { en: 'Lost', ur: 'گم', sd: 'گم' }, // TODO: native review
  worried: { en: 'Worried', ur: 'پریشان', sd: 'پريشان' }, // TODO: native review
  tired: { en: 'Exhausted', ur: 'تھکا ہوا', sd: 'ٿڪل' }, // TODO: native review
  oriented: { en: 'Knows the way', ur: 'راستہ معلوم', sd: 'رستو معلوم' }, // TODO: native review
  informed: { en: 'Informed', ur: 'باخبر', sd: 'باخبر' }, // TODO: native review
  calm: { en: 'Calmer', ur: 'پرسکون', sd: 'پرسڪون' }, // TODO: native review
};

export interface WalkStep {
  today: { text: L10n; mood: Mood };
  waymed: { text: L10n; mood: Mood; feature: L10n };
}

export const WALKS: Record<'khurshid' | 'shams' | 'ashok', WalkStep[]> = {
  khurshid: [
    {
      today: { text: { en: 'Arrives with the patient. Does not know where to go or whom to ask.', ur: 'مریض کے ساتھ پہنچے۔ نہیں جانتے کہاں جائیں یا کس سے پوچھیں۔', sd: 'مريض سان پهتو. خبر ناهي ڪٿي وڃي يا ڪنهن کان پڇي.' }, mood: 'lost' }, // TODO: native review
      waymed: { text: { en: 'Scans the entrance QR, picks Urdu, taps the department card. A route appears.', ur: 'داخلے کا کیو آر اسکین، اردو چنی، شعبے کا کارڈ دبایا۔ راستہ سامنے۔', sd: 'داخلا جو ڪيو آر اسڪين، سنڌي چونڊي، شعبي جو ڪارڊ دٻايو. رستو سامهون.' }, mood: 'oriented', feature: { en: 'Language first + route', ur: 'پہلے زبان + راستہ', sd: 'پهريان ٻولي + رستو' } }, // TODO: native review
    },
    {
      today: { text: { en: 'No place to sit. Told to move on.', ur: 'بیٹھنے کی جگہ نہیں۔ آگے بڑھنے کو کہا گیا۔', sd: 'ويهڻ جي جاءِ ناهي. اڳتي وڃڻ لاءِ چيو ويو.' }, mood: 'tired' }, // TODO: native review
      waymed: { text: { en: 'The family page shows shaded seating and water near the waiting hall.', ur: 'گھر والوں کے صفحے پر انتظار گاہ کے قریب سایہ دار نشستیں اور پانی۔', sd: 'گهر وارن جي صفحي تي انتظار گاهه ويجهو ڇانوَ واريون سيٽون ۽ پاڻي.' }, mood: 'calm', feature: { en: 'Facilities layer', ur: 'سہولیات کی تہہ', sd: 'سهولتن جي تهه' } }, // TODO: native review
    },
    {
      today: { text: { en: 'Early discharge. What next is unclear.', ur: 'جلد چھٹی۔ آگے کیا کرنا ہے واضح نہیں۔', sd: 'جلد موڪل. اڳتي ڇا ڪجي واضح ناهي.' }, mood: 'worried' }, // TODO: native review
      waymed: { text: { en: 'A follow-up card in simple Urdu and Sindhi: next date, bring reports, come to Emergency if worse.', ur: 'سادہ اردو اور سندھی میں کارڈ: اگلی تاریخ، رپورٹیں لائیں، حالت خراب ہو تو ایمرجنسی۔', sd: 'سادي اردو ۽ سنڌي ۾ ڪارڊ: ايندڙ تاريخ، رپورٽون آڻيو، حالت خراب ٿئي ته ايمرجنسي.' }, mood: 'informed', feature: { en: 'Follow-up card', ur: 'دوبارہ آنے کا کارڈ', sd: 'ٻيهر اچڻ جو ڪارڊ' } }, // TODO: native review
    },
  ],
  shams: [
    {
      today: { text: { en: 'Child unwell. One person says "emergency no. 3", another points elsewhere.', ur: 'بچہ بیمار۔ ایک کہتا ہے "ایمرجنسی نمبر 3"، دوسرا کہیں اور۔', sd: 'ٻار بيمار. هڪ چوي "ايمرجنسي نمبر 3"، ٻيو ڪنهن ٻئي هنڌ.' }, mood: 'lost' }, // TODO: native review
      waymed: { text: { en: 'Presses the red Emergency button: one fastest route from where he stands, no slip needed.', ur: 'سرخ ایمرجنسی بٹن: جہاں کھڑے ہیں وہاں سے ایک تیز ترین راستہ، پرچی کی ضرورت نہیں۔', sd: 'ڳاڙهو ايمرجنسي بٽڻ: جتي بيٺو آهي اتان هڪ تيز رستو، پرچي جي ضرورت ناهي.' }, mood: 'oriented', feature: { en: 'Emergency button', ur: 'ایمرجنسی بٹن', sd: 'ايمرجنسي بٽڻ' } }, // TODO: native review
    },
    {
      today: { text: { en: 'Hours lost walking between places while the child gets worse.', ur: 'جگہ جگہ چلتے گھنٹے ضائع، بچے کی حالت بگڑتی رہی۔', sd: 'هنڌ هنڌ هلندي ڪلاڪ ضايع، ٻار جي حالت خراب ٿيندي رهي.' }, mood: 'worried' }, // TODO: native review
      waymed: { text: { en: 'A wrong turn? The QR on the next sign shows "You are here" and the corrected route.', ur: 'غلط موڑ؟ اگلے نشان کا کیو آر "آپ یہاں ہیں" اور درست راستہ دکھاتا ہے۔', sd: 'غلط موڙ؟ ايندڙ نشان جو ڪيو آر "توهان هتي آهيو" ۽ درست رستو ڏيکاري ٿو.' }, mood: 'oriented', feature: { en: 'Landmark QR', ur: 'مقام کا کیو آر', sd: 'جاءِ جو ڪيو آر' } }, // TODO: native review
    },
    {
      today: { text: { en: 'No news from inside.', ur: 'اندر سے کوئی خبر نہیں۔', sd: 'اندران ڪا خبر ناهي.' }, mood: 'worried' }, // TODO: native review
      waymed: { text: { en: 'The token page shows waiting, you are next, your turn, and the family can follow it too.', ur: 'ٹوکن صفحہ: انتظار، اگلی باری، اب باری۔ گھر والے بھی دیکھ سکتے ہیں۔', sd: 'ٽوڪن صفحو: انتظار، ايندڙ واري، هاڻي واري. گهر وارا به ڏسي سگهن ٿا.' }, mood: 'informed', feature: { en: 'Live status + family share', ur: 'تازہ صورتحال + گھر والے', sd: 'تازي صورتحال + گهر وارا' } }, // TODO: native review
    },
    {
      today: { text: { en: 'The mother cannot follow medical language.', ur: 'ماں طبی زبان نہیں سمجھ پاتیں۔', sd: 'ماءُ طبي ٻولي سمجهي نٿي سگهي.' }, mood: 'lost' }, // TODO: native review
      waymed: { text: { en: 'Every screen in Sindhi or Urdu, with icons and a Listen button.', ur: 'ہر اسکرین سندھی یا اردو میں، نشانات اور "سنیں" بٹن کے ساتھ۔', sd: 'هر اسڪرين سنڌي يا اردو ۾، نشانين ۽ "ٻڌو" بٽڻ سان.' }, mood: 'calm', feature: { en: 'Three languages + voice', ur: 'تین زبانیں + آواز', sd: 'ٽي ٻوليون + آواز' } }, // TODO: native review
    },
  ],
  ashok: [
    {
      today: { text: { en: 'Lab reports pending for weeks. Keeps coming back to ask.', ur: 'لیب رپورٹیں ہفتوں سے رکی۔ بار بار پوچھنے آتے ہیں۔', sd: 'ليب رپورٽون هفتن کان رڪيل. بار بار پڇڻ اچي ٿو.' }, mood: 'tired' }, // TODO: native review
      waymed: { text: { en: 'A lab token shows its live status, so a trip to ask is not needed. (WayMed cannot speed up the lab itself.)', ur: 'لیب ٹوکن کی تازہ صورتحال، پوچھنے آنے کی ضرورت نہیں۔ (لیب کا کام تیز نہیں کرتا۔)', sd: 'ليب ٽوڪن جي تازي صورتحال، پڇڻ اچڻ جي ضرورت ناهي. (ليب جو ڪم تيز نٿو ڪري.)' }, mood: 'informed', feature: { en: 'Token status', ur: 'ٹوکن صورتحال', sd: 'ٽوڪن صورتحال' } }, // TODO: native review
    },
    {
      today: { text: { en: 'The family sleeps on the floor.', ur: 'گھر والے فرش پر سوتے ہیں۔', sd: 'گهر وارا فرش تي سمهن ٿا.' }, mood: 'tired' }, // TODO: native review
      waymed: { text: { en: 'The plan shows shaded seating, water and washrooms. Beds for families need a hospital decision.', ur: 'نقشے پر سایہ دار نشستیں، پانی اور واش روم۔ گھر والوں کے بستر ہسپتال کا فیصلہ ہے۔', sd: 'نقشي تي ڇانوَ واريون سيٽون، پاڻي ۽ واش روم. گهر وارن جا بسترا اسپتال جو فيصلو.' }, mood: 'calm', feature: { en: 'Facilities layer', ur: 'سہولیات کی تہہ', sd: 'سهولتن جي تهه' } }, // TODO: native review
    },
    {
      today: { text: { en: 'Daily food costs add up.', ur: 'روزانہ کھانے کا خرچ بڑھتا جاتا ہے۔', sd: 'روزانو کاڌي جو خرچ وڌندو وڃي.' }, mood: 'worried' }, // TODO: native review
      waymed: { text: { en: 'The pre-visit page says what to bring, aiming for fewer wasted trips (hypothesis).', ur: 'آنے سے پہلے کا صفحہ بتاتا ہے کیا لائیں، تاکہ کم چکر لگیں (مفروضہ)۔', sd: 'اچڻ کان اڳ وارو صفحو ٻڌائي ته ڇا آڻجي، ته جيئن گهٽ چڪر لڳن (مفروضو).' }, mood: 'oriented', feature: { en: 'Pre-visit page', ur: 'آنے سے پہلے', sd: 'اچڻ کان اڳ' } }, // TODO: native review
    },
  ],
};

export interface JourneyStage {
  stage: L10n;
  today: L10n;
  source: string;
  expected: L10n;
  feature: L10n;
}

export const JOURNEY: JourneyStage[] = [
  {
    stage: { en: 'Arrive', ur: 'پہنچنا', sd: 'پهچڻ' }, // TODO: native review
    today: { en: 'Lost: did not know where to go or whom to ask', ur: 'گم: کہاں جائیں، کس سے پوچھیں', sd: 'گم: ڪٿي وڃون، ڪنهن کان پڇون' }, // TODO: native review
    source: 'P1, S1',
    expected: { en: 'Welcomed in my own language', ur: 'اپنی زبان میں خوش آمدید', sd: 'پنهنجي ٻوليءَ ۾ ڀليڪار' }, // TODO: native review
    feature: { en: 'Language first, pre-visit page', ur: 'پہلے زبان، آنے سے پہلے', sd: 'پهريان ٻولي، اچڻ کان اڳ' }, // TODO: native review
  },
  {
    stage: { en: 'Find the way', ur: 'راستہ ڈھونڈنا', sd: 'رستو ڳولڻ' }, // TODO: native review
    today: { en: 'Conflicting directions ("emergency no. 3")', ur: 'متضاد ہدایات ("ایمرجنسی نمبر 3")', sd: 'متضاد هدايتون ("ايمرجنسي نمبر 3")' }, // TODO: native review
    source: 'P2',
    expected: { en: 'One clear route, one colour and shape', ur: 'ایک واضح راستہ، ایک رنگ اور شکل', sd: 'هڪ واضح رستو، هڪ رنگ ۽ شڪل' }, // TODO: native review
    feature: { en: 'Slip QR, route, department signs', ur: 'پرچی کیو آر، راستہ، نشان', sd: 'پرچي ڪيو آر، رستو، نشان' }, // TODO: native review
  },
  {
    stage: { en: 'Wrong turn', ur: 'غلط موڑ', sd: 'غلط موڙ' }, // TODO: native review
    today: { en: 'Hours lost while the child got worse', ur: 'گھنٹے ضائع، بچہ بگڑتا رہا', sd: 'ڪلاڪ ضايع، ٻار خراب ٿيندو رهيو' }, // TODO: native review
    source: 'P2',
    expected: { en: 'Corrected at the next sign', ur: 'اگلے نشان پر درستی', sd: 'ايندڙ نشان تي درستي' }, // TODO: native review
    feature: { en: 'Landmark QR, "I feel lost", guide', ur: 'مقام کیو آر، "راستہ بھول گیا"، رہنما', sd: 'جاءِ ڪيو آر، "رستو ڀلجي ويو"، رهنما' }, // TODO: native review
  },
  {
    stage: { en: 'Wait', ur: 'انتظار', sd: 'انتظار' }, // TODO: native review
    today: { en: 'No news; nowhere to sit; told to move on', ur: 'کوئی خبر نہیں؛ بیٹھنے کی جگہ نہیں', sd: 'ڪا خبر ناهي؛ ويهڻ جي جاءِ ناهي' }, // TODO: native review
    source: 'P2, P1, P3',
    expected: { en: 'I know my place in line and where to sit', ur: 'قطار میں اپنی جگہ اور بیٹھنے کی جگہ معلوم', sd: 'قطار ۾ پنهنجي جاءِ ۽ ويهڻ جي جاءِ معلوم' }, // TODO: native review
    feature: { en: 'Live status, board, facilities, family page', ur: 'تازہ صورتحال، بورڈ، سہولیات', sd: 'تازي صورتحال، بورڊ، سهولتون' }, // TODO: native review
  },
  {
    stage: { en: 'Consultation', ur: 'معائنہ', sd: 'معائنو' }, // TODO: native review
    today: { en: 'Medical language hard to follow; follow-up unclear', ur: 'طبی زبان مشکل؛ آگے واضح نہیں', sd: 'طبي ٻولي ڏکي؛ اڳتي واضح ناهي' }, // TODO: native review
    source: 'P2, P1, S1',
    expected: { en: 'I leave knowing when to come back', ur: 'معلوم کہ دوبارہ کب آنا ہے', sd: 'معلوم ته ٻيهر ڪڏهن اچڻو آهي' }, // TODO: native review
    feature: { en: 'Your-turn alert, follow-up card', ur: 'باری کی اطلاع، کارڈ', sd: 'واري جي اطلاع، ڪارڊ' }, // TODO: native review
  },
];

export const FEATURE_EVIDENCE: { feature: L10n; evidence: string; icon: string }[] = [
  { icon: 'globe', feature: { en: 'Language first, Listen button', ur: 'پہلے زبان، سنیں بٹن', sd: 'پهريان ٻولي، ٻڌو بٽڻ' }, evidence: 'P2: mother could not follow medical language' }, // TODO: native review
  { icon: 'siren', feature: { en: 'One route + Emergency button', ur: 'ایک راستہ + ایمرجنسی بٹن', sd: 'هڪ رستو + ايمرجنسي بٽڻ' }, evidence: 'P2: "emergency no. 3" vs elsewhere' }, // TODO: native review
  { icon: 'qr', feature: { en: 'Landmark QR + "I feel lost"', ur: 'مقام کیو آر + راستہ بھول گیا', sd: 'جاءِ ڪيو آر + رستو ڀلجي ويو' }, evidence: 'P1: whom to ask · P2: hours lost' }, // TODO: native review
  { icon: 'bell', feature: { en: 'Live token status + family share', ur: 'تازہ ٹوکن + گھر والے', sd: 'تازو ٽوڪن + گهر وارا' }, evidence: 'P2: no news from inside · P3: reports pending' }, // TODO: native review
  { icon: 'seating', feature: { en: 'Facilities layer', ur: 'سہولیات کی تہہ', sd: 'سهولتن جي تهه' }, evidence: 'P1: no place to sit · P3: slept on the floor' }, // TODO: native review
  { icon: 'calendar', feature: { en: 'Follow-up card, pre-visit page', ur: 'کارڈ، آنے سے پہلے', sd: 'ڪارڊ، اچڻ کان اڳ' }, evidence: 'P1: unclear follow-up · S1: little early guidance' }, // TODO: native review
  { icon: 'users', feature: { en: '"One or two attendants" guidance', ur: '"ایک یا دو تیماردار"', sd: '"هڪ يا ٻه سنڀاليندڙ"' }, evidence: 'D1: 6 to 9 attendants per child' }, // TODO: native review
];

export const REJECTED: { idea: L10n; why: L10n }[] = [
  { idea: { en: 'Camera tracking of visitors', ur: 'کیمرے سے نگرانی', sd: 'ڪئميرا سان نگراني' }, why: { en: 'Privacy, cost, maintenance', ur: 'رازداری، خرچ، دیکھ بھال', sd: 'رازداري، خرچ، سار سنڀال' } }, // TODO: native review
  { idea: { en: 'Walking guide robots', ur: 'چلنے والے روبوٹ', sd: 'هلندڙ روبوٽ' }, why: { en: 'Cost', ur: 'خرچ', sd: 'خرچ' } }, // TODO: native review
];

export const PILOT: L10n[] = [
  { en: 'One department, two weeks', ur: 'ایک شعبہ، دو ہفتے', sd: 'هڪ شعبو، ٻه هفتا' }, // TODO: native review
  { en: 'Measure: task success rate', ur: 'پیمائش: کام میں کامیابی کی شرح', sd: 'ماپ: ڪم ۾ ڪاميابي جي شرح' }, // TODO: native review
  { en: 'Measure: time to reach the department', ur: 'پیمائش: شعبے تک پہنچنے کا وقت', sd: 'ماپ: شعبي تائين پهچڻ جو وقت' }, // TODO: native review
  { en: 'Measure: first-time-right rate (one-tap question)', ur: 'پیمائش: پہلی بار صحیح پہنچنے کی شرح', sd: 'ماپ: پهريون ڀيرو صحيح پهچڻ جي شرح' }, // TODO: native review
  { en: 'Before: hospital approval, signage, real schedules, staff training, Sindhi review', ur: 'پہلے: ہسپتال کی منظوری، نشانات، اصل اوقات، تربیت، سندھی جانچ', sd: 'اڳ ۾: اسپتال جي منظوري، نشان، اصل وقت، تربيت، سنڌي جانچ' }, // TODO: native review
];

// The team's full research wall (34 stickies, 6 people, 5 themes), from the field visit.
// Sticky text keeps its original wording; group titles have Urdu/Sindhi drafts (TODO: native review).
import research from './research.json' with { type: 'json' };

export interface ResearchGroup {
  code: string;
  title: { en: string; ur: string | null; sd: string | null };
  insight: { en: string; ur: string | null; sd: string | null };
}
export interface Sticky {
  number: number;
  code: string;
  group: string;
  type: string;
  text: string;
}
export const RESEARCH = research as { personas: { code: string; name: string; role: string }[]; groups: ResearchGroup[]; stickies: Sticky[] };
