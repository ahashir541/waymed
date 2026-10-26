// SAMPLE hospital data. Used by the seed script, by demo mode and as the offline fallback.
// The floor plan, doctors, schedules and hours are illustrative and must be replaced with
// real, hospital-approved data before a pilot (see README "Known limitations and pilot checklist").
// TODO: native review - every `sd` string in this file needs review by a native Sindhi speaker.
import type { HospitalData } from '../lib/types.ts';

export const sampleHospital: HospitalData = {
  version: 1,
  sample: true,
  hospital: {
    id: 'chk',
    shortName: 'CHK',
    name: {
      en: 'Civil Hospital Karachi (pilot)',
      ur: 'سول ہسپتال کراچی (پائلٹ)',
      sd: 'سول اسپتال ڪراچي (پائلٽ)', // TODO: native review
    },
    openHours: {
      en: 'Demo hours: Outpatient clinics Monday to Saturday, 8:00 am to 2:00 pm. Emergency, Laboratory and Pharmacy open 24 hours.',
      ur: 'ڈیمو اوقات: او پی ڈی پیر تا ہفتہ، صبح 8 سے دوپہر 2 بجے۔ ایمرجنسی، لیبارٹری اور فارمیسی 24 گھنٹے کھلی۔',
      sd: 'ڊيمو وقت: او پي ڊي سومر کان ڇنڇر، صبح 8 کان منجهند 2 وڳي. ايمرجنسي، ليبارٽري ۽ فارميسي 24 ڪلاڪ کليل.', // TODO: native review
    },
    helpline: '',
    address: { en: 'Baba-e-Urdu Road, Saddar, Karachi', ur: 'بابائے اردو روڈ، صدر، کراچی', sd: 'بابائي اردو روڊ، صدر، ڪراچي' }, // TODO: native review
    // Demo data: approximate gate position, not surveyed. Calibrate on site before using wrong-turn alerts.
    geo: { lat: 24.8589, lng: 67.0101, x: 100, y: 560, rotationDeg: 0, metersPerUnit: 0.12 },
  },
  departments: [
    {
      id: 'emergency',
      code: 'EMR',
      name: { en: 'Emergency', ur: 'ایمرجنسی', sd: 'ايمرجنسي' }, // TODO: native review
      color: '#C81E3A',
      icon: 'siren',
      shape: 'triangle',
      floor: 0,
      avgServiceMin: 10,
      openHours: { en: 'Open 24 hours', ur: '24 گھنٹے کھلی', sd: '24 ڪلاڪ کليل' }, // TODO: native review
      nodeId: 'door_emr',
      room: { x: 40, y: 190, w: 240, h: 110 },
      bookable: false,
      isEmergency: true,
      order: 0,
      badge: 'ER',
    },
    {
      id: 'paediatrics',
      code: 'PED',
      name: { en: 'Children (Paediatrics)', ur: 'بچوں کا شعبہ', sd: 'ٻارن جو شعبو' }, // TODO: native review
      color: '#B45309',
      icon: 'child',
      shape: 'circle',
      floor: 0,
      avgServiceMin: 8,
      openHours: { en: 'Sample: 8:00 to 14:00', ur: 'نمونہ: صبح 8 سے دوپہر 2', sd: 'نمونو: صبح 8 کان منجهند 2' }, // TODO: native review
      nodeId: 'door_ped',
      room: { x: 560, y: 20, w: 200, h: 90 },
      bookable: true,
      order: 1,
      badge: 'CH',
    },
    {
      id: 'medicine',
      code: 'MED',
      name: { en: 'Medicine (OPD)', ur: 'میڈیسن او پی ڈی', sd: 'ميڊيسن او پي ڊي' }, // TODO: native review
      color: '#1D4ED8',
      icon: 'stethoscope',
      shape: 'square',
      floor: 0,
      avgServiceMin: 8,
      openHours: { en: 'Sample: 8:00 to 14:00', ur: 'نمونہ: صبح 8 سے دوپہر 2', sd: 'نمونو: صبح 8 کان منجهند 2' }, // TODO: native review
      nodeId: 'door_med',
      room: { x: 240, y: 20, w: 200, h: 90 },
      bookable: true,
      order: 2,
      badge: 'MD',
    },
    {
      id: 'lab',
      code: 'LAB',
      name: { en: 'Laboratory', ur: 'لیبارٹری', sd: 'ليبارٽري' }, // TODO: native review
      color: '#6D28D9',
      icon: 'flask',
      shape: 'hexagon',
      floor: 0,
      avgServiceMin: 5,
      openHours: { en: 'Sample: 8:00 to 20:00', ur: 'نمونہ: صبح 8 سے رات 8', sd: 'نمونو: صبح 8 کان رات 8' }, // TODO: native review
      nodeId: 'door_lab',
      room: { x: 860, y: 170, w: 120, h: 110 },
      bookable: true,
      order: 3,
      badge: 'LB',
    },
    {
      id: 'pharmacy',
      code: 'PHA',
      name: { en: 'Pharmacy', ur: 'فارمیسی', sd: 'فارميسي' }, // TODO: native review
      color: '#047857',
      icon: 'pill',
      shape: 'diamond',
      floor: 0,
      avgServiceMin: 4,
      openHours: { en: 'Sample: 8:00 to 20:00', ur: 'نمونہ: صبح 8 سے رات 8', sd: 'نمونو: صبح 8 کان رات 8' }, // TODO: native review
      nodeId: 'door_pha',
      room: { x: 860, y: 600, w: 120, h: 30 },
      bookable: false,
      order: 4,
      badge: 'RX',
    },

    {
      id: 'surgery',
      code: 'SUR',
      badge: 'SG',
      name: { en: 'Surgery (OPD)', ur: 'سرجری او پی ڈی', sd: 'سرجري او پي ڊي' }, // TODO: native review
      color: '#0E7490',
      icon: 'scalpel',
      shape: 'square',
      floor: 0,
      avgServiceMin: 10,
      openHours: { en: 'Demo: Mon to Sat, 8:00 to 14:00', ur: 'ڈیمو: پیر تا ہفتہ، صبح 8 سے دوپہر 2', sd: 'ڊيمو: سومر کان ڇنڇر، صبح 8 کان منجهند 2' }, // TODO: native review
      nodeId: 'door_sur',
      room: { x: 250, y: 140, w: 150, h: 70 },
      bookable: true,
      order: 5,
    },
    {
      id: 'gynae',
      code: 'GYN',
      badge: 'GY',
      name: { en: 'Women (Gynaecology)', ur: 'خواتین (گائنی)', sd: 'عورتون (گائني)' }, // TODO: native review
      color: '#BE185D',
      icon: 'woman',
      shape: 'circle',
      floor: 0,
      avgServiceMin: 10,
      openHours: { en: 'Demo: Mon to Sat, 8:00 to 14:00', ur: 'ڈیمو: پیر تا ہفتہ، صبح 8 سے دوپہر 2', sd: 'ڊيمو: سومر کان ڇنڇر، صبح 8 کان منجهند 2' }, // TODO: native review
      nodeId: 'door_gyn',
      room: { x: 600, y: 140, w: 150, h: 70 },
      bookable: true,
      order: 6,
    },
    {
      id: 'ent',
      code: 'ENT',
      badge: 'EN',
      name: { en: 'ENT (Ear, Nose, Throat)', ur: 'کان، ناک اور گلا', sd: 'ڪن، نڪ ۽ ڳلو' }, // TODO: native review
      color: '#4D7C0F',
      icon: 'ear',
      shape: 'hexagon',
      floor: 0,
      avgServiceMin: 8,
      openHours: { en: 'Demo: Mon, Wed, Fri, 9:00 to 13:00', ur: 'ڈیمو: پیر، بدھ، جمعہ، صبح 9 سے دوپہر 1', sd: 'ڊيمو: سومر، اربع، جمعو، صبح 9 کان منجهند 1' }, // TODO: native review
      nodeId: 'door_ent',
      room: { x: 330, y: 592, w: 160, h: 42 },
      bookable: true,
      order: 7,
    },
    {
      id: 'eye',
      code: 'EYE',
      badge: 'EY',
      name: { en: 'Eye', ur: 'آنکھوں کا شعبہ', sd: 'اکين جو شعبو' }, // TODO: native review
      color: '#9A3412',
      icon: 'eye',
      shape: 'diamond',
      floor: 0,
      avgServiceMin: 8,
      openHours: { en: 'Demo: Tue, Thu, Sat, 9:00 to 13:00', ur: 'ڈیمو: منگل، جمعرات، ہفتہ، صبح 9 سے دوپہر 1', sd: 'ڊيمو: اڱارو، خميس، ڇنڇر، صبح 9 کان منجهند 1' }, // TODO: native review
      nodeId: 'door_eye',
      room: { x: 520, y: 592, w: 160, h: 42 },
      bookable: true,
      order: 8,
    },
    {
      id: 'radiology',
      code: 'RAD',
      badge: 'XR',
      name: { en: 'Radiology (X-ray, Ultrasound)', ur: 'ایکسرے اور الٹراساؤنڈ', sd: 'ايڪسري ۽ الٽراسائونڊ' }, // TODO: native review
      color: '#475569',
      icon: 'xray',
      shape: 'triangle',
      floor: 0,
      avgServiceMin: 6,
      openHours: { en: 'Demo: open 24 hours', ur: 'ڈیمو: 24 گھنٹے کھلا', sd: 'ڊيمو: 24 ڪلاڪ کليل' }, // TODO: native review
      nodeId: 'door_rad',
      room: { x: 860, y: 312, w: 120, h: 64 },
      bookable: false,
      order: 9,
    },
  ],
  landmarks: [
    { id: 'entrance', kind: 'landmark', hasSticker: true, x: 100, y: 560, floor: 0, name: { en: 'Main Entrance', ur: 'مرکزی دروازہ', sd: 'مکيه دروازو' } }, // TODO: native review
    { id: 'registration', kind: 'landmark', hasSticker: true, x: 260, y: 560, floor: 0, name: { en: 'Slip Room (Registration)', ur: 'پرچی کمرہ (رجسٹریشن)', sd: 'پرچي ڪمرو (رجسٽريشن)' } }, // TODO: native review
    { id: 'ramp', kind: 'waypoint', hasSticker: false, x: 100, y: 440, floor: 0, name: { en: 'Ramp', ur: 'ریمپ', sd: 'ريمپ' } }, // TODO: native review
    { id: 'junction', kind: 'landmark', hasSticker: true, x: 500, y: 400, floor: 0, name: { en: 'Main Junction', ur: 'مرکزی چوراہا', sd: 'مکيه چوواٽو' } }, // TODO: native review
    { id: 'waiting', kind: 'landmark', hasSticker: true, x: 500, y: 180, floor: 0, name: { en: 'Waiting Hall', ur: 'انتظار گاہ', sd: 'انتظار گاهه' } }, // TODO: native review
    { id: 'labCorridor', kind: 'landmark', hasSticker: true, x: 800, y: 400, floor: 0, name: { en: 'Lab Corridor', ur: 'لیب راہداری', sd: 'ليب جي لنگهه' } }, // TODO: native review
    { id: 'pharmacyGate', kind: 'landmark', hasSticker: true, x: 800, y: 560, floor: 0, name: { en: 'Pharmacy Gate', ur: 'فارمیسی گیٹ', sd: 'فارميسي گيٽ' } }, // TODO: native review
    { id: 'door_emr', kind: 'door', hasSticker: false, deptId: 'emergency', x: 160, y: 300, floor: 0, name: { en: 'Emergency door', ur: 'ایمرجنسی کا دروازہ', sd: 'ايمرجنسي جو دروازو' } }, // TODO: native review
    { id: 'door_ped', kind: 'door', hasSticker: false, deptId: 'paediatrics', x: 660, y: 110, floor: 0, name: { en: 'Children department door', ur: 'بچوں کے شعبے کا دروازہ', sd: 'ٻارن جي شعبي جو دروازو' } }, // TODO: native review
    { id: 'door_med', kind: 'door', hasSticker: false, deptId: 'medicine', x: 340, y: 110, floor: 0, name: { en: 'Medicine OPD door', ur: 'میڈیسن او پی ڈی کا دروازہ', sd: 'ميڊيسن او پي ڊي جو دروازو' } }, // TODO: native review
    { id: 'door_lab', kind: 'door', hasSticker: false, deptId: 'lab', x: 920, y: 280, floor: 0, name: { en: 'Laboratory door', ur: 'لیبارٹری کا دروازہ', sd: 'ليبارٽري جو دروازو' } }, // TODO: native review
    { id: 'door_pha', kind: 'door', hasSticker: false, deptId: 'pharmacy', x: 920, y: 600, floor: 0, name: { en: 'Pharmacy window', ur: 'فارمیسی کی کھڑکی', sd: 'فارميسي جي دري' } }, // TODO: native review

    { id: 'door_sur', kind: 'door', hasSticker: false, deptId: 'surgery', x: 420, y: 178, floor: 0, name: { en: 'Surgery OPD door', ur: 'سرجری او پی ڈی کا دروازہ', sd: 'سرجري او پي ڊي جو دروازو' } }, // TODO: native review
    { id: 'door_gyn', kind: 'door', hasSticker: false, deptId: 'gynae', x: 580, y: 178, floor: 0, name: { en: 'Women\'s clinic door', ur: 'خواتین کلینک کا دروازہ', sd: 'عورتن جي ڪلينڪ جو دروازو' } }, // TODO: native review
    { id: 'door_ent', kind: 'door', hasSticker: false, deptId: 'ent', x: 410, y: 592, floor: 0, name: { en: 'ENT clinic door', ur: 'ای این ٹی کلینک کا دروازہ', sd: 'اي اين ٽي ڪلينڪ جو دروازو' } }, // TODO: native review
    { id: 'door_eye', kind: 'door', hasSticker: false, deptId: 'eye', x: 600, y: 592, floor: 0, name: { en: 'Eye clinic door', ur: 'آنکھوں کے کلینک کا دروازہ', sd: 'اکين جي ڪلينڪ جو دروازو' } }, // TODO: native review
    { id: 'door_rad', kind: 'door', hasSticker: false, deptId: 'radiology', x: 860, y: 344, floor: 0, name: { en: 'X-ray room door', ur: 'ایکسرے روم کا دروازہ', sd: 'ايڪسري روم جو دروازو' } }, // TODO: native review
  ],
  edges: [
    { id: 'e1', a: 'entrance', b: 'registration', stepFree: true },
    { id: 'e2', a: 'registration', b: 'junction', stepFree: false, note: 'steps' },
    { id: 'e3', a: 'entrance', b: 'ramp', stepFree: true, note: 'ramp' },
    { id: 'e4', a: 'ramp', b: 'junction', stepFree: true, via: [[500, 440]] },
    { id: 'e5', a: 'junction', b: 'waiting', stepFree: true },
    { id: 'e6', a: 'junction', b: 'labCorridor', stepFree: true },
    { id: 'e7', a: 'junction', b: 'pharmacyGate', stepFree: true },
    { id: 'e8', a: 'labCorridor', b: 'pharmacyGate', stepFree: false, note: 'steps' },
    { id: 'e9', a: 'registration', b: 'pharmacyGate', stepFree: true },
    { id: 'e10', a: 'waiting', b: 'labCorridor', stepFree: false, note: 'steps' },
    { id: 'e11', a: 'entrance', b: 'door_emr', stepFree: true, note: 'ramp' },
    { id: 'e12', a: 'junction', b: 'door_emr', stepFree: true },
    { id: 'e13', a: 'waiting', b: 'door_med', stepFree: true },
    { id: 'e14', a: 'waiting', b: 'door_ped', stepFree: true },
    { id: 'e15', a: 'labCorridor', b: 'door_lab', stepFree: true },
    { id: 'e16', a: 'pharmacyGate', b: 'door_pha', stepFree: true },

    { id: 'e17', a: 'waiting', b: 'door_sur', stepFree: true },
    { id: 'e18', a: 'waiting', b: 'door_gyn', stepFree: true },
    { id: 'e19', a: 'registration', b: 'door_ent', stepFree: true, via: [[410, 575]] },
    { id: 'e20', a: 'pharmacyGate', b: 'door_eye', stepFree: true, via: [[600, 575]] },
    { id: 'e21', a: 'labCorridor', b: 'door_rad', stepFree: true },
  ],
  facilities: [
    { id: 'f_water_junction', type: 'water', nodeId: 'junction', x: 540, y: 430, name: { en: 'Drinking water', ur: 'پینے کا پانی', sd: 'پيئڻ جو پاڻي' } }, // TODO: native review
    { id: 'f_water_waiting', type: 'water', nodeId: 'waiting', x: 450, y: 215, name: { en: 'Drinking water', ur: 'پینے کا پانی', sd: 'پيئڻ جو پاڻي' } }, // TODO: native review
    { id: 'f_wc_registration', type: 'washroom', nodeId: 'registration', x: 300, y: 600, name: { en: 'Washrooms', ur: 'واش روم', sd: 'واش روم' } }, // TODO: native review
    { id: 'f_wc_waiting', type: 'washroom', nodeId: 'waiting', x: 560, y: 215, name: { en: 'Washrooms', ur: 'واش روم', sd: 'واش روم' } }, // TODO: native review
    { id: 'f_seat_waiting', type: 'seating', nodeId: 'waiting', x: 500, y: 240, name: { en: 'Shaded seating', ur: 'سایہ دار نشستیں', sd: 'ڇانوَ واريون سيٽون' } }, // TODO: native review
    { id: 'f_seat_pharmacy', type: 'seating', nodeId: 'pharmacyGate', x: 760, y: 600, name: { en: 'Shaded seating', ur: 'سایہ دار نشستیں', sd: 'ڇانوَ واريون سيٽون' } }, // TODO: native review
    { id: 'f_prayer', type: 'prayer', nodeId: 'labCorridor', x: 760, y: 360, name: { en: 'Prayer area', ur: 'نماز کی جگہ', sd: 'نماز جي جاءِ' } }, // TODO: native review
    { id: 'f_help_registration', type: 'helpdesk', nodeId: 'registration', x: 220, y: 600, name: { en: 'Help desk', ur: 'ہیلپ ڈیسک', sd: 'هيلپ ڊيسڪ' } }, // TODO: native review
    { id: 'f_help_junction', type: 'helpdesk', nodeId: 'junction', x: 460, y: 430, name: { en: 'Help desk', ur: 'ہیلپ ڈیسک', sd: 'هيلپ ڊيسڪ' } }, // TODO: native review
  ],
  doctors: [
    { id: 'd_ped_1', deptId: 'paediatrics', name: { en: 'Dr. Sample A (Children)', ur: 'ڈاکٹر نمونہ اے (بچے)', sd: 'ڊاڪٽر نمونو اي (ٻار)' }, schedule: { days: [1, 2, 3, 4, 5, 6], start: '08:00', end: '14:00' }, slotMin: 15, available: true }, // TODO: native review
    { id: 'd_ped_2', deptId: 'paediatrics', name: { en: 'Dr. Sample B (Children)', ur: 'ڈاکٹر نمونہ بی (بچے)', sd: 'ڊاڪٽر نمونو بي (ٻار)' }, schedule: { days: [0, 1, 3, 5], start: '10:00', end: '18:00' }, slotMin: 20, available: true }, // TODO: native review
    { id: 'd_med_1', deptId: 'medicine', name: { en: 'Dr. Sample C (Medicine)', ur: 'ڈاکٹر نمونہ سی (میڈیسن)', sd: 'ڊاڪٽر نمونو سي (ميڊيسن)' }, schedule: { days: [1, 2, 3, 4, 5, 6], start: '08:00', end: '14:00' }, slotMin: 15, available: true }, // TODO: native review
    { id: 'd_med_2', deptId: 'medicine', name: { en: 'Dr. Sample D (Medicine)', ur: 'ڈاکٹر نمونہ ڈی (میڈیسن)', sd: 'ڊاڪٽر نمونو ڊي (ميڊيسن)' }, schedule: { days: [0, 2, 4, 6], start: '14:00', end: '20:00' }, slotMin: 15, available: true }, // TODO: native review
    { id: 'd_lab_1', deptId: 'lab', name: { en: 'Sample collection counter', ur: 'نمونہ جمع کرنے کا کاؤنٹر', sd: 'نمونو گڏ ڪرڻ جو ڪائونٽر' }, schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '20:00' }, slotMin: 10, available: true }, // TODO: native review

    { id: 'd_sur_1', deptId: 'surgery', name: { en: 'Dr. Imran Qureshi (demo)', ur: 'ڈاکٹر عمران قریشی (ڈیمو)', sd: 'ڊاڪٽر عمران قريشي (ڊيمو)' }, schedule: { days: [1, 2, 3, 4, 5, 6], start: '08:00', end: '14:00' }, slotMin: 15, available: true }, // TODO: native review
    { id: 'd_gyn_1', deptId: 'gynae', name: { en: 'Dr. Farah Memon (demo)', ur: 'ڈاکٹر فرح میمن (ڈیمو)', sd: 'ڊاڪٽر فرح ميمڻ (ڊيمو)' }, schedule: { days: [1, 2, 3, 4, 5, 6], start: '08:00', end: '14:00' }, slotMin: 15, available: true }, // TODO: native review
    { id: 'd_gyn_2', deptId: 'gynae', name: { en: 'Dr. Nadia Shah (demo)', ur: 'ڈاکٹر نادیہ شاہ (ڈیمو)', sd: 'ڊاڪٽر ناديه شاهه (ڊيمو)' }, schedule: { days: [0, 2, 4, 6], start: '14:00', end: '20:00' }, slotMin: 20, available: true }, // TODO: native review
    { id: 'd_ent_1', deptId: 'ent', name: { en: 'Dr. Kashif Baloch (demo)', ur: 'ڈاکٹر کاشف بلوچ (ڈیمو)', sd: 'ڊاڪٽر ڪاشف بلوچ (ڊيمو)' }, schedule: { days: [1, 3, 5], start: '09:00', end: '13:00' }, slotMin: 15, available: true }, // TODO: native review
    { id: 'd_eye_1', deptId: 'eye', name: { en: 'Dr. Sana Abbasi (demo)', ur: 'ڈاکٹر ثنا عباسی (ڈیمو)', sd: 'ڊاڪٽر ثنا عباسي (ڊيمو)' }, schedule: { days: [2, 4, 6], start: '09:00', end: '13:00' }, slotMin: 15, available: true }, // TODO: native review
  ],
  kiosks: [
    { id: 'k_entrance', name: 'Entrance kiosk', landmarkId: 'entrance' },
    { id: 'k_junction', name: 'Main Junction kiosk', landmarkId: 'junction' },
  ],
};
