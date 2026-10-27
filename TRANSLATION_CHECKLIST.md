# Sindhi translation checklist (native review)

Every Sindhi string in WayMed is a **draft** marked `TODO: native review` in the code.
A native Sindhi speaker should check each row, correct it in the source file, tick the box,
and then remove the `// TODO: native review` marker on that line.

- UI strings: `src/lib/i18n/sd.ts`
- Hospital data: `src/data/sampleHospital.ts` (replace with real data in /admin before the pilot)
- Story and presenter content: `src/data/story.ts`
- Assistant keywords (Sindhi words the assistant understands): `src/lib/assistantRules.ts`
- Voice recordings for phones without a Sindhi voice: `public/audio/sd/README.md`

Review **safety strings first** (Emergency, medical-advice refusal, "come to Emergency if worse", token status).
Also check that simple, everyday Sindhi is used for visitors with low literacy.

Total strings: 680

| Done | Area | Key | English | Urdu | Sindhi (draft) |
|---|---|---|---|---|---|
| [ ] | UI (safety) | `emergency.button` | Emergency | ایمرجنسی | ايمرجنسي |
| [ ] | UI (safety) | `emergency.title` | Emergency | ایمرجنسی | ايمرجنسي |
| [ ] | UI (safety) | `emergency.lead` | Go straight to Emergency. You do not need a slip. | سیدھا ایمرجنسی جائیں۔ پرچی کی ضرورت نہیں۔ | سڌو ايمرجنسي وڃو. پرچي جي ضرورت ناهي. |
| [ ] | UI (safety) | `emergency.callStaff` | Tell the nearest staff member or guard "Emergency". They will help you at once. | قریبی عملے یا گارڈ کو بتائیں "ایمرجنسی"۔ وہ فوراً مدد کریں گے۔ | ويجهي عملي يا گارڊ کي ٻڌايو "ايمرجنسي". اهي هڪدم مدد ڪندا. |
| [ ] | UI (safety) | `emergency.where` | Where are you now? | آپ ابھی کہاں ہیں؟ | توهان هن وقت ڪٿي آهيو؟ |
| [ ] | UI (safety) | `emergency.speak` | Go straight to Emergency. Follow the red route. Tell any staff member it is an emergency. | سیدھا ایمرجنسی جائیں۔ سرخ راستے پر چلیں۔ کسی بھی عملے کو بتائیں کہ ایمرجنسی ہے۔ | سڌو ايمرجنسي وڃو. ڳاڙهي رستي تي هلو. ڪنهن به عملي کي ٻڌايو ته ايمرجنسي آهي. |
| [ ] | UI (safety) | `token.status.waiting` | Waiting | انتظار | انتظار |
| [ ] | UI (safety) | `token.status.next` | You are next | اگلی باری آپ کی ہے | ايندڙ واري توهان جي آهي |
| [ ] | UI (safety) | `token.status.called` | Your turn now | اب آپ کی باری ہے | هاڻي توهان جي واري آهي |
| [ ] | UI (safety) | `token.status.done` | Visit finished | ملاقات مکمل | ملاقات پوري |
| [ ] | UI (safety) | `token.status.skipped` | Missed. Please go to the Slip Room. | باری نکل گئی۔ رجسٹریشن کاؤنٹر پر جائیں۔ | واري نڪري وئي. رجسٽريشن ڪائونٽر تي وڃو. |
| [ ] | UI (safety) | `prepare.emergencyNote` | In an emergency, do not wait: go straight to Emergency. | ایمرجنسی میں انتظار نہ کریں: سیدھا ایمرجنسی جائیں۔ | ايمرجنسي ۾ انتظار نه ڪريو: سڌو ايمرجنسي وڃو. |
| [ ] | UI (safety) | `followup.r4` | If the patient gets worse, come to Emergency at once. Do not wait for the date. | اگر مریض کی حالت خراب ہو تو فوراً ایمرجنسی آئیں۔ تاریخ کا انتظار نہ کریں۔ | جيڪڏهن مريض جي حالت خراب ٿئي ته هڪدم ايمرجنسي اچو. تاريخ جو انتظار نه ڪريو. |
| [ ] | UI (safety) | `assistant.ans.emergency` | This sounds urgent. Go to Emergency now. I am showing the route. Tell the nearest staff member it is an emergency. | یہ فوری معاملہ لگتا ہے۔ ابھی ایمرجنسی جائیں۔ میں راستہ دکھا رہا ہوں۔ قریبی عملے کو بتائیں کہ ایمرجنسی ہے۔ | هي تڪڙو معاملو لڳي ٿو. هاڻي ايمرجنسي وڃو. مان رستو ڏيکاري رهيو آهيان. ويجهي عملي کي ٻڌايو ته ايمرجنسي آهي. |
| [ ] | UI (safety) | `assistant.ans.medical` | I cannot give medical advice or a diagnosis. Please ask a doctor or nurse. If it is urgent, go to Emergency now. | میں طبی مشورہ یا تشخیص نہیں دے سکتا۔ ڈاکٹر یا نرس سے پوچھیں۔ اگر فوری ہے تو ابھی ایمرجنسی جائیں۔ | مان طبي صلاح يا تشخيص نٿو ڏئي سگهان. ڊاڪٽر يا نرس کان پڇو. جيڪڏهن تڪڙو آهي ته هاڻي ايمرجنسي وڃو. |
| [ ] | UI | `app.name` | WayMed | وے میڈ | وي ميڊ |
| [ ] | UI | `app.tagline` | Guidance Network | رہنمائی نیٹ ورک | رهنمائي نيٽ ورڪ |
| [ ] | UI | `app.skip` | Skip to content | مواد پر جائیں | مواد ڏانهن وڃو |
| [ ] | UI | `common.back` | Back | واپس | واپس |
| [ ] | UI | `common.next` | Next | آگے | اڳيون |
| [ ] | UI | `common.close` | Close | بند کریں | بند ڪريو |
| [ ] | UI | `common.cancel` | Cancel | منسوخ | رد ڪريو |
| [ ] | UI | `common.save` | Save | محفوظ کریں | محفوظ ڪريو |
| [ ] | UI | `common.saved` | Saved | محفوظ ہو گیا | محفوظ ٿي ويو |
| [ ] | UI | `common.delete` | Delete | حذف کریں | ختم ڪريو |
| [ ] | UI | `common.edit` | Edit | تبدیل کریں | تبديل ڪريو |
| [ ] | UI | `common.add` | Add | شامل کریں | شامل ڪريو |
| [ ] | UI | `common.print` | Print | پرنٹ کریں | پرنٽ ڪريو |
| [ ] | UI | `common.share` | Share | شیئر کریں | شيئر ڪريو |
| [ ] | UI | `common.copy` | Copy link | لنک کاپی کریں | لنڪ ڪاپي ڪريو |
| [ ] | UI | `common.copied` | Link copied | لنک کاپی ہو گیا | لنڪ ڪاپي ٿي وئي |
| [ ] | UI | `common.loading` | Loading… | لوڈ ہو رہا ہے… | لوڊ ٿي رهيو آهي… |
| [ ] | UI | `common.retry` | Try again | دوبارہ کوشش کریں | ٻيهر ڪوشش ڪريو |
| [ ] | UI | `common.error` | Something went wrong. Please try again or ask staff. | کچھ غلط ہو گیا۔ دوبارہ کوشش کریں یا عملے سے پوچھیں۔ | ڪجهه غلط ٿي ويو. ٻيهر ڪوشش ڪريو يا عملي کان پڇو. |
| [ ] | UI | `common.offline` | You are offline. Directions still work. | آپ آف لائن ہیں۔ راستہ پھر بھی نظر آئے گا۔ | توهان آف لائن آهيو. رستو اڃا به نظر ايندو. |
| [ ] | UI | `common.offlineSince` | Offline. Last updated at {time}. | آف لائن۔ آخری بار {time} پر اپ ڈیٹ ہوا۔ | آف لائن. آخري ڀيرو {time} تي اپڊيٽ ٿيو. |
| [ ] | UI | `common.live` | Live | براہ راست | سڌو |
| [ ] | UI | `common.sample` | Sample data | نمونہ ڈیٹا | نمونو ڊيٽا |
| [ ] | UI | `common.simulation` | Simulation | نقلی مظاہرہ | نقلي مظاهرو |
| [ ] | UI | `common.notAvailable` | Not available | دستیاب نہیں | دستياب ناهي |
| [ ] | UI | `common.yes` | Yes | ہاں | ها |
| [ ] | UI | `common.no` | No | نہیں | نه |
| [ ] | UI | `common.home` | Home | شروع | شروعات |
| [ ] | UI | `common.help` | Help | مدد | مدد |
| [ ] | UI | `common.listen` | Listen | سنیں | ٻڌو |
| [ ] | UI | `common.stop` | Stop | روکیں | روڪيو |
| [ ] | UI | `common.done` | Done | ہو گیا | ٿي ويو |
| [ ] | UI | `common.today` | Today | آج | اڄ |
| [ ] | UI | `common.tomorrow` | Tomorrow | کل | سڀاڻي |
| [ ] | UI | `common.notFound` | This page does not exist. | یہ صفحہ موجود نہیں۔ | هي صفحو موجود ناهي. |
| [ ] | UI | `common.goHome` | Go to start | شروع پر جائیں | شروعات ڏانهن وڃو |
| [ ] | UI | `common.minutes` | {n} min | {n} منٹ | {n} منٽ |
| [ ] | UI | `common.updated` | Updated {time} | {time} پر اپ ڈیٹ ہوا | {time} تي اپڊيٽ ٿيو |
| [ ] | UI | `settings.language` | Language | زبان | ٻولي |
| [ ] | UI | `settings.largerText` | Larger text | بڑا لکھا | وڏو لکيل |
| [ ] | UI | `settings.dark` | Dark theme | گہرا رنگ | ڳاڙهو رنگ |
| [ ] | UI | `settings.light` | Light theme | ہلکا رنگ | هلڪو رنگ |
| [ ] | UI | `lang.title` | Choose your language | اپنی زبان چنیں | پنهنجي ٻولي چونڊيو |
| [ ] | UI | `lang.hear` | Hear the welcome | خوش آمدید سنیں | ڀليڪار ٻڌو |
| [ ] | UI | `lang.welcome` | Welcome to WayMed. Choose your language. | وے میڈ میں خوش آمدید۔ اپنی زبان چنیں۔ | وي ميڊ ۾ ڀليڪار. پنهنجي ٻولي چونڊيو. |
| [ ] | UI | `lang.sdDraft` | Sindhi text is awaiting native review. | سندھی متن ابھی مقامی جانچ کے انتظار میں ہے۔ | سنڌي لکت اڃا مقامي جانچ جي انتظار ۾ آهي. |
| [ ] | UI | `home.title` | Reach the right department the first time | پہلی بار ہی صحیح شعبے تک پہنچیں | پهريون ڀيرو ئي صحيح شعبي تائين پهچو |
| [ ] | UI | `home.lead` | Directions, slips and live token status in English, Urdu and Sindhi. | راستہ، پرچی اور ٹوکن کی تازہ صورتحال، اردو، سندھی اور انگریزی میں۔ | رستو، پرچي ۽ ٽوڪن جي تازي صورتحال، سنڌي، اردو ۽ انگريزي ۾. |
| [ ] | UI | `home.whereTo` | Where do you want to go? | آپ کہاں جانا چاہتے ہیں؟ | توهان ڪٿي وڃڻ چاهيو ٿا؟ |
| [ ] | UI | `home.haveSlip` | I have a slip | میرے پاس پرچی ہے | مون وٽ پرچي آهي |
| [ ] | UI | `home.book` | Book an appointment | وقت لیں (اپوائنٹمنٹ) | وقت وٺو (اپائنٽمينٽ) |
| [ ] | UI | `home.prepare` | Before you come | آنے سے پہلے | اچڻ کان اڳ |
| [ ] | UI | `home.followup` | Follow-up card | دوبارہ آنے کا کارڈ | ٻيهر اچڻ جو ڪارڊ |
| [ ] | UI | `home.forStaff` | For hospital staff | ہسپتال کے عملے کے لیے | اسپتال جي عملي لاءِ |
| [ ] | UI | `home.staff` | Staff sign in | عملہ سائن ان | عملو سائن ان |
| [ ] | UI | `home.kiosk` | Kiosk mode | کیوسک موڈ | ڪيوسڪ موڊ |
| [ ] | UI | `home.board` | Entrance board | داخلی بورڈ | داخلا بورڊ |
| [ ] | UI | `home.demo` | Demo and presenter show | ڈیمو اور پریزنٹیشن | ڊيمو ۽ پريزنٽيشن |
| [ ] | UI | `home.privacy` | No account. No camera tracking. A slip holds only a token number and a department. | کوئی اکاؤنٹ نہیں۔ کوئی کیمرہ نگرانی نہیں۔ پرچی پر صرف ٹوکن نمبر اور شعبہ ہوتا ہے۔ | ڪو اڪائونٽ ناهي. ڪيمرا سان نگراني ناهي. پرچي تي رڳو ٽوڪن نمبر ۽ شعبو هوندو آهي. |
| [ ] | UI | `guide.whereTitle` | Where do you want to go? | آپ کہاں جانا چاہتے ہیں؟ | توهان ڪٿي وڃڻ چاهيو ٿا؟ |
| [ ] | UI | `guide.departments` | Departments | شعبے | شعبا |
| [ ] | UI | `guide.facilities` | Facilities | سہولیات | سهولتون |
| [ ] | UI | `guide.youAreAt` | You are at | آپ یہاں ہیں | توهان هتي آهيو |
| [ ] | UI | `guide.stepFree` | Step-free route | بغیر سیڑھی راستہ | ڏاڪن کان سواءِ رستو |
| [ ] | UI | `guide.stepFreeHint` | For wheelchair, stretcher and elderly users | وہیل چیئر، اسٹریچر اور بزرگوں کے لیے | ويل چيئر، اسٽريچر ۽ وڏڙن لاءِ |
| [ ] | UI | `guide.showFacilities` | Show facilities on the plan | نقشے پر سہولیات دکھائیں | نقشي تي سهولتون ڏيکاريو |
| [ ] | UI | `guide.distance` | About {m} metres | تقریباً {m} میٹر | لڳ ڀڳ {m} ميٽر |
| [ ] | UI | `guide.noRoute` | No step-free route was found. Please ask staff at the Help Desk. | بغیر سیڑھی راستہ نہیں ملا۔ ہیلپ ڈیسک پر عملے سے پوچھیں۔ | ڏاڪن کان سواءِ رستو نه مليو. هيلپ ڊيسڪ تي عملي کان پڇو. |
| [ ] | UI | `guide.unknownDest` | We could not find that place. | یہ جگہ نہیں ملی۔ | اها جاءِ نه ملي. |
| [ ] | UI | `guide.voiceMissing` | No voice for this language on this device. Please read the text. | اس فون پر اس زبان کی آواز نہیں ہے۔ براہ کرم لکھا ہوا پڑھیں۔ | هن فون تي هن ٻوليءَ جو آواز ناهي. مهرباني ڪري لکيل پڙهو. |
| [ ] | UI | `guide.youAreHere` | You are here | آپ یہاں ہیں | توهان هتي آهيو |
| [ ] | UI | `guide.planLabel` | Floor plan with your route | نقشہ اور آپ کا راستہ | نقشو ۽ توهان جو رستو |
| [ ] | UI | `guide.slipHint` | For a consultation, get a slip at the Slip Room first. | ڈاکٹر کو دکھانے کے لیے پہلے رجسٹریشن کاؤنٹر سے پرچی لیں۔ | ڊاڪٽر کي ڏيکارڻ لاءِ پهريان رجسٽريشن ڪائونٽر تان پرچي وٺو. |
| [ ] | UI | `guide.steps` | Directions | راستے کی ہدایات | رستي جون هدايتون |
| [ ] | UI | `guide.other` | Choose another place | کوئی اور جگہ چنیں | ٻي جاءِ چونڊيو |
| [ ] | UI | `step.start` | Start at {place}. | {place} سے شروع کریں۔ | {place} کان شروع ڪريو. |
| [ ] | UI | `step.straight` | Go straight to {place}. | سیدھا {place} تک جائیں۔ | سڌو {place} تائين وڃو. |
| [ ] | UI | `step.slight_left` | Keep slightly left towards {place}. | تھوڑا بائیں ہو کر {place} کی طرف جائیں۔ | ٿورو کاٻي پاسي ٿي {place} ڏانهن وڃو. |
| [ ] | UI | `step.slight_right` | Keep slightly right towards {place}. | تھوڑا دائیں ہو کر {place} کی طرف جائیں۔ | ٿورو ساڄي پاسي ٿي {place} ڏانهن وڃو. |
| [ ] | UI | `step.left` | Turn left towards {place}. | بائیں مڑیں اور {place} کی طرف جائیں۔ | کاٻي پاسي مڙو ۽ {place} ڏانهن وڃو. |
| [ ] | UI | `step.right` | Turn right towards {place}. | دائیں مڑیں اور {place} کی طرف جائیں۔ | ساڄي پاسي مڙو ۽ {place} ڏانهن وڃو. |
| [ ] | UI | `step.back` | Turn around and go to {place}. | پیچھے مڑیں اور {place} جائیں۔ | پوئتي مڙو ۽ {place} وڃو. |
| [ ] | UI | `step.arrive` | You have arrived: {place}. | آپ پہنچ گئے: {place}۔ | توهان پهچي ويا: {place}. |
| [ ] | UI | `step.note.steps` | There are steps here. | یہاں سیڑھیاں ہیں۔ | هتي ڏاڪا آهن. |
| [ ] | UI | `step.note.ramp` | Use the ramp. | ریمپ استعمال کریں۔ | ريمپ استعمال ڪريو. |
| [ ] | UI | `step.note.lift` | Use the lift. | لفٹ استعمال کریں۔ | لفٽ استعمال ڪريو. |
| [ ] | UI | `facility.water` | Drinking water | پینے کا پانی | پيئڻ جو پاڻي |
| [ ] | UI | `facility.washroom` | Washrooms | واش روم | واش روم |
| [ ] | UI | `facility.seating` | Shaded seating | سایہ دار نشستیں | ڇانوَ واريون سيٽون |
| [ ] | UI | `facility.prayer` | Prayer area | نماز کی جگہ | نماز جي جاءِ |
| [ ] | UI | `facility.helpdesk` | Help desk | ہیلپ ڈیسک | هيلپ ڊيسڪ |
| [ ] | UI | `token.title` | Your slip | آپ کی پرچی | توهان جي پرچي |
| [ ] | UI | `token.label` | Token | ٹوکن | ٽوڪن |
| [ ] | UI | `token.ahead` | {n} people ahead of you | آپ سے پہلے {n} لوگ | توهان کان اڳ {n} ماڻهو |
| [ ] | UI | `token.aheadOne` | 1 person ahead of you | آپ سے پہلے 1 شخص | توهان کان اڳ 1 ماڻهو |
| [ ] | UI | `token.aheadNone` | No one ahead of you | آپ سے پہلے کوئی نہیں | توهان کان اڳ ڪو به ناهي |
| [ ] | UI | `token.wait` | Estimated wait: {min} to {max} minutes | اندازاً انتظار: {min} سے {max} منٹ | اندازي مطابق انتظار: {min} کان {max} منٽ |
| [ ] | UI | `token.waitMeasured` | Based on recent service times today. | آج کے حالیہ اوقات کی بنیاد پر۔ | اڄ جي تازن وقتن جي بنياد تي. |
| [ ] | UI | `token.waitConfig` | Based on the usual time for this department. It improves as real times are measured. | اس شعبے کے عام وقت کی بنیاد پر۔ اصل اوقات آنے پر بہتر ہو گا۔ | هن شعبي جي عام وقت جي بنياد تي. اصل وقت اچڻ سان بهتر ٿيندو. |
| [ ] | UI | `token.goNow` | Please go to {dept} now. | براہ کرم ابھی {dept} جائیں۔ | مهرباني ڪري هاڻي {dept} وڃو. |
| [ ] | UI | `token.recalled` | You are being called again. | آپ کو دوبارہ بلایا جا رہا ہے۔ | توهان کي ٻيهر سڏيو پيو وڃي. |
| [ ] | UI | `token.share` | Share status with family | گھر والوں کو صورتحال بھیجیں | گهر وارن کي صورتحال موڪليو |
| [ ] | UI | `token.shareText` | Follow hospital token {label} live | ہسپتال ٹوکن {label} کی تازہ صورتحال دیکھیں | اسپتال ٽوڪن {label} جي تازي صورتحال ڏسو |
| [ ] | UI | `token.notify` | Alert me when 3 tokens away | جب 3 ٹوکن رہ جائیں تو بتائیں | جڏهن 3 ٽوڪن رهجي وڃن ته ٻڌايو |
| [ ] | UI | `token.notifyOn` | Alert is on | اطلاع آن ہے | اطلاع آن آهي |
| [ ] | UI | `token.notifyDenied` | Notifications are blocked on this device. | اس فون پر اطلاعات بند ہیں۔ | هن فون تي اطلاع بند آهن. |
| [ ] | UI | `token.notifyMsg` | {label}: about 3 tokens to go. Start walking to {dept}. | {label}: تقریباً 3 ٹوکن باقی۔ {dept} کی طرف چلنا شروع کریں۔ | {label}: لڳ ڀڳ 3 ٽوڪن باقي. {dept} ڏانهن هلڻ شروع ڪريو. |
| [ ] | UI | `token.notFound` | This token was not found. Tokens are deleted after 24 hours. | یہ ٹوکن نہیں ملا۔ ٹوکن 24 گھنٹے بعد مٹا دیے جاتے ہیں۔ | هي ٽوڪن نه مليو. ٽوڪن 24 ڪلاڪن بعد ختم ڪيا ويندا آهن. |
| [ ] | UI | `token.route` | Route to {dept} | {dept} کا راستہ | {dept} جو رستو |
| [ ] | UI | `token.appointment` | Appointment: {start} to {end} | وقت: {start} سے {end} | وقت: {start} کان {end} |
| [ ] | UI | `token.privacy` | This page shows only a token number and a department. | اس صفحے پر صرف ٹوکن نمبر اور شعبہ ہے۔ | هن صفحي تي رڳو ٽوڪن نمبر ۽ شعبو آهي. |
| [ ] | UI | `token.lookupTitle` | Type your token | اپنا ٹوکن لکھیں | پنهنجو ٽوڪن لکو |
| [ ] | UI | `token.lookupHint` | Example: PED-007 | مثال: PED-007 | مثال: PED-007 |
| [ ] | UI | `token.lookupGo` | Show status | صورتحال دیکھیں | صورتحال ڏسو |
| [ ] | UI | `token.invalid` | Please type a token like PED-007. | براہ کرم ٹوکن اس طرح لکھیں: PED-007 | مهرباني ڪري ٽوڪن هن طرح لکو: PED-007 |
| [ ] | UI | `token.familyPage` | Family page | گھر والوں کا صفحہ | گهر وارن جو صفحو |
| [ ] | UI | `feedback.question` | Did you reach the right department the first time? | کیا آپ پہلی بار ہی صحیح شعبے تک پہنچے؟ | ڇا توهان پهريون ڀيرو ئي صحيح شعبي تائين پهتا؟ |
| [ ] | UI | `feedback.thanks` | Thank you. Your answer is anonymous. | شکریہ۔ آپ کا جواب گمنام ہے۔ | مهرباني. توهان جو جواب گمنام آهي. |
| [ ] | UI | `family.title` | Family companion | گھر والوں کا ساتھی | گهر وارن جو ساٿي |
| [ ] | UI | `family.lead` | Follow this token from anywhere. No sign-in. | یہ ٹوکن کہیں سے بھی دیکھیں۔ سائن ان کی ضرورت نہیں۔ | هي ٽوڪن ڪٿان به ڏسو. سائن ان جي ضرورت ناهي. |
| [ ] | UI | `family.nearby` | Near the waiting area | انتظار گاہ کے قریب | انتظار گاهه جي ويجهو |
| [ ] | UI | `family.attendants` | Please keep to one or two attendants near the patient. Crowding slows care. | مریض کے پاس ایک یا دو تیماردار رکھیں۔ زیادہ رش علاج میں دیر کرتا ہے۔ | مريض وٽ هڪ يا ٻه سنڀاليندڙ رکو. گهڻي ڀيڙ علاج ۾ دير ڪري ٿي. |
| [ ] | UI | `landmark.title` | You are here | آپ یہاں ہیں | توهان هتي آهيو |
| [ ] | UI | `landmark.toToken` | Route to your department | آپ کے شعبے کا راستہ | توهان جي شعبي جو رستو |
| [ ] | UI | `landmark.noToken` | No saved slip on this phone. Where do you want to go? | اس فون پر کوئی پرچی محفوظ نہیں۔ آپ کہاں جانا چاہتے ہیں؟ | هن فون تي ڪا پرچي محفوظ ناهي. توهان ڪٿي وڃڻ چاهيو ٿا؟ |
| [ ] | UI | `landmark.lost` | I feel lost | میں راستہ بھول گیا ہوں | مان رستو ڀلجي ويو آهيان |
| [ ] | UI | `landmark.lostTitle` | Do not worry. We will help. | پریشان نہ ہوں۔ ہم مدد کریں گے۔ | پريشان نه ٿيو. اسين مدد ڪنداسين. |
| [ ] | UI | `landmark.lostStay` | Stay near the {place} sign. | {place} کے نشان کے پاس رہیں۔ | {place} جي نشان وٽ رهو. |
| [ ] | UI | `landmark.askGuide` | Ask a guide to meet me | رہنما کو میرے پاس بلائیں | رهنما کي مون وٽ سڏيو |
| [ ] | UI | `landmark.guideSent` | A guide has been asked to come to {place}. | رہنما کو {place} آنے کا کہا گیا ہے۔ | رهنما کي {place} اچڻ لاءِ چيو ويو آهي. |
| [ ] | UI | `landmark.guideOnWay` | A guide is on the way. | رہنما آ رہا ہے۔ | رهنما اچي رهيو آهي. |
| [ ] | UI | `landmark.guideDone` | This request is closed. | یہ درخواست بند ہو گئی۔ | هيءَ درخواست بند ٿي وئي. |
| [ ] | UI | `landmark.helpDesk` | Nearest help desk | قریبی ہیلپ ڈیسک | ويجهي هيلپ ڊيسڪ |
| [ ] | UI | `landmark.unknown` | This sign is not recognised. Please ask staff. | یہ نشان پہچانا نہیں گیا۔ عملے سے پوچھیں۔ | هي نشان سڃاتو نه ويو. عملي کان پڇو. |
| [ ] | UI | `landmark.showRoute` | Show route again | راستہ دوبارہ دکھائیں | رستو ٻيهر ڏيکاريو |
| [ ] | UI | `kiosk.title` | Welcome. How can we help? | خوش آمدید۔ ہم کیسے مدد کریں؟ | ڀليڪار. اسين ڪيئن مدد ڪريون؟ |
| [ ] | UI | `kiosk.scan` | Scan my slip | میری پرچی اسکین کریں | منهنجي پرچي اسڪين ڪريو |
| [ ] | UI | `kiosk.type` | Type my token | ٹوکن لکھیں | ٽوڪن لکو |
| [ ] | UI | `kiosk.choose` | Choose a department | شعبہ چنیں | شعبو چونڊيو |
| [ ] | UI | `kiosk.help` | Help | مدد | مدد |
| [ ] | UI | `kiosk.helpText` | A guide has been asked to come to this kiosk. You can also ask any staff member in uniform. | اس کیوسک پر رہنما کو بلا لیا گیا ہے۔ آپ وردی میں کسی بھی عملے سے پوچھ سکتے ہیں۔ | هن ڪيوسڪ تي رهنما کي سڏيو ويو آهي. توهان وردي ۾ ڪنهن به عملي کان پڇي سگهو ٿا. |
| [ ] | UI | `kiosk.scanHint` | Hold the QR code on your slip in front of the camera. | پرچی کا کیو آر کوڈ کیمرے کے سامنے رکھیں۔ | پرچي جو ڪيو آر ڪوڊ ڪئميرا اڳيان رکو. |
| [ ] | UI | `kiosk.cameraDenied` | Camera is not available. Please type your token instead. | کیمرہ دستیاب نہیں۔ براہ کرم ٹوکن لکھیں۔ | ڪئميرا موجود ناهي. مهرباني ڪري ٽوڪن لکو. |
| [ ] | UI | `kiosk.cameraPrivacy` | The camera only reads the slip QR on this screen. Nothing is recorded or sent. | کیمرہ صرف اس اسکرین پر پرچی کا کیو آر پڑھتا ہے۔ کچھ ریکارڈ یا بھیجا نہیں جاتا۔ | ڪئميرا رڳو هن اسڪرين تي پرچي جو ڪيو آر پڙهي ٿو. ڪجهه به رڪارڊ يا موڪليو نٿو وڃي. |
| [ ] | UI | `kiosk.reset` | Starting again in {n} seconds. Touch the screen to continue. | {n} سیکنڈ میں دوبارہ شروع ہو گا۔ جاری رکھنے کے لیے اسکرین چھوئیں۔ | {n} سيڪنڊن ۾ ٻيهر شروع ٿيندو. جاري رکڻ لاءِ اسڪرين ڇهو. |
| [ ] | UI | `kiosk.at` | Kiosk at {place} | کیوسک: {place} | ڪيوسڪ: {place} |
| [ ] | UI | `kiosk.fullscreen` | Lock fullscreen | پوری اسکرین بند کریں | پوري اسڪرين بند ڪريو |
| [ ] | UI | `kiosk.startOver` | Start over | دوبارہ شروع کریں | ٻيهر شروع ڪريو |
| [ ] | UI | `book.title` | Book an appointment | وقت لیں (اپوائنٹمنٹ) | وقت وٺو (اپائنٽمينٽ) |
| [ ] | UI | `book.dept` | Department | شعبہ | شعبو |
| [ ] | UI | `book.doctor` | Doctor | ڈاکٹر | ڊاڪٽر |
| [ ] | UI | `book.slot` | Time | وقت | وقت |
| [ ] | UI | `book.confirm` | Book {time} | {time} بک کریں | {time} بُڪ ڪريو |
| [ ] | UI | `book.booked` | Booked | بک ہو چکا | بُڪ ٿيل |
| [ ] | UI | `book.blocked` | Blocked | بند | بند |
| [ ] | UI | `book.done` | Your appointment is booked | آپ کا وقت بک ہو گیا | توهان جو وقت بُڪ ٿي ويو |
| [ ] | UI | `book.noPersonal` | No name or phone number needed. Keep your token. | نام یا فون نمبر کی ضرورت نہیں۔ اپنا ٹوکن سنبھال کر رکھیں۔ | نالي يا فون نمبر جي ضرورت ناهي. پنهنجو ٽوڪن سنڀالي رکو. |
| [ ] | UI | `book.estimate` | Please come between {start} and {end}. | براہ کرم {start} سے {end} کے درمیان آئیں۔ | مهرباني ڪري {start} کان {end} جي وچ ۾ اچو. |
| [ ] | UI | `book.taken` | Sorry, this time was just taken. Please choose another. | معذرت، یہ وقت ابھی کسی اور نے لے لیا۔ دوسرا وقت چنیں۔ | معاف ڪجو، هي وقت هاڻي ڪنهن ٻئي ورتو. ٻيو وقت چونڊيو. |
| [ ] | UI | `book.noSlots` | No bookable times in the next 22 hours. | اگلے 22 گھنٹوں میں کوئی وقت خالی نہیں۔ | ايندڙ 22 ڪلاڪن ۾ ڪو وقت خالي ناهي. |
| [ ] | UI | `book.window` | You can book for today or tomorrow. | آپ آج یا کل کے لیے وقت لے سکتے ہیں۔ | توهان اڄ يا سڀاڻي لاءِ وقت وٺي سگهو ٿا. |
| [ ] | UI | `book.notBookable` | This department does not take bookings. Please come to the Slip Room. | یہ شعبہ بکنگ نہیں لیتا۔ رجسٹریشن کاؤنٹر پر آئیں۔ | هي شعبو بُڪنگ نٿو وٺي. رجسٽريشن ڪائونٽر تي اچو. |
| [ ] | UI | `book.doctorAway` | Not available today | آج دستیاب نہیں | اڄ دستياب ناهي |
| [ ] | UI | `prepare.title` | Before you come | آنے سے پہلے | اچڻ کان اڳ |
| [ ] | UI | `prepare.bring` | What to bring | ساتھ کیا لائیں | ساڻ ڇا آڻجي |
| [ ] | UI | `prepare.b1` | Any old reports, prescriptions and the medicines you take. | پرانی رپورٹیں، نسخے اور جو دوائیں آپ لیتے ہیں۔ | پراڻيون رپورٽون، نسخا ۽ جيڪي دوائون توهان کائو ٿا. |
| [ ] | UI | `prepare.b2` | Water and something to eat. | پانی اور کھانے کی کوئی چیز۔ | پاڻي ۽ کائڻ جي ڪا شيءِ. |
| [ ] | UI | `prepare.b3` | A charged phone, if you have one, to follow your token. | چارج شدہ فون، اگر ہو، تاکہ ٹوکن دیکھ سکیں۔ | چارج ٿيل فون، جيڪڏهن هجي، ته جيئن ٽوڪن ڏسي سگهو. |
| [ ] | UI | `prepare.b4` | Only one or two attendants. Crowding around the patient slows care. | صرف ایک یا دو تیماردار۔ مریض کے گرد رش علاج میں دیر کرتا ہے۔ | رڳو هڪ يا ٻه سنڀاليندڙ. مريض جي چوڌاري ڀيڙ علاج ۾ دير ڪري ٿي. |
| [ ] | UI | `prepare.hours` | Opening hours | اوقات | وقت |
| [ ] | UI | `prepare.arrive` | When you arrive | پہنچ کر کیا کریں | پهچي ڪري ڇا ڪجي |
| [ ] | UI | `prepare.s1` | Scan the WayMed QR at the entrance or ask at the Help Desk. | داخلے پر وے میڈ کیو آر اسکین کریں یا ہیلپ ڈیسک سے پوچھیں۔ | داخلا تي وي ميڊ ڪيو آر اسڪين ڪريو يا هيلپ ڊيسڪ کان پڇو. |
| [ ] | UI | `prepare.s2` | Get a slip at Registration. It shows your token and your route. | رجسٹریشن سے پرچی لیں۔ اس پر آپ کا ٹوکن اور راستہ ہے۔ | رجسٽريشن تان پرچي وٺو. ان تي توهان جو ٽوڪن ۽ رستو آهي. |
| [ ] | UI | `prepare.s3` | Follow the coloured signs with the same shape to your department. | اسی رنگ اور شکل والے نشانوں کے پیچھے اپنے شعبے تک جائیں۔ | ساڳي رنگ ۽ شڪل وارن نشانن پٺيان پنهنجي شعبي تائين وڃو. |
| [ ] | UI | `prepare.s4` | Watch the entrance board or your phone for your token. | داخلی بورڈ یا اپنے فون پر اپنا ٹوکن دیکھتے رہیں۔ | داخلا بورڊ يا پنهنجي فون تي ٽوڪن ڏسندا رهو. |
| [ ] | UI | `prepare.share` | Share this page | یہ صفحہ شیئر کریں | هي صفحو شيئر ڪريو |
| [ ] | UI | `followup.title` | Follow-up card | دوبارہ آنے کا کارڈ | ٻيهر اچڻ جو ڪارڊ |
| [ ] | UI | `followup.lead` | General reminders only. This is not medical advice. Ask your doctor about your treatment. | صرف عام یاددہانی۔ یہ طبی مشورہ نہیں۔ علاج کے بارے میں اپنے ڈاکٹر سے پوچھیں۔ | رڳو عام يادگيري. هي طبي صلاح ناهي. علاج بابت پنهنجي ڊاڪٽر کان پڇو. |
| [ ] | UI | `followup.next` | Next visit date | اگلی ملاقات کی تاریخ | ايندڙ ملاقات جي تاريخ |
| [ ] | UI | `followup.dept` | Department | شعبہ | شعبو |
| [ ] | UI | `followup.r1` | Bring this card and all your reports on your next visit. | اگلی بار یہ کارڈ اور اپنی تمام رپورٹیں ساتھ لائیں۔ | ايندڙ ڀيري هي ڪارڊ ۽ سڀ رپورٽون ساڻ آڻيو. |
| [ ] | UI | `followup.r2` | Ask the Laboratory counter on which day your reports will be ready. | لیبارٹری کاؤنٹر سے پوچھیں کہ رپورٹ کس دن ملے گی۔ | ليبارٽري ڪائونٽر کان پڇو ته رپورٽ ڪهڙي ڏينهن ملندي. |
| [ ] | UI | `followup.r3` | Take medicines only as written by your doctor. | دوا صرف ڈاکٹر کے لکھے کے مطابق لیں۔ | دوا رڳو ڊاڪٽر جي لکيل مطابق کائو. |
| [ ] | UI | `followup.staffNote` | For you and your family. Write your next visit date and department if you like. Nothing is saved. | آپ اور آپ کے گھر والوں کے لیے۔ چاہیں تو اگلی تاریخ اور شعبہ لکھ لیں۔ کچھ محفوظ نہیں ہوتا۔ | توهان ۽ توهان جي گهر وارن لاءِ. چاهيو ته ايندڙ تاريخ ۽ شعبو لکو. ڪجهه محفوظ ناهي ٿيندو. |
| [ ] | UI | `desk.title` | Registration desk | رجسٹریشن کاؤنٹر | رجسٽريشن ڪائونٽر |
| [ ] | UI | `desk.issue` | Issue slip | پرچی جاری کریں | پرچي جاري ڪريو |
| [ ] | UI | `desk.urgent` | Urgent (call first) | فوری (پہلے بلائیں) | تڪڙو (پهريان سڏيو) |
| [ ] | UI | `desk.issued` | Slip {label} issued | پرچی {label} جاری ہو گئی | پرچي {label} جاري ٿي وئي |
| [ ] | UI | `desk.printSlip` | Print slip | پرچی پرنٹ کریں | پرچي پرنٽ ڪريو |
| [ ] | UI | `desk.recent` | Slips issued here | یہاں سے جاری پرچیاں | هتان جاري ٿيل پرچيون |
| [ ] | UI | `desk.noPersonal` | This slip holds no personal data | اس پرچی پر کوئی ذاتی معلومات نہیں | هن پرچي تي ڪا ذاتي معلومات ناهي |
| [ ] | UI | `desk.estWait` | Estimated wait | اندازاً انتظار | اندازي مطابق انتظار |
| [ ] | UI | `desk.scanToFollow` | Scan to follow your token and route | ٹوکن اور راستہ دیکھنے کے لیے اسکین کریں | ٽوڪن ۽ رستو ڏسڻ لاءِ اسڪين ڪريو |
| [ ] | UI | `desk.followup` | Print follow-up card | دوبارہ آنے کا کارڈ پرنٹ کریں | ٻيهر اچڻ جو ڪارڊ پرنٽ ڪريو |
| [ ] | UI | `staff.title` | Department queue | شعبے کی قطار | شعبي جي قطار |
| [ ] | UI | `staff.dept` | Department | شعبہ | شعبو |
| [ ] | UI | `staff.next` | Next | اگلا | اڳيون |
| [ ] | UI | `staff.recall` | Recall | دوبارہ بلائیں | ٻيهر سڏيو |
| [ ] | UI | `staff.skip` | Skip (missed) | چھوڑیں (نہیں آیا) | ڇڏيو (نه آيو) |
| [ ] | UI | `staff.nowServing` | Now serving | ابھی باری | هاڻي واري |
| [ ] | UI | `staff.waiting` | Waiting | انتظار میں | انتظار ۾ |
| [ ] | UI | `staff.empty` | No one waiting. | کوئی انتظار میں نہیں۔ | ڪو به انتظار ۾ ناهي. |
| [ ] | UI | `staff.guides` | Guide requests | رہنما کی درخواستیں | رهنما جون درخواستون |
| [ ] | UI | `staff.noGuides` | No open guide requests. | کوئی کھلی درخواست نہیں۔ | ڪا کليل درخواست ناهي. |
| [ ] | UI | `staff.onTheWay` | On my way | میں آ رہا ہوں | مان اچي رهيو آهيان |
| [ ] | UI | `staff.closeRequest` | Close | بند کریں | بند ڪريو |
| [ ] | UI | `staff.simulate` | Simulate queue | نقلی قطار | نقلي قطار |
| [ ] | UI | `staff.simulateHint` | Demo only: adds sample tokens. | صرف ڈیمو: نمونہ ٹوکن شامل کرتا ہے۔ | رڳو ڊيمو: نمونو ٽوڪن شامل ڪري ٿو. |
| [ ] | UI | `staff.urgentFirst` | Urgent tokens are called first. | فوری ٹوکن پہلے بلائے جاتے ہیں۔ | تڪڙا ٽوڪن پهريان سڏيا ويندا آهن. |
| [ ] | UI | `staff.doctors` | Doctors and slots | ڈاکٹر اور اوقات | ڊاڪٽر ۽ وقت |
| [ ] | UI | `staff.markUnavailable` | Mark unavailable | غیر حاضر کریں | غير حاضر ڪريو |
| [ ] | UI | `staff.markAvailable` | Mark available | حاضر کریں | حاضر ڪريو |
| [ ] | UI | `staff.block` | Block | بند کریں | بند ڪريو |
| [ ] | UI | `staff.unblock` | Unblock | کھولیں | کوليو |
| [ ] | UI | `staff.urgent` | Urgent | فوری | تڪڙو |
| [ ] | UI | `board.nowServing` | Now serving | ابھی باری | هاڻي واري |
| [ ] | UI | `board.next` | Next in line | اگلی باری | ايندڙ واري |
| [ ] | UI | `board.waiting` | {n} waiting | {n} انتظار میں | {n} انتظار ۾ |
| [ ] | UI | `board.offline` | Offline. Showing the last update from {time}. | آف لائن۔ {time} کی آخری صورتحال دکھائی جا رہی ہے۔ | آف لائن. {time} جي آخري صورتحال ڏيکاري پئي وڃي. |
| [ ] | UI | `login.title` | Staff sign in | عملہ سائن ان | عملو سائن ان |
| [ ] | UI | `login.email` | Email | ای میل | اي ميل |
| [ ] | UI | `login.password` | Password | پاس ورڈ | پاس ورڊ |
| [ ] | UI | `login.submit` | Sign in | سائن ان | سائن ان |
| [ ] | UI | `login.failed` | Email or password is wrong. | ای میل یا پاس ورڈ غلط ہے۔ | اي ميل يا پاس ورڊ غلط آهي. |
| [ ] | UI | `login.visitorNote` | Visitors never need to sign in. | مریضوں اور تیمارداروں کو سائن ان کی ضرورت نہیں۔ | مريضن ۽ سنڀاليندڙن کي سائن ان جي ضرورت ناهي. |
| [ ] | UI | `login.logout` | Sign out | سائن آؤٹ | سائن آئوٽ |
| [ ] | UI | `login.needRole` | Your account cannot open this page. | آپ کا اکاؤنٹ یہ صفحہ نہیں کھول سکتا۔ | توهان جو اڪائونٽ هي صفحو کولي نٿو سگهي. |
| [ ] | UI | `admin.title` | Administration | انتظامیہ | انتظاميه |
| [ ] | UI | `admin.departments` | Departments | شعبے | شعبا |
| [ ] | UI | `admin.landmarks` | Floor plan | نقشہ | نقشو |
| [ ] | UI | `admin.facilities` | Facilities | سہولیات | سهولتون |
| [ ] | UI | `admin.doctors` | Doctors | ڈاکٹر | ڊاڪٽر |
| [ ] | UI | `admin.kiosks` | Kiosks | کیوسک | ڪيوسڪ |
| [ ] | UI | `admin.signage` | Signage kit | نشانات کا سیٹ | نشانن جو سيٽ |
| [ ] | UI | `admin.users` | Staff accounts | عملے کے اکاؤنٹ | عملي جا اڪائونٽ |
| [ ] | UI | `admin.audit` | Audit log | آڈٹ ریکارڈ | آڊٽ رڪارڊ |
| [ ] | UI | `admin.hospital` | Hospital | ہسپتال | اسپتال |
| [ ] | UI | `admin.name` | Name | نام | نالو |
| [ ] | UI | `admin.code` | Code | کوڈ | ڪوڊ |
| [ ] | UI | `admin.color` | Colour | رنگ | رنگ |
| [ ] | UI | `admin.icon` | Icon | نشان | نشاني |
| [ ] | UI | `admin.shape` | Shape | شکل | شڪل |
| [ ] | UI | `admin.avgService` | Usual minutes per visitor | فی شخص عام منٹ | في ماڻهو عام منٽ |
| [ ] | UI | `admin.hours` | Opening hours | اوقات | وقت |
| [ ] | UI | `admin.bookable` | Takes bookings | بکنگ لیتا ہے | بُڪنگ وٺي ٿو |
| [ ] | UI | `admin.type` | Type | قسم | قسم |
| [ ] | UI | `admin.node` | Location node | مقام | جاءِ |
| [ ] | UI | `admin.schedule` | Days and hours | دن اور اوقات | ڏينهن ۽ وقت |
| [ ] | UI | `admin.slotMin` | Slot minutes | فی وقت منٹ | في وقت منٽ |
| [ ] | UI | `admin.available` | Available | دستیاب | دستياب |
| [ ] | UI | `admin.role` | Role | کردار | ڪردار |
| [ ] | UI | `admin.email` | Email | ای میل | اي ميل |
| [ ] | UI | `admin.password` | New password | نیا پاس ورڈ | نئون پاس ورڊ |
| [ ] | UI | `admin.active` | Active | فعال | فعال |
| [ ] | UI | `admin.editorHint` | Drag a point to move it. Select two points and press "Connect" to add a corridor. | نقطہ کھینچ کر ہٹائیں۔ دو نقطے چن کر "جوڑیں" دبائیں تاکہ راہداری بنے۔ | نقطو ڇڪي هٽايو. ٻه نقطا چونڊي "ڳنڍيو" دٻايو ته جيئن لنگهه ٺهي. |
| [ ] | UI | `admin.connect` | Connect | جوڑیں | ڳنڍيو |
| [ ] | UI | `admin.toggleStepFree` | Toggle step-free | سیڑھی/بغیر سیڑھی بدلیں | ڏاڪا/ڏاڪن کان سواءِ مٽايو |
| [ ] | UI | `admin.removeEdge` | Remove corridor | راہداری ہٹائیں | لنگهه هٽايو |
| [ ] | UI | `admin.addPoint` | Add point | نقطہ شامل کریں | نقطو شامل ڪريو |
| [ ] | UI | `admin.sticker` | Has QR sticker | کیو آر اسٹیکر ہے | ڪيو آر اسٽيڪر آهي |
| [ ] | UI | `admin.kioskLink` | Kiosk link | کیوسک لنک | ڪيوسڪ لنڪ |
| [ ] | UI | `admin.printStickers` | Landmark QR stickers | مقام کے کیو آر اسٹیکر | جاءِ جا ڪيو آر اسٽيڪر |
| [ ] | UI | `admin.printSigns` | Department signs | شعبوں کے نشان | شعبن جا نشان |
| [ ] | UI | `admin.printSlip` | Slip template | پرچی کا نمونہ | پرچي جو نمونو |
| [ ] | UI | `admin.validation` | Please check the highlighted fields. | براہ کرم نشان زدہ خانے چیک کریں۔ | مهرباني ڪري نشان لڳل خانا چڪاسيو. |
| [ ] | UI | `admin.when` | When | کب | ڪڏهن |
| [ ] | UI | `admin.who` | Who | کون | ڪير |
| [ ] | UI | `admin.action` | Action | کام | ڪم |
| [ ] | UI | `admin.insights` | Insights | جائزہ | جائزو |
| [ ] | UI | `admin.sampleData` | This hospital still uses the built-in sample floor plan and doctors. | یہ ہسپتال ابھی نمونہ نقشہ اور ڈاکٹر استعمال کر رہا ہے۔ | هيءَ اسپتال اڃا نمونو نقشو ۽ ڊاڪٽر استعمال ڪري رهي آهي. |
| [ ] | UI | `insights.title` | Insights | جائزہ | جائزو |
| [ ] | UI | `insights.lead` | Real counts from anonymous events. Individual visits are deleted after 24 hours; only counts are kept. | گمنام واقعات کی اصل گنتی۔ انفرادی دورے 24 گھنٹے بعد مٹ جاتے ہیں، صرف گنتی رہتی ہے۔ | گمنام واقعن جي اصل ڳڻپ. انفرادي دورا 24 ڪلاڪن بعد ختم ٿين ٿا، رڳو ڳڻپ رهي ٿي. |
| [ ] | UI | `insights.notEnough` | Not enough data yet | ابھی کافی ڈیٹا نہیں | اڃا ڪافي ڊيٽا ناهي |
| [ ] | UI | `insights.range` | Last {n} days | پچھلے {n} دن | پوئين {n} ڏينهن |
| [ ] | UI | `insights.tokens` | Tokens per department | ہر شعبے کے ٹوکن | هر شعبي جا ٽوڪن |
| [ ] | UI | `insights.avgWait` | Average wait | اوسط انتظار | سراسري انتظار |
| [ ] | UI | `insights.channels` | Phone and kiosk use | فون اور کیوسک کا استعمال | فون ۽ ڪيوسڪ جو استعمال |
| [ ] | UI | `insights.languages` | Languages used | استعمال شدہ زبانیں | استعمال ٿيل ٻوليون |
| [ ] | UI | `insights.lost` | "I feel lost" taps per landmark | ہر مقام پر "راستہ بھول گیا" دبانا | هر جاءِ تي "رستو ڀلجي ويو" دٻائڻ |
| [ ] | UI | `insights.ftr` | First-time-right rate | پہلی بار صحیح پہنچنے کی شرح | پهريون ڀيرو صحيح پهچڻ جي شرح |
| [ ] | UI | `insights.ftrDetail` | {yes} of {total} visitors said yes | {total} میں سے {yes} نے ہاں کہا | {total} مان {yes} ها چيو |
| [ ] | UI | `insights.hours` | Busiest hours | سب سے مصروف اوقات | سڀ کان مصروف وقت |
| [ ] | UI | `insights.recs` | Suggestions | تجاویز | تجويزون |
| [ ] | UI | `insights.recLost` | {place} has the most "I feel lost" taps. Check or add a sign here. | {place} پر سب سے زیادہ "راستہ بھول گیا" دبایا گیا۔ یہاں نشان چیک کریں یا لگائیں۔ | {place} تي سڀ کان وڌيڪ "رستو ڀلجي ويو" دٻايو ويو. هتي نشان چڪاسيو يا لڳايو. |
| [ ] | UI | `insights.recWait` | {dept} has the longest average wait. Consider another counter at peak hours. | {dept} میں اوسط انتظار سب سے زیادہ ہے۔ رش کے وقت ایک اور کاؤنٹر پر غور کریں۔ | {dept} ۾ سراسري انتظار سڀ کان وڌيڪ آهي. ڀيڙ جي وقت هڪ ٻئي ڪائونٽر تي غور ڪريو. |
| [ ] | UI | `insights.recFtr` | Fewer than 8 in 10 visitors reached the right department first time. Review the signs on the main routes. | 10 میں سے 8 سے کم لوگ پہلی بار صحیح شعبے پہنچے۔ مرکزی راستوں کے نشان دیکھیں۔ | 10 مان 8 کان گهٽ ماڻهو پهريون ڀيرو صحيح شعبي پهتا. مکيه رستن جا نشان ڏسو. |
| [ ] | UI | `insights.recLang` | Many visitors use {lang}. Make sure printed signs show it too. | بہت سے لوگ {lang} استعمال کرتے ہیں۔ چھپے نشانوں پر بھی یہ زبان ہو۔ | گهڻا ماڻهو {lang} استعمال ڪن ٿا. ڇپيل نشانن تي به اها ٻولي هجي. |
| [ ] | UI | `insights.noRecs` | No suggestions until there is enough data. | کافی ڈیٹا آنے تک کوئی تجویز نہیں۔ | ڪافي ڊيٽا اچڻ تائين ڪا تجويز ناهي. |
| [ ] | UI | `insights.csv` | Download CSV | CSV ڈاؤن لوڈ کریں | CSV ڊائونلوڊ ڪريو |
| [ ] | UI | `insights.n` | n = {n} | تعداد = {n} | تعداد = {n} |
| [ ] | UI | `assistant.open` | Ask WayMed | وے میڈ سے پوچھیں | وي ميڊ کان پڇو |
| [ ] | UI | `assistant.title` | WayMed assistant | وے میڈ مددگار | وي ميڊ مددگار |
| [ ] | UI | `assistant.label` | Directions, facilities and appointments only. Not medical advice. | صرف راستہ، سہولیات اور وقت لینا۔ طبی مشورہ نہیں۔ | رڳو رستو، سهولتون ۽ وقت وٺڻ. طبي صلاح ناهي. |
| [ ] | UI | `assistant.placeholder` | Type your question | اپنا سوال لکھیں | پنهنجو سوال لکو |
| [ ] | UI | `assistant.send` | Send | بھیجیں | موڪليو |
| [ ] | UI | `assistant.mic` | Speak | بولیں | ڳالهايو |
| [ ] | UI | `assistant.listening` | Listening… | سن رہا ہے… | ٻڌي رهيو آهي… |
| [ ] | UI | `assistant.micUnsupported` | Voice input is not available here. Tap a suggestion or type. | یہاں آواز سے سوال ممکن نہیں۔ کوئی تجویز دبائیں یا لکھیں۔ | هتي آواز سان سوال ممڪن ناهي. ڪا تجويز دٻايو يا لکو. |
| [ ] | UI | `assistant.hello` | Hello! I can help you find a department, water, washrooms, the prayer area, your token or a doctor. What do you need? | السلام علیکم! میں شعبہ، پانی، واش روم، نماز کی جگہ، آپ کا ٹوکن یا ڈاکٹر ڈھونڈنے میں مدد کر سکتا ہوں۔ آپ کو کیا چاہیے؟ | السلام عليڪم! مان شعبو، پاڻي، واش روم، نماز جي جاءِ، توهان جو ٽوڪن يا ڊاڪٽر ڳولڻ ۾ مدد ڪري سگهان ٿو. توهان کي ڇا گهرجي؟ |
| [ ] | UI | `assistant.rulesMode` | Simple answers mode | سادہ جوابات موڈ | سادا جواب موڊ |
| [ ] | UI | `assistant.chip.where` | Where is Children department? | بچوں کا شعبہ کہاں ہے؟ | ٻارن جو شعبو ڪٿي آهي؟ |
| [ ] | UI | `assistant.chip.water` | Where is drinking water? | پینے کا پانی کہاں ہے؟ | پيئڻ جو پاڻي ڪٿي آهي؟ |
| [ ] | UI | `assistant.chip.washroom` | Where are the washrooms? | واش روم کہاں ہے؟ | واش روم ڪٿي آهي؟ |
| [ ] | UI | `assistant.chip.prayer` | Where can I pray? | نماز کہاں پڑھوں؟ | نماز ڪٿي پڙهان؟ |
| [ ] | UI | `assistant.chip.lost` | I am lost | میں راستہ بھول گیا ہوں | مان رستو ڀلجي ويو آهيان |
| [ ] | UI | `assistant.chip.token` | My token | میرا ٹوکن | منهنجو ٽوڪن |
| [ ] | UI | `assistant.chip.doctor` | Which doctor is available? | کون سا ڈاکٹر دستیاب ہے؟ | ڪهڙو ڊاڪٽر دستياب آهي؟ |
| [ ] | UI | `assistant.chip.book` | Book an appointment | وقت لینا ہے | وقت وٺڻو آهي |
| [ ] | UI | `assistant.ans.where` | {dept}: {first} I will show you the route. | {dept}: {first} میں راستہ دکھاتا ہوں۔ | {dept}: {first} مان رستو ڏيکاريان ٿو. |
| [ ] | UI | `assistant.ans.facility` | The nearest {facility} is near {place}. I will show you the way. | قریبی {facility} {place} کے پاس ہے۔ میں راستہ دکھاتا ہوں۔ | ويجهي {facility} {place} وٽ آهي. مان رستو ڏيکاريان ٿو. |
| [ ] | UI | `assistant.ans.lost` | Stay calm. Tell me where you want to go, or scan the WayMed QR on the nearest sign. You can also ask a guide to meet you. | پریشان نہ ہوں۔ بتائیں کہاں جانا ہے، یا قریبی نشان پر وے میڈ کیو آر اسکین کریں۔ آپ رہنما کو بھی بلا سکتے ہیں۔ | پريشان نه ٿيو. ٻڌايو ته ڪٿي وڃڻو آهي، يا ويجهي نشان تي وي ميڊ ڪيو آر اسڪين ڪريو. توهان رهنما کي به سڏي سگهو ٿا. |
| [ ] | UI | `assistant.ans.tokenNone` | I cannot see a slip on this phone. Type your token, for example PED-007, on the "I have a slip" page. | اس فون پر کوئی پرچی نظر نہیں آ رہی۔ "میرے پاس پرچی ہے" والے صفحے پر ٹوکن لکھیں، مثلاً PED-007۔ | هن فون تي ڪا پرچي نظر نٿي اچي. "مون وٽ پرچي آهي" واري صفحي تي ٽوڪن لکو، مثال PED-007. |
| [ ] | UI | `assistant.ans.token` | Token {label}: {status}. | ٹوکن {label}: {status}۔ | ٽوڪن {label}: {status}. |
| [ ] | UI | `assistant.ans.doctor` | Next free time in {dept}: {doctor} at {time}. | {dept} میں اگلا خالی وقت: {doctor}، {time} بجے۔ | {dept} ۾ ايندڙ خالي وقت: {doctor}، {time} وڳي. |
| [ ] | UI | `assistant.ans.doctorNone` | No free times in {dept} in the next 22 hours. Please ask at Registration. | اگلے 22 گھنٹوں میں {dept} میں کوئی وقت خالی نہیں۔ رجسٹریشن پر پوچھیں۔ | ايندڙ 22 ڪلاڪن ۾ {dept} ۾ ڪو وقت خالي ناهي. رجسٽريشن تي پڇو. |
| [ ] | UI | `assistant.ans.doctorAsk` | Which department? Children, Medicine or Laboratory. | کون سا شعبہ؟ بچے، میڈیسن یا لیبارٹری۔ | ڪهڙو شعبو؟ ٻار، ميڊيسن يا ليبارٽري. |
| [ ] | UI | `assistant.ans.book` | Let us book. Choose a doctor and a time on the next screen. | چلیں وقت لیتے ہیں۔ اگلی اسکرین پر ڈاکٹر اور وقت چنیں۔ | اچو وقت وٺون. ايندڙ اسڪرين تي ڊاڪٽر ۽ وقت چونڊيو. |
| [ ] | UI | `assistant.ans.hours` | {hours} | {hours} | {hours} |
| [ ] | UI | `assistant.ans.unknown` | Sorry, I did not understand. I can help with directions, facilities, your token and appointments. | معذرت، سمجھ نہیں آیا۔ میں راستہ، سہولیات، ٹوکن اور وقت لینے میں مدد کر سکتا ہوں۔ | معاف ڪجو، سمجهه ۾ نه آيو. مان رستي، سهولتن، ٽوڪن ۽ وقت وٺڻ ۾ مدد ڪري سگهان ٿو. |
| [ ] | UI | `assistant.ans.limit` | Too many questions in a short time. Please wait a minute, or tap a suggestion. | تھوڑے وقت میں بہت سوال ہو گئے۔ ایک منٹ رکیں یا کوئی تجویز دبائیں۔ | ٿوري وقت ۾ گهڻا سوال ٿي ويا. هڪ منٽ ترسو يا ڪا تجويز دٻايو. |
| [ ] | UI | `assistant.showRoute` | Show route | راستہ دکھائیں | رستو ڏيکاريو |
| [ ] | UI | `assistant.openBooking` | Open booking | بکنگ کھولیں | بُڪنگ کوليو |
| [ ] | UI | `assistant.openToken` | Open my token | میرا ٹوکن کھولیں | منهنجو ٽوڪن کوليو |
| [ ] | UI | `demo.title` | Demo and exhibition mode | ڈیمو اور نمائش موڈ | ڊيمو ۽ نمائش موڊ |
| [ ] | UI | `demo.lead` | Everything here runs on sample data inside this browser. Nothing is written to the live hospital system. | یہاں سب کچھ اسی براؤزر میں نمونہ ڈیٹا پر چلتا ہے۔ ہسپتال کے اصل نظام میں کچھ نہیں لکھا جاتا۔ | هتي سڀ ڪجهه هن ئي برائوزر ۾ نمونو ڊيٽا تي هلي ٿو. اسپتال جي اصل سرشتي ۾ ڪجهه به نٿو لکيو وڃي. |
| [ ] | UI | `demo.banner` | Simulation: sample data, not the live hospital | نقلی مظاہرہ: نمونہ ڈیٹا، اصل ہسپتال نہیں | نقلي مظاهرو: نمونو ڊيٽا، اصل اسپتال ناهي |
| [ ] | UI | `demo.exit` | Leave demo | ڈیمو سے نکلیں | ڊيمو مان نڪرو |
| [ ] | UI | `demo.show` | Presenter show | پریزنٹیشن شو | پريزنٽيشن شو |
| [ ] | UI | `demo.walk` | Walk in their shoes | ان کی جگہ چل کر دیکھیں | سندن جاءِ تي هلي ڏسو |
| [ ] | UI | `demo.visitor` | Try the visitor journey | مریض کا سفر آزمائیں | مريض جو سفر آزمايو |
| [ ] | UI | `demo.desk` | Desk (demo) | کاؤنٹر (ڈیمو) | ڪائونٽر (ڊيمو) |
| [ ] | UI | `demo.staff` | Department queue (demo) | شعبے کی قطار (ڈیمو) | شعبي جي قطار (ڊيمو) |
| [ ] | UI | `demo.board` | Entrance board (demo) | داخلی بورڈ (ڈیمو) | داخلا بورڊ (ڊيمو) |
| [ ] | UI | `demo.kiosk` | Kiosk (demo) | کیوسک (ڈیمو) | ڪيوسڪ (ڊيمو) |
| [ ] | UI | `demo.insights` | Insights layout (sample) | جائزے کا خاکہ (نمونہ) | جائزي جو خاڪو (نمونو) |
| [ ] | UI | `walk.title` | Walk in their shoes | ان کی جگہ چل کر دیکھیں | سندن جاءِ تي هلي ڏسو |
| [ ] | UI | `walk.pick` | Choose a person from our interviews | ہمارے انٹرویوز میں سے ایک شخص چنیں | اسان جي انٽرويوز مان هڪ ماڻهو چونڊيو |
| [ ] | UI | `walk.today` | Today | آج | اڄ |
| [ ] | UI | `walk.with` | With WayMed | وے میڈ کے ساتھ | وي ميڊ سان |
| [ ] | UI | `walk.summary` | Side by side | آمنے سامنے | آمهون سامهون |
| [ ] | UI | `walk.label` | Illustrative, from interview stories, not measured | انٹرویو کی کہانیوں سے مثال، ناپا نہیں گیا | انٽرويو جي ڪهاڻين مان مثال، ماپيل ناهي |
| [ ] | UI | `walk.again` | Choose another person | کوئی اور شخص چنیں | ٻيو ماڻهو چونڊيو |
| [ ] | UI | `walk.expected` | Expected (hypothesis) | متوقع (مفروضہ) | متوقع (مفروضو) |
| [ ] | UI | `show.controls` | Space or Right: next · Left: back · A: auto-play · P: pause · R: restart · F: fullscreen · H: hide controls · S: safe mode | اسپیس یا دایاں: آگے · بایاں: پیچھے · A: خودکار · P: روکیں · R: دوبارہ · F: پوری اسکرین · H: کنٹرول چھپائیں · S: محفوظ موڈ | اسپيس يا ساڄو: اڳيون · کاٻو: پويون · A: پاڻمرادو · P: روڪيو · R: ٻيهر · F: پوري اسڪرين · H: ڪنٽرول لڪايو · S: محفوظ موڊ |
| [ ] | UI | `show.safe` | Safe mode | محفوظ موڈ | محفوظ موڊ |
| [ ] | UI | `show.auto` | Auto-play | خودکار | پاڻمرادو |
| [ ] | UI | `show.paused` | Paused | رکا ہوا | رڪيل |
| [ ] | UI | `health.title` | System health | نظام کی صحت | سرشتي جي صحت |
| [ ] | UI | `health.ok` | All systems working | سب کچھ ٹھیک کام کر رہا ہے | سڀ ڪجهه ٺيڪ ڪم ڪري رهيو آهي |
| [ ] | UI | `health.bad` | Problem detected | مسئلہ ملا | مسئلو مليو |
| [ ] | UI | `health.server` | Server | سرور | سرور |
| [ ] | UI | `health.db` | Database | ڈیٹا بیس | ڊيٽابيس |
| [ ] | UI | `health.realtime` | Live updates | براہ راست اپ ڈیٹ | سڌيون اپڊيٽون |
| [ ] | UI | `health.sw` | Offline cache | آف لائن محفوظ | آف لائن محفوظ |
| [ ] | UI | `health.assistant` | Assistant | مددگار | مددگار |
| [ ] | UI | `health.llm` | Language model connected | لینگویج ماڈل جڑا ہوا ہے | لينگويج ماڊل ڳنڍيل آهي |
| [ ] | UI | `health.rules` | Simple answers mode (no model key) | سادہ جوابات موڈ (ماڈل کی کلید نہیں) | سادا جواب موڊ (ماڊل جي ڪنجي ناهي) |
| [ ] | UI | `v.focus` | From the hospital gate to the right department, in your language. | ہسپتال کے دروازے سے صحیح شعبے تک، آپ کی زبان میں۔ | اسپتال جي دروازي کان صحيح شعبي تائين، توهان جي ٻوليءَ ۾. |
| [ ] | UI | `v.howTitle` | How it works | یہ کیسے کام کرتا ہے | هي ڪيئن ڪم ڪري ٿو |
| [ ] | UI | `v.how1` | Get a slip at the Slip Room | پرچی کمرے سے پرچی لیں | پرچي ڪمري مان پرچي وٺو |
| [ ] | UI | `v.how2` | Follow the map to your department | نقشے کے ساتھ اپنے شعبے تک جائیں | نقشي سان پنهنجي شعبي تائين وڃو |
| [ ] | UI | `v.how3` | Wait. We tell you when it is your turn | انتظار کریں۔ باری آنے پر ہم بتائیں گے | انتظار ڪريو. واري اچڻ تي اسين ٻڌائينداسين |
| [ ] | UI | `v.atGate` | I am at the hospital gate | میں ہسپتال کے دروازے پر ہوں | مان اسپتال جي دروازي تي آهيان |
| [ ] | UI | `v.tour` | Take the demo tour | ڈیمو ٹور دیکھیں | ڊيمو ٽور ڏسو |
| [ ] | UI | `v.resume` | Continue my visit | اپنا دورہ جاری رکھیں | پنهنجو دورو جاري رکو |
| [ ] | UI | `v.newVisit` | Start a new visit | نیا دورہ شروع کریں | نئون دورو شروع ڪريو |
| [ ] | UI | `v.ch.gate` | Gate | دروازہ | دروازو |
| [ ] | UI | `v.ch.slip` | Slip | پرچی | پرچي |
| [ ] | UI | `v.ch.map` | Map | نقشہ | نقشو |
| [ ] | UI | `v.ch.wait` | Wait | انتظار | انتظار |
| [ ] | UI | `v.ch.turn` | Your turn | آپ کی باری | توهان جي واري |
| [ ] | UI | `v.progress` | Part {n} of 5 | حصہ {n} از 5 | حصو {n} مان 5 |
| [ ] | UI | `v.nav.journey` | Journey | سفر | سفر |
| [ ] | UI | `v.nav.map` | Map | نقشہ | نقشو |
| [ ] | UI | `v.nav.more` | More | مزید | وڌيڪ |
| [ ] | UI | `v.nav.help` | Help | مدد | مدد |
| [ ] | UI | `v.gate.title` | Welcome. We will guide you. | خوش آمدید۔ ہم آپ کی رہنمائی کریں گے۔ | ڀليڪار. اسين توهان جي رهنمائي ڪنداسين. |
| [ ] | UI | `v.gate.lead` | Your visit has five parts: | آپ کے دورے کے پانچ حصے ہیں: | توهان جي دوري جا پنج حصا آهن: |
| [ ] | UI | `v.gate.calm` | Take a breath. You do not need to ask anyone the way. | اطمینان رکھیں۔ کسی سے راستہ پوچھنے کی ضرورت نہیں۔ | آرام سان. ڪنهن کان رستو پڇڻ جي ضرورت ناهي. |
| [ ] | UI | `v.gate.start` | Start my visit | دورہ شروع کریں | دورو شروع ڪريو |
| [ ] | UI | `v.slip.title` | Get your slip | اپنی پرچی لیں | پنهنجي پرچي وٺو |
| [ ] | UI | `v.slip.go` | First, walk to the Slip Room. | پہلے پرچی کمرے تک جائیں۔ | پهريان پرچي ڪمري تائين وڃو. |
| [ ] | UI | `v.slip.atRoom` | I am at the Slip Room | میں پرچی کمرے میں ہوں | مان پرچي ڪمري ۾ آهيان |
| [ ] | UI | `v.slip.need` | What do you need? | آپ کو کیا چاہیے؟ | توهان کي ڇا گهرجي؟ |
| [ ] | UI | `v.need.checkup` | Check-up | معائنہ | معائنو |
| [ ] | UI | `v.need.child` | Child | بچہ | ٻار |
| [ ] | UI | `v.need.emergency` | Accident or emergency | حادثہ یا ایمرجنسی | حادثو يا ايمرجنسي |
| [ ] | UI | `v.need.lab` | Test or lab | ٹیسٹ یا لیب | ٽيسٽ يا ليب |
| [ ] | UI | `v.need.medicine` | Medicines | دوائیں | دوائون |
| [ ] | UI | `v.slip.get` | Get my slip | پرچی لیں | پرچي وٺو |
| [ ] | UI | `v.slip.printed` | I already have a printed slip | میرے پاس چھپی ہوئی پرچی ہے | مون وٽ ڇپيل پرچي آهي |
| [ ] | UI | `v.slip.yours` | Your slip | آپ کی پرچی | توهان جي پرچي |
| [ ] | UI | `v.slip.headsUp` | {dept} has your token {n} and knows you are coming. | {dept} کے پاس آپ کا ٹوکن {n} ہے اور انہیں معلوم ہے کہ آپ آ رہے ہیں۔ | {dept} وٽ توهان جو ٽوڪن {n} آهي ۽ کين خبر آهي ته توهان اچي رهيا آهيو. |
| [ ] | UI | `v.slip.noData` | This slip holds no personal data. | اس پرچی پر کوئی ذاتی معلومات نہیں۔ | هن پرچي تي ڪا ذاتي معلومات ناهي. |
| [ ] | UI | `v.slip.next` | Show me the way | راستہ دکھائیں | رستو ڏيکاريو |
| [ ] | UI | `v.slip.limit` | This phone has taken several slips. Please ask at the Slip Room. | اس فون سے کئی پرچیاں لی جا چکی ہیں۔ پرچی کمرے میں پوچھیں۔ | هن فون مان ڪيتريون پرچيون ورتيون ويون. پرچي ڪمري ۾ پڇو. |
| [ ] | UI | `v.slip.emergency` | For an accident or emergency, do not wait for a slip. Go to Emergency now. | حادثے یا ایمرجنسی میں پرچی کا انتظار نہ کریں۔ ابھی ایمرجنسی جائیں۔ | حادثي يا ايمرجنسي ۾ پرچي جو انتظار نه ڪريو. هاڻي ايمرجنسي وڃو. |
| [ ] | UI | `v.slip.change` | Change | بدلیں | مٽايو |
| [ ] | UI | `v.loc.title` | Share your location? | اپنا مقام شیئر کریں؟ | پنهنجي جاءِ شيئر ڪريو؟ |
| [ ] | UI | `v.loc.body` | Share your location so WayMed can tell you if you take a wrong turn. | اپنا مقام شیئر کریں تاکہ غلط موڑ پر وے میڈ آپ کو بتا سکے۔ | پنهنجي جاءِ شيئر ڪريو ته جيئن غلط موڙ تي وي ميڊ توهان کي ٻڌائي سگهي. |
| [ ] | UI | `v.loc.privacy` | It stays on this phone, is never sent or saved, and stops when your visit ends. | یہ اسی فون پر رہتا ہے، کبھی بھیجا یا محفوظ نہیں ہوتا، اور دورہ ختم ہونے پر بند ہو جاتا ہے۔ | هي هن ئي فون تي رهي ٿو، ڪڏهن موڪليو يا محفوظ نٿو ٿئي، ۽ دورو ختم ٿيڻ تي بند ٿي وڃي ٿو. |
| [ ] | UI | `v.loc.allow` | Allow | اجازت دیں | اجازت ڏيو |
| [ ] | UI | `v.loc.skip` | Skip | چھوڑیں | ڇڏيو |
| [ ] | UI | `v.loc.denied` | Location is off. Use checkpoints: tap the place you reach, or scan its QR sign. | مقام بند ہے۔ چیک پوائنٹ استعمال کریں: جہاں پہنچیں اسے دبائیں یا اس کا کیو آر اسکین کریں۔ | جاءِ بند آهي. چيڪ پوائنٽ استعمال ڪريو: جتي پهچو اهو دٻايو يا ان جو ڪيو آر اسڪين ڪريو. |
| [ ] | UI | `v.loc.far` | You seem to be away from the hospital map, so we use checkpoints. | آپ ہسپتال کے نقشے سے دور لگتے ہیں، اس لیے چیک پوائنٹ استعمال ہو رہے ہیں۔ | توهان اسپتال جي نقشي کان پري لڳو ٿا، تنهنڪري چيڪ پوائنٽ استعمال ٿي رهيا آهن. |
| [ ] | UI | `v.loc.weak` | Location is not precise here. Checkpoints still work. | یہاں مقام درست نہیں۔ چیک پوائنٹ پھر بھی کام کرتے ہیں۔ | هتي جاءِ درست ناهي. چيڪ پوائنٽ اڃا به ڪم ڪن ٿا. |
| [ ] | UI | `v.map.next` | Next step | اگلا قدم | ايندڙ قدم |
| [ ] | UI | `v.map.stepOf` | Step {n} of {total} | قدم {n} از {total} | قدم {n} مان {total} |
| [ ] | UI | `v.map.reached` | I reached {place} | میں {place} پہنچ گیا | مان {place} پهچي ويس |
| [ ] | UI | `v.map.elsewhere` | I am somewhere else | میں کہیں اور ہوں | مان ڪنهن ٻئي هنڌ آهيان |
| [ ] | UI | `v.map.pick` | Tap where you are now | جہاں آپ ابھی ہیں اسے دبائیں | جتي توهان هاڻي آهيو اهو دٻايو |
| [ ] | UI | `v.map.arrived` | You have arrived | آپ پہنچ گئے | توهان پهچي ويا |
| [ ] | UI | `v.map.toWait` | Wait for my turn | اپنی باری کا انتظار | پنهنجي واري جو انتظار |
| [ ] | UI | `v.map.checkpoint` | Checkpoint mode | چیک پوائنٹ موڈ | چيڪ پوائنٽ موڊ |
| [ ] | UI | `v.map.gps` | Location on | مقام آن | جاءِ آن |
| [ ] | UI | `v.map.scanHint` | Tip: scan the QR sign at any landmark to update your route. | مشورہ: راستہ تازہ کرنے کے لیے کسی بھی نشان کا کیو آر اسکین کریں۔ | صلاح: رستو تازو ڪرڻ لاءِ ڪنهن به نشان جو ڪيو آر اسڪين ڪريو. |
| [ ] | UI | `v.map.wrong` | You may be going the wrong way. Turn back to {place}. | آپ شاید غلط راستے پر ہیں۔ واپس {place} کی طرف مڑیں۔ | توهان شايد غلط رستي تي آهيو. واپس {place} ڏانهن مڙو. |
| [ ] | UI | `v.map.wrongCheckpoint` | {place} is not on your route. Here is the new way. | {place} آپ کے راستے میں نہیں۔ یہ نیا راستہ ہے۔ | {place} توهان جي رستي ۾ ناهي. هي نئون رستو آهي. |
| [ ] | UI | `v.map.rerouted` | New route ready | نیا راستہ تیار | نئون رستو تيار |
| [ ] | UI | `v.map.dismiss` | OK | ٹھیک ہے | ٺيڪ آهي |
| [ ] | UI | `v.wait.title` | Wait for your turn | اپنی باری کا انتظار کریں | پنهنجي واري جو انتظار ڪريو |
| [ ] | UI | `v.wait.lead` | Sit nearby. This page updates by itself. | قریب بیٹھیں۔ یہ صفحہ خود اپ ڈیٹ ہوتا ہے۔ | ويجهو ويهو. هي صفحو پاڻ اپڊيٽ ٿئي ٿو. |
| [ ] | UI | `v.wait.near` | Near you | آپ کے قریب | توهان جي ويجهو |
| [ ] | UI | `v.wait.book` | Book a later time instead | اس کے بجائے بعد کا وقت لیں | ان بدران بعد جو وقت وٺو |
| [ ] | UI | `v.wait.ask` | Ask WayMed | وے میڈ سے پوچھیں | وي ميڊ کان پڇو |
| [ ] | UI | `v.turn.title` | Your turn now | اب آپ کی باری ہے | هاڻي توهان جي واري آهي |
| [ ] | UI | `v.turn.go` | Please go in to {dept}. | براہ کرم {dept} میں جائیں۔ | مهرباني ڪري {dept} ۾ وڃو. |
| [ ] | UI | `v.turn.finish` | Finish visit | دورہ ختم کریں | دورو ختم ڪريو |
| [ ] | UI | `v.turn.ended` | Visit finished. Location is off and your visit is cleared from this phone. | دورہ ختم۔ مقام بند ہے اور دورہ اس فون سے صاف کر دیا گیا۔ | دورو ختم. جاءِ بند آهي ۽ دورو هن فون تان صاف ڪيو ويو. |
| [ ] | UI | `v.more.title` | More | مزید | وڌيڪ |
| [ ] | UI | `v.more.facilities` | Facilities | سہولیات | سهولتون |
| [ ] | UI | `v.more.book` | Appointments | اپوائنٹمنٹ | اپائنٽمينٽ |
| [ ] | UI | `v.more.assistant` | Voice assistant | آواز مددگار | آواز مددگار |
| [ ] | UI | `v.more.followup` | Follow-up card | دوبارہ آنے کا کارڈ | ٻيهر اچڻ جو ڪارڊ |
| [ ] | UI | `v.more.prepare` | Before you come | آنے سے پہلے | اچڻ کان اڳ |
| [ ] | UI | `v.more.story` | Our research | ہماری تحقیق | اسان جي تحقيق |
| [ ] | UI | `v.more.walk` | Walk in their shoes | ان کی جگہ چل کر دیکھیں | سندن جاءِ تي هلي ڏسو |
| [ ] | UI | `v.more.show` | Presenter show | پریزنٹیشن شو | پريزنٽيشن شو |
| [ ] | UI | `v.help.title` | Help | مدد | مدد |
| [ ] | UI | `v.help.how` | How to use WayMed in 30 seconds | 30 سیکنڈ میں وے میڈ کا استعمال | 30 سيڪنڊن ۾ وي ميڊ جو استعمال |
| [ ] | UI | `v.help.h1` | At the gate, tap "I am at the hospital gate". | دروازے پر "میں ہسپتال کے دروازے پر ہوں" دبائیں۔ | دروازي تي "مان اسپتال جي دروازي تي آهيان" دٻايو. |
| [ ] | UI | `v.help.h2` | At the Slip Room, choose what you need and get your slip. | پرچی کمرے میں بتائیں کیا چاہیے اور پرچی لیں۔ | پرچي ڪمري ۾ ٻڌايو ڇا گهرجي ۽ پرچي وٺو. |
| [ ] | UI | `v.help.h3` | Follow the next-step card. Tap "I reached" at each place. | اگلے قدم کا کارڈ دیکھیں۔ ہر جگہ "میں پہنچ گیا" دبائیں۔ | ايندڙ قدم جو ڪارڊ ڏسو. هر هنڌ "مان پهچي ويس" دٻايو. |
| [ ] | UI | `v.help.h4` | Sit and wait. Your phone turns green when it is your turn. | بیٹھ کر انتظار کریں۔ باری آنے پر فون سبز ہو جائے گا۔ | ويهي انتظار ڪريو. واري اچڻ تي فون سائو ٿي ويندو. |
| [ ] | UI | `v.help.staff` | Need a person? Tell any staff member in uniform, or go to the Help Desk at the Slip Room. | کسی سے بات کرنی ہے؟ وردی میں کسی بھی عملے کو بتائیں یا پرچی کمرے کے ہیلپ ڈیسک پر جائیں۔ | ڪنهن سان ڳالهائڻو آهي؟ وردي ۾ ڪنهن به عملي کي ٻڌايو يا پرچي ڪمري جي هيلپ ڊيسڪ تي وڃو. |
| [ ] | UI | `v.help.good` | Good to know: location works best outdoors; indoors, use checkpoints. Alerts always show inside the app. Alerts while the app is closed may not arrive, especially on iPhone unless WayMed is added to the Home Screen. | اہم بات: مقام باہر بہتر کام کرتا ہے؛ اندر چیک پوائنٹ استعمال کریں۔ اطلاع ایپ کے اندر ہمیشہ دکھتی ہے۔ ایپ بند ہو تو اطلاع شاید نہ آئے، خاص طور پر آئی فون پر جب تک وے میڈ ہوم اسکرین پر نہ ہو۔ | ڄاڻڻ لائق: جاءِ ٻاهر بهتر ڪم ڪري ٿي؛ اندر چيڪ پوائنٽ استعمال ڪريو. اطلاع ايپ اندر هميشه ڏسجي ٿي. ايپ بند هجي ته اطلاع شايد نه اچي، خاص ڪري آئي فون تي جيستائين وي ميڊ هوم اسڪرين تي نه هجي. |
| [ ] | UI | `v.map.title` | Find a place | جگہ ڈھونڈیں | جاءِ ڳوليو |
| [ ] | UI | `v.demoData` | Demo data | ڈیمو ڈیٹا | ڊيمو ڊيٽا |
| [ ] | UI | `v.tour.title` | Demo tour | ڈیمو ٹور | ڊيمو ٽور |
| [ ] | UI | `v.tour.auto` | Auto-play | خودکار | پاڻمرادو |
| [ ] | UI | `v.tour.pause` | Pause | روکیں | روڪيو |
| [ ] | UI | `v.tour.restart` | Restart | دوبارہ | ٻيهر |
| [ ] | UI | `v.tour.what` | What is happening | کیا ہو رہا ہے | ڇا ٿي رهيو آهي |
| [ ] | UI | `v.tour.pain` | Pain point removed | کون سی مشکل ختم ہوئی | ڪهڙي مشڪل ختم ٿي |
| [ ] | UI | `v.tour.evidence` | From our interviews | ہمارے انٹرویوز سے | اسان جي انٽرويوز مان |
| [ ] | UI | `v.tour.exit` | Exit tour | ٹور بند کریں | ٽور بند ڪريو |
| [ ] | UI | `v.need.women` | Women's health | خواتین کی صحت | عورتن جي صحت |
| [ ] | UI | `v.need.surgery` | Surgery | سرجری | سرجري |
| [ ] | UI | `v.need.eye` | Eyes | آنکھیں | اکيون |
| [ ] | UI | `v.need.ent` | Ear, nose, throat | کان، ناک، گلا | ڪن، نڪ، ڳلو |
| [ ] | UI | `v.need.xray` | X-ray or ultrasound | ایکسرے یا الٹراساؤنڈ | ايڪسري يا الٽراسائونڊ |
| [ ] | UI | `guide.facilityHere` | {facility}: right here, next to {place}. | {facility}: یہیں، {place} کے ساتھ۔ | {facility}: هتي ئي، {place} جي ڀرسان. |
| [ ] | UI | `v.turn.after` | After your check-up | معائنے کے بعد | معائني کان پوءِ |
| [ ] | UI | `v.turn.openCard` | Open the follow-up card | دوبارہ آنے کا کارڈ کھولیں | ٻيهر اچڻ جو ڪارڊ کوليو |
| [ ] | UI | `v.home.eyebrow` | Pilot guide for visitors | مریضوں کے لیے پائلٹ رہنما | مريضن لاءِ پائلٽ رهنما |
| [ ] | UI | `v.home.quick` | What do you need today? | آج آپ کو کیا چاہیے؟ | اڄ توهان کي ڇا گهرجي؟ |
| [ ] | UI | `v.home.depts` | Departments and today's queue | شعبے اور آج کی قطار | شعبا ۽ اڄ جي قطار |
| [ ] | UI | `v.home.allDepts` | All departments on the map | نقشے پر تمام شعبے | نقشي تي سڀ شعبا |
| [ ] | UI | `v.home.nowServing` | Now serving | ابھی باری | هاڻي واري |
| [ ] | UI | `v.home.waiting` | {n} waiting | {n} انتظار میں | {n} انتظار ۾ |
| [ ] | UI | `v.home.visit` | Visiting hours and help | اوقات اور مدد | وقت ۽ مدد |
| [ ] | UI | `v.home.helpDesk` | Help desks at the Slip Room and Main Junction. Staff in uniform can always help. | ہیلپ ڈیسک پرچی کمرے اور مرکزی چوراہے پر ہیں۔ وردی میں عملہ ہمیشہ مدد کر سکتا ہے۔ | هيلپ ڊيسڪ پرچي ڪمري ۽ مکيه چوواٽي تي آهن. وردي ۾ عملو هميشه مدد ڪري سگهي ٿو. |
| [ ] | UI | `v.home.footer` | WayMed pilot for Civil Hospital Karachi. Floor plan, doctors, timings and queues shown here are demo data. | سول ہسپتال کراچی کے لیے وے میڈ پائلٹ۔ یہاں دکھایا گیا نقشہ، ڈاکٹر، اوقات اور قطاریں ڈیمو ڈیٹا ہیں۔ | سول اسپتال ڪراچي لاءِ وي ميڊ پائلٽ. هتي ڏيکاريل نقشو، ڊاڪٽر، وقت ۽ قطارون ڊيمو ڊيٽا آهن. |
| [ ] | UI | `v.home.pilot` | Pilot | پائلٹ | پائلٽ |
| [ ] | UI | `v.home.live` | Live | براہ راست | سڌو |
| [ ] | UI | `v.ask.anytime` | Ask WayMed | وے میڈ سے پوچھیں | وي ميڊ کان پڇو |
| [ ] | UI | `v.home.sub` | In English, Urdu or Sindhi. No account, no waiting in the wrong line. | اردو، سندھی یا انگریزی میں۔ کوئی اکاؤنٹ نہیں، غلط قطار میں انتظار نہیں۔ | سنڌي، اردو يا انگريزي ۾. ڪو اڪائونٽ ناهي، غلط قطار ۾ انتظار ناهي. |
| [ ] | UI | `v.journey.title` | Your visit, in five steps | آپ کا دورہ، پانچ قدموں میں | توهان جو دورو، پنجن قدمن ۾ |
| [ ] | UI | `v.journey.gate` | Open WayMed at the gate and choose your language. | دروازے پر وے میڈ کھولیں اور اپنی زبان چنیں۔ | دروازي تي وي ميڊ کوليو ۽ پنهنجي ٻولي چونڊيو. |
| [ ] | UI | `v.journey.slip` | Tell us what you need and get your token. | بتائیں کیا چاہیے اور اپنا ٹوکن لیں۔ | ٻڌايو ڇا گهرجي ۽ پنهنجو ٽوڪن وٺو. |
| [ ] | UI | `v.journey.map` | Follow the next-step card. Wrong turn? We tell you. | اگلے قدم کا کارڈ دیکھیں۔ غلط موڑ پر ہم بتائیں گے۔ | ايندڙ قدم جو ڪارڊ ڏسو. غلط موڙ تي اسين ٻڌائينداسين. |
| [ ] | UI | `v.journey.wait` | Sit nearby and see your place in the line. | قریب بیٹھیں اور قطار میں اپنی جگہ دیکھیں۔ | ويجهو ويهو ۽ قطار ۾ پنهنجي جاءِ ڏسو. |
| [ ] | UI | `v.journey.turn` | Your phone turns green: go in. | فون سبز ہو جائے: اندر جائیں۔ | فون سائو ٿي وڃي: اندر وڃو. |
| [ ] | UI | `v.nav.ask` | Ask | پوچھیں | پڇو |
| [ ] | UI | `v.map.zoomIn` | Zoom in | زوم اِن | زوم اِن |
| [ ] | UI | `v.map.zoomOut` | Zoom out | زوم آؤٹ | زوم آئوٽ |
| [ ] | UI | `v.map.recentre` | Re-centre | دوبارہ مرکز | ٻيهر مرڪز |
| [ ] | UI | `v.fac.more` | +{n} more | +{n} اور | +{n} ٻيا |
| [ ] | UI | `v.map.destination` | Destination: {place} | منزل: {place} | منزل: {place} |
| [ ] | UI | `v.wait.closed` | {dept} is closed now. | {dept} ابھی بند ہے۔ | {dept} هن وقت بند آهي. |
| [ ] | UI | `v.wait.opens` | It opens {when}. | یہ {when} کھلے گا۔ | اهو {when} کلندو. |
| [ ] | UI | `v.wait.closedHint` | Your token stays in the line. If you prefer, book a time instead. | آپ کا ٹوکن قطار میں رہے گا۔ چاہیں تو اس کی جگہ وقت بک کر لیں۔ | توهان جو ٽوڪن قطار ۾ رهندو. چاهيو ته ان بدران وقت بُڪ ڪريو. |
| [ ] | UI | `v.wait.bookTime` | Book a time | وقت بک کریں | وقت بُڪ ڪريو |
| [ ] | UI | `book.choose` | Choose a time | وقت چنیں | وقت چونڊيو |
| [ ] | UI | `followup.printOptional` | Print (optional) | پرنٹ کریں (اختیاری) | پرنٽ ڪريو (اختياري) |
| [ ] | UI | `v.more.tourSub` | Watch a whole visit, about {min} minutes | پورا دورہ دیکھیں، تقریباً {min} منٹ | سڄو دورو ڏسو، لڳ ڀڳ {min} منٽ |
| [ ] | UI | `v.more.walkSub` | Follow people from our interviews through their visit | ہمارے انٹرویوز کے لوگوں کے ساتھ ان کا دورہ دیکھیں | اسان جي انٽرويوز وارن ماڻهن سان سندن دورو ڏسو |
| [ ] | UI | `v.more.showSub` | Full-screen slides, about {min} minutes | فل اسکرین سلائیڈز، تقریباً {min} منٹ | مڪمل اسڪرين سلائيڊون، لڳ ڀڳ {min} منٽ |
| [ ] | UI | `v.home.seeAll` | See all {n} departments | تمام {n} شعبے دیکھیں | سڀ {n} شعبا ڏسو |
| [ ] | UI | `show.swipe` | Swipe or tap to move | آگے بڑھنے کے لیے سوائپ یا ٹیپ کریں | اڳتي وڌڻ لاءِ سوائپ يا ٽيپ ڪريو |
| [ ] | UI | `show.rotate` | Turn your phone sideways for a bigger view | بڑا دیکھنے کے لیے فون کو آڑا کریں | وڏو ڏسڻ لاءِ فون کي ترڇو ڪريو |
| [ ] | UI | `v.story.eyebrow` | Our design-thinking story | ہماری ڈیزائن تھنکنگ کہانی | اسان جي ڊيزائن ٿنڪنگ ڪهاڻي |
| [ ] | UI | `v.story.title` | From one hospital visit to this app | ایک ہسپتال کے دورے سے اس ایپ تک | هڪ اسپتال جي دوري کان هن ايپ تائين |
| [ ] | UI | `v.story.team` | Our team | ہماری ٹیم | اسان جي ٽيم |
| [ ] | UI | `v.story.raw` | Our raw idea, in one sentence | ہمارا خام آئیڈیا، ایک جملے میں | اسان جو خام خيال، هڪ جملي ۾ |
| [ ] | UI | `v.story.then` | Then we built it: this web app. | پھر ہم نے اسے بنایا: یہی ویب ایپ۔ | پوءِ اسان اهو ٺاهيو: هيءَ ويب ايپ. |
| [ ] | Hospital | `hospital.name` | Civil Hospital Karachi (pilot) | سول ہسپتال کراچی (پائلٹ) | سول اسپتال ڪراچي (پائلٽ) |
| [ ] | Hospital | `hospital.openHours` | Demo hours: Outpatient clinics Monday to Saturday, 8:00 am to 2:00 pm (some evening clinics). Laboratory and Pharmacy every day, 8:00 am to 8:00 pm. Emergency and Radiology open 24 hours. | ڈیمو اوقات: او پی ڈی پیر تا ہفتہ، صبح 8 سے دوپہر 2 بجے (کچھ شام کے کلینک)۔ لیبارٹری اور فارمیسی روزانہ صبح 8 سے رات 8۔ ایمرجنسی اور ریڈیالوجی 24 گھنٹے کھلی۔ | ڊيمو وقت: او پي ڊي سومر کان ڇنڇر، صبح 8 کان منجهند 2 وڳي (ڪجهه شام جون ڪلينڪون). ليبارٽري ۽ فارميسي روزانو صبح 8 کان رات 8. ايمرجنسي ۽ ريڊيالاجي 24 ڪلاڪ کليل. |
| [ ] | Department | `emergency.name` | Emergency | ایمرجنسی | ايمرجنسي |
| [ ] | Department | `emergency.openHours` | Demo hours: open 24 hours | ڈیمو اوقات: 24 گھنٹے کھلا | ڊيمو وقت: 24 ڪلاڪ کليل |
| [ ] | Department | `paediatrics.name` | Children (Paediatrics) | بچوں کا شعبہ | ٻارن جو شعبو |
| [ ] | Department | `paediatrics.openHours` | Demo hours: Mon to Sat, 8:00 to 14:00 | ڈیمو اوقات: پیر تا ہفتہ، صبح 8 سے دوپہر 2 | ڊيمو وقت: سومر کان ڇنڇر، صبح 8 کان منجهند 2 |
| [ ] | Department | `medicine.name` | Medicine (OPD) | میڈیسن او پی ڈی | ميڊيسن او پي ڊي |
| [ ] | Department | `medicine.openHours` | Demo hours: Mon to Sat, 8:00 to 14:00. Evening clinic Sun, Tue, Thu, Sat, 14:00 to 20:00 | ڈیمو اوقات: پیر تا ہفتہ، صبح 8 سے دوپہر 2۔ شام کا کلینک اتوار، منگل، جمعرات، ہفتہ، دوپہر 2 سے رات 8 | ڊيمو وقت: سومر کان ڇنڇر، صبح 8 کان منجهند 2. شام جي ڪلينڪ آچر، اڱارو، خميس، ڇنڇر، منجهند 2 کان رات 8 |
| [ ] | Department | `lab.name` | Laboratory | لیبارٹری | ليبارٽري |
| [ ] | Department | `lab.openHours` | Demo hours: every day, 8:00 to 20:00 | ڈیمو اوقات: روزانہ، صبح 8 سے رات 8 | ڊيمو وقت: روزانو، صبح 8 کان رات 8 |
| [ ] | Department | `pharmacy.name` | Pharmacy | فارمیسی | فارميسي |
| [ ] | Department | `pharmacy.openHours` | Demo hours: every day, 8:00 to 20:00 | ڈیمو اوقات: روزانہ، صبح 8 سے رات 8 | ڊيمو وقت: روزانو، صبح 8 کان رات 8 |
| [ ] | Department | `surgery.name` | Surgery (OPD) | سرجری او پی ڈی | سرجري او پي ڊي |
| [ ] | Department | `surgery.openHours` | Demo hours: Mon to Sat, 8:00 to 14:00 | ڈیمو اوقات: پیر تا ہفتہ، صبح 8 سے دوپہر 2 | ڊيمو وقت: سومر کان ڇنڇر، صبح 8 کان منجهند 2 |
| [ ] | Department | `gynae.name` | Women (Gynaecology) | خواتین (گائنی) | عورتون (گائني) |
| [ ] | Department | `gynae.openHours` | Demo hours: Mon to Sat, 8:00 to 14:00. Evening clinic Sun, Tue, Thu, Sat, 14:00 to 20:00 | ڈیمو اوقات: پیر تا ہفتہ، صبح 8 سے دوپہر 2۔ شام کا کلینک اتوار، منگل، جمعرات، ہفتہ، دوپہر 2 سے رات 8 | ڊيمو وقت: سومر کان ڇنڇر، صبح 8 کان منجهند 2. شام جي ڪلينڪ آچر، اڱارو، خميس، ڇنڇر، منجهند 2 کان رات 8 |
| [ ] | Department | `ent.name` | ENT (Ear, Nose, Throat) | کان، ناک اور گلا | ڪن، نڪ ۽ ڳلو |
| [ ] | Department | `ent.openHours` | Demo hours: Mon, Wed, Fri, 9:00 to 13:00 | ڈیمو اوقات: پیر، بدھ، جمعہ، صبح 9 سے دوپہر 1 | ڊيمو وقت: سومر، اربع، جمعو، صبح 9 کان منجهند 1 |
| [ ] | Department | `eye.name` | Eye | آنکھوں کا شعبہ | اکين جو شعبو |
| [ ] | Department | `eye.openHours` | Demo hours: Tue, Thu, Sat, 9:00 to 13:00 | ڈیمو اوقات: منگل، جمعرات، ہفتہ، صبح 9 سے دوپہر 1 | ڊيمو وقت: اڱارو، خميس، ڇنڇر، صبح 9 کان منجهند 1 |
| [ ] | Department | `radiology.name` | Radiology (X-ray, Ultrasound) | ایکسرے اور الٹراساؤنڈ | ايڪسري ۽ الٽراسائونڊ |
| [ ] | Department | `radiology.openHours` | Demo hours: open 24 hours | ڈیمو اوقات: 24 گھنٹے کھلا | ڊيمو وقت: 24 ڪلاڪ کليل |
| [ ] | Landmark | `entrance` | Main Entrance | مرکزی دروازہ | مکيه دروازو |
| [ ] | Landmark | `registration` | Slip Room (Registration) | پرچی کمرہ (رجسٹریشن) | پرچي ڪمرو (رجسٽريشن) |
| [ ] | Landmark | `ramp` | Ramp | ریمپ | ريمپ |
| [ ] | Landmark | `junction` | Main Junction | مرکزی چوراہا | مکيه چوواٽو |
| [ ] | Landmark | `waiting` | Waiting Hall | انتظار گاہ | انتظار گاهه |
| [ ] | Landmark | `labCorridor` | Lab Corridor | لیب راہداری | ليب جي لنگهه |
| [ ] | Landmark | `pharmacyGate` | Pharmacy Gate | فارمیسی گیٹ | فارميسي گيٽ |
| [ ] | Landmark | `door_emr` | Emergency door | ایمرجنسی کا دروازہ | ايمرجنسي جو دروازو |
| [ ] | Landmark | `door_ped` | Children department door | بچوں کے شعبے کا دروازہ | ٻارن جي شعبي جو دروازو |
| [ ] | Landmark | `door_med` | Medicine OPD door | میڈیسن او پی ڈی کا دروازہ | ميڊيسن او پي ڊي جو دروازو |
| [ ] | Landmark | `door_lab` | Laboratory door | لیبارٹری کا دروازہ | ليبارٽري جو دروازو |
| [ ] | Landmark | `door_pha` | Pharmacy window | فارمیسی کی کھڑکی | فارميسي جي دري |
| [ ] | Landmark | `door_sur` | Surgery OPD door | سرجری او پی ڈی کا دروازہ | سرجري او پي ڊي جو دروازو |
| [ ] | Landmark | `door_gyn` | Women's clinic door | خواتین کلینک کا دروازہ | عورتن جي ڪلينڪ جو دروازو |
| [ ] | Landmark | `door_ent` | ENT clinic door | ای این ٹی کلینک کا دروازہ | اي اين ٽي ڪلينڪ جو دروازو |
| [ ] | Landmark | `door_eye` | Eye clinic door | آنکھوں کے کلینک کا دروازہ | اکين جي ڪلينڪ جو دروازو |
| [ ] | Landmark | `door_rad` | X-ray room door | ایکسرے روم کا دروازہ | ايڪسري روم جو دروازو |
| [ ] | Facility | `f_water_junction` | Drinking water | پینے کا پانی | پيئڻ جو پاڻي |
| [ ] | Facility | `f_water_waiting` | Drinking water | پینے کا پانی | پيئڻ جو پاڻي |
| [ ] | Facility | `f_wc_registration` | Washrooms | واش روم | واش روم |
| [ ] | Facility | `f_wc_waiting` | Washrooms | واش روم | واش روم |
| [ ] | Facility | `f_seat_waiting` | Shaded seating | سایہ دار نشستیں | ڇانوَ واريون سيٽون |
| [ ] | Facility | `f_seat_pharmacy` | Shaded seating | سایہ دار نشستیں | ڇانوَ واريون سيٽون |
| [ ] | Facility | `f_prayer` | Prayer area | نماز کی جگہ | نماز جي جاءِ |
| [ ] | Facility | `f_help_registration` | Help desk | ہیلپ ڈیسک | هيلپ ڊيسڪ |
| [ ] | Facility | `f_help_junction` | Help desk | ہیلپ ڈیسک | هيلپ ڊيسڪ |
| [ ] | Doctor (sample) | `d_ped_1` | Dr. Ayesha Khan (demo) | ڈاکٹر عائشہ خان (ڈیمو) | ڊاڪٽر عائشه خان (ڊيمو) |
| [ ] | Doctor (sample) | `d_ped_2` | Dr. Bilal Ahmed (demo) | ڈاکٹر بلال احمد (ڈیمو) | ڊاڪٽر بلال احمد (ڊيمو) |
| [ ] | Doctor (sample) | `d_med_1` | Dr. Saima Siddiqui (demo) | ڈاکٹر صائمہ صدیقی (ڈیمو) | ڊاڪٽر صائمه صديقي (ڊيمو) |
| [ ] | Doctor (sample) | `d_med_2` | Dr. Asif Soomro (demo) | ڈاکٹر آصف سومرو (ڈیمو) | ڊاڪٽر آصف سومرو (ڊيمو) |
| [ ] | Doctor (sample) | `d_lab_1` | Sample collection counter | نمونہ جمع کرنے کا کاؤنٹر | نمونو گڏ ڪرڻ جو ڪائونٽر |
| [ ] | Doctor (sample) | `d_sur_1` | Dr. Imran Qureshi (demo) | ڈاکٹر عمران قریشی (ڈیمو) | ڊاڪٽر عمران قريشي (ڊيمو) |
| [ ] | Doctor (sample) | `d_gyn_1` | Dr. Farah Memon (demo) | ڈاکٹر فرح میمن (ڈیمو) | ڊاڪٽر فرح ميمڻ (ڊيمو) |
| [ ] | Doctor (sample) | `d_gyn_2` | Dr. Nadia Shah (demo) | ڈاکٹر نادیہ شاہ (ڈیمو) | ڊاڪٽر ناديه شاهه (ڊيمو) |
| [ ] | Doctor (sample) | `d_ent_1` | Dr. Kashif Baloch (demo) | ڈاکٹر کاشف بلوچ (ڈیمو) | ڊاڪٽر ڪاشف بلوچ (ڊيمو) |
| [ ] | Doctor (sample) | `d_eye_1` | Dr. Sana Abbasi (demo) | ڈاکٹر ثنا عباسی (ڈیمو) | ڊاڪٽر ثنا عباسي (ڊيمو) |
| [ ] | Story | `HMW` | How might we help first-time visitors reach the right department the first time? | ہم پہلی بار آنے والوں کو پہلی ہی بار صحیح شعبے تک پہنچنے میں کیسے مدد کر سکتے ہیں؟ | اسين پهريون ڀيرو ايندڙن کي پهرين ئي ڀيري صحيح شعبي تائين پهچڻ ۾ ڪيئن مدد ڪري سگهون ٿا؟ |
| [ ] | Persona | `khurshid.name` | Khurshid | خورشید | خورشيد |
| [ ] | Persona | `khurshid.role` | Attendant from Thatta | تیماردار، ٹھٹھہ سے | سنڀاليندڙ، ٺٽي کان |
| [ ] | Persona | `khurshid.evidence.0` | Did not know where to go or whom to ask. | نہیں جانتے تھے کہاں جائیں یا کس سے پوچھیں۔ | خبر نه هئي ته ڪٿي وڃن يا ڪنهن کان پڇن. |
| [ ] | Persona | `khurshid.evidence.1` | No place for attendants to sit; told to move on. | تیمارداروں کے بیٹھنے کی جگہ نہیں؛ آگے بڑھنے کو کہا گیا۔ | سنڀاليندڙن لاءِ ويهڻ جي جاءِ ناهي؛ اڳتي وڃڻ لاءِ چيو ويو. |
| [ ] | Persona | `khurshid.evidence.2` | Early discharge with unclear follow-up. | جلد چھٹی، مگر آگے کیا کرنا ہے واضح نہیں۔ | جلد موڪل، پر اڳتي ڇا ڪجي واضح ناهي. |
| [ ] | Persona | `shams.name` | Shams | شمس | شمس |
| [ ] | Persona | `shams.role` | Father of a 7-year-old | 7 سالہ بچے کے والد | 7 سالن جي ٻار جو پيءُ |
| [ ] | Persona | `shams.evidence.0` | One person said "emergency no. 3", another sent him elsewhere. | ایک نے کہا "ایمرجنسی نمبر 3"، دوسرے نے کہیں اور بھیج دیا۔ | هڪ چيو "ايمرجنسي نمبر 3"، ٻئي ڪنهن ٻئي هنڌ موڪليو. |
| [ ] | Persona | `shams.evidence.1` | Hours lost while the child got worse. | گھنٹے ضائع ہوئے اور بچے کی حالت بگڑتی رہی۔ | ڪلاڪ ضايع ٿيا ۽ ٻار جي حالت خراب ٿيندي رهي. |
| [ ] | Persona | `shams.evidence.2` | No news from inside. | اندر سے کوئی خبر نہیں۔ | اندران ڪا خبر ناهي. |
| [ ] | Persona | `shams.evidence.3` | The mother could not follow medical language. | ماں طبی زبان نہیں سمجھ پائیں۔ | ماءُ طبي ٻولي سمجهي نه سگهي. |
| [ ] | Persona | `ashok.name` | Ashok | اشوک | اشوڪ |
| [ ] | Persona | `ashok.role` | Attendant from Sanghar | تیماردار، سانگھڑ سے | سنڀاليندڙ، سانگهڙ کان |
| [ ] | Persona | `ashok.evidence.0` | Lab reports pending for weeks. | لیب رپورٹیں ہفتوں سے رکی ہوئی۔ | ليب رپورٽون هفتن کان رڪيل. |
| [ ] | Persona | `ashok.evidence.1` | The family slept on the floor. | گھر والے فرش پر سوئے۔ | گهر وارا فرش تي سمهيا. |
| [ ] | Persona | `ashok.evidence.2` | Daily food costs. | روزانہ کھانے کا خرچ۔ | روزانو کاڌي جو خرچ. |
| [ ] | Persona | `abdullah.name` | Abdullah | عبداللہ | عبدالله |
| [ ] | Persona | `abdullah.role` | Doctor's assistant | ڈاکٹر کے معاون | ڊاڪٽر جو مددگار |
| [ ] | Persona | `abdullah.evidence.0` | Patients arrive with little early guidance. | مریض بہت کم ابتدائی رہنمائی کے ساتھ آتے ہیں۔ | مريض تمام گهٽ شروعاتي رهنمائي سان اچن ٿا. |
| [ ] | Persona | `abdullah.evidence.1` | There is a follow-up gap. | دوبارہ آنے میں خلا ہے۔ | ٻيهر اچڻ ۾ خال آهي. |
| [ ] | Persona | `tahira.name` | Dr. Tahira | ڈاکٹر طاہرہ | ڊاڪٽر طاهره |
| [ ] | Persona | `tahira.role` | Child specialist, Child Emergency | ماہر اطفال، چائلڈ ایمرجنسی | ٻارن جي ماهر، چائلڊ ايمرجنسي |
| [ ] | Persona | `tahira.evidence.0` | Reported 6 to 9 attendants crowding each child. | بتایا کہ ہر بچے کے گرد 6 سے 9 تیماردار ہوتے ہیں۔ | ٻڌايو ته هر ٻار جي چوڌاري 6 کان 9 سنڀاليندڙ هوندا آهن. |
| [ ] | Persona | `tahira.evidence.1` | Pharmacy is not digitised; shifts are irregular. | فارمیسی ڈیجیٹل نہیں؛ شفٹیں بے قاعدہ ہیں۔ | فارميسي ڊجيٽل ناهي؛ شفٽون بي ترتيب آهن. |
| [ ] | Persona | `adil.name` | Adil | عادل | عادل |
| [ ] | Persona | `adil.role` | Nurse intern, Emergency | نرس انٹرن، ایمرجنسی | نرس انٽرن، ايمرجنسي |
| [ ] | Persona | `adil.evidence.0` | Sometimes a patient needs a doctor but only an intern is there. | کبھی مریض کو ڈاکٹر چاہیے ہوتا ہے مگر صرف انٹرن موجود ہوتا ہے۔ | ڪڏهن مريض کي ڊاڪٽر گهرجي پر رڳو انٽرن موجود هوندو آهي. |
| [ ] | Persona | `adil.evidence.1` | About 6 people crowd around each patient, with few resources. | ہر مریض کے گرد تقریباً 6 لوگ، وسائل کم۔ | هر مريض جي چوڌاري لڳ ڀڳ 6 ماڻهو، وسيلا گهٽ. |
| [ ] | Mood | `lost` | Lost | گم | گم |
| [ ] | Mood | `worried` | Worried | پریشان | پريشان |
| [ ] | Mood | `tired` | Exhausted | تھکا ہوا | ٿڪل |
| [ ] | Mood | `oriented` | Knows the way | راستہ معلوم | رستو معلوم |
| [ ] | Mood | `informed` | Informed | باخبر | باخبر |
| [ ] | Mood | `calm` | Calmer | پرسکون | پرسڪون |
| [ ] | Walk | `khurshid.0.today` | Arrives with the patient. Does not know where to go or whom to ask. | مریض کے ساتھ پہنچے۔ نہیں جانتے کہاں جائیں یا کس سے پوچھیں۔ | مريض سان پهتو. خبر ناهي ڪٿي وڃي يا ڪنهن کان پڇي. |
| [ ] | Walk | `khurshid.0.waymed` | Scans the entrance QR, picks Urdu, taps the department card. A route appears. | داخلے کا کیو آر اسکین، اردو چنی، شعبے کا کارڈ دبایا۔ راستہ سامنے۔ | داخلا جو ڪيو آر اسڪين، سنڌي چونڊي، شعبي جو ڪارڊ دٻايو. رستو سامهون. |
| [ ] | Walk | `khurshid.0.feature` | Language first + route | پہلے زبان + راستہ | پهريان ٻولي + رستو |
| [ ] | Walk | `khurshid.1.today` | No place to sit. Told to move on. | بیٹھنے کی جگہ نہیں۔ آگے بڑھنے کو کہا گیا۔ | ويهڻ جي جاءِ ناهي. اڳتي وڃڻ لاءِ چيو ويو. |
| [ ] | Walk | `khurshid.1.waymed` | The family page shows shaded seating and water near the waiting hall. | گھر والوں کے صفحے پر انتظار گاہ کے قریب سایہ دار نشستیں اور پانی۔ | گهر وارن جي صفحي تي انتظار گاهه ويجهو ڇانوَ واريون سيٽون ۽ پاڻي. |
| [ ] | Walk | `khurshid.1.feature` | Facilities layer | سہولیات کی تہہ | سهولتن جي تهه |
| [ ] | Walk | `khurshid.2.today` | Early discharge. What next is unclear. | جلد چھٹی۔ آگے کیا کرنا ہے واضح نہیں۔ | جلد موڪل. اڳتي ڇا ڪجي واضح ناهي. |
| [ ] | Walk | `khurshid.2.waymed` | A follow-up card in simple Urdu and Sindhi: next date, bring reports, come to Emergency if worse. | سادہ اردو اور سندھی میں کارڈ: اگلی تاریخ، رپورٹیں لائیں، حالت خراب ہو تو ایمرجنسی۔ | سادي اردو ۽ سنڌي ۾ ڪارڊ: ايندڙ تاريخ، رپورٽون آڻيو، حالت خراب ٿئي ته ايمرجنسي. |
| [ ] | Walk | `khurshid.2.feature` | Follow-up card | دوبارہ آنے کا کارڈ | ٻيهر اچڻ جو ڪارڊ |
| [ ] | Walk | `shams.0.today` | Child unwell. One person says "emergency no. 3", another points elsewhere. | بچہ بیمار۔ ایک کہتا ہے "ایمرجنسی نمبر 3"، دوسرا کہیں اور۔ | ٻار بيمار. هڪ چوي "ايمرجنسي نمبر 3"، ٻيو ڪنهن ٻئي هنڌ. |
| [ ] | Walk | `shams.0.waymed` | Presses the red Emergency button: one fastest route from where he stands, no slip needed. | سرخ ایمرجنسی بٹن: جہاں کھڑے ہیں وہاں سے ایک تیز ترین راستہ، پرچی کی ضرورت نہیں۔ | ڳاڙهو ايمرجنسي بٽڻ: جتي بيٺو آهي اتان هڪ تيز رستو، پرچي جي ضرورت ناهي. |
| [ ] | Walk | `shams.0.feature` | Emergency button | ایمرجنسی بٹن | ايمرجنسي بٽڻ |
| [ ] | Walk | `shams.1.today` | Hours lost walking between places while the child gets worse. | جگہ جگہ چلتے گھنٹے ضائع، بچے کی حالت بگڑتی رہی۔ | هنڌ هنڌ هلندي ڪلاڪ ضايع، ٻار جي حالت خراب ٿيندي رهي. |
| [ ] | Walk | `shams.1.waymed` | A wrong turn? The QR on the next sign shows "You are here" and the corrected route. | غلط موڑ؟ اگلے نشان کا کیو آر "آپ یہاں ہیں" اور درست راستہ دکھاتا ہے۔ | غلط موڙ؟ ايندڙ نشان جو ڪيو آر "توهان هتي آهيو" ۽ درست رستو ڏيکاري ٿو. |
| [ ] | Walk | `shams.1.feature` | Landmark QR | مقام کا کیو آر | جاءِ جو ڪيو آر |
| [ ] | Walk | `shams.2.today` | No news from inside. | اندر سے کوئی خبر نہیں۔ | اندران ڪا خبر ناهي. |
| [ ] | Walk | `shams.2.waymed` | The token page shows waiting, you are next, your turn, and the family can follow it too. | ٹوکن صفحہ: انتظار، اگلی باری، اب باری۔ گھر والے بھی دیکھ سکتے ہیں۔ | ٽوڪن صفحو: انتظار، ايندڙ واري، هاڻي واري. گهر وارا به ڏسي سگهن ٿا. |
| [ ] | Walk | `shams.2.feature` | Live status + family share | تازہ صورتحال + گھر والے | تازي صورتحال + گهر وارا |
| [ ] | Walk | `shams.3.today` | The mother cannot follow medical language. | ماں طبی زبان نہیں سمجھ پاتیں۔ | ماءُ طبي ٻولي سمجهي نٿي سگهي. |
| [ ] | Walk | `shams.3.waymed` | Every screen in Sindhi or Urdu, with icons and a Listen button. | ہر اسکرین سندھی یا اردو میں، نشانات اور "سنیں" بٹن کے ساتھ۔ | هر اسڪرين سنڌي يا اردو ۾، نشانين ۽ "ٻڌو" بٽڻ سان. |
| [ ] | Walk | `shams.3.feature` | Three languages + voice | تین زبانیں + آواز | ٽي ٻوليون + آواز |
| [ ] | Walk | `ashok.0.today` | Lab reports pending for weeks. Keeps coming back to ask. | لیب رپورٹیں ہفتوں سے رکی۔ بار بار پوچھنے آتے ہیں۔ | ليب رپورٽون هفتن کان رڪيل. بار بار پڇڻ اچي ٿو. |
| [ ] | Walk | `ashok.0.waymed` | A lab token shows its live status, so a trip to ask is not needed. (WayMed cannot speed up the lab itself.) | لیب ٹوکن کی تازہ صورتحال، پوچھنے آنے کی ضرورت نہیں۔ (لیب کا کام تیز نہیں کرتا۔) | ليب ٽوڪن جي تازي صورتحال، پڇڻ اچڻ جي ضرورت ناهي. (ليب جو ڪم تيز نٿو ڪري.) |
| [ ] | Walk | `ashok.0.feature` | Token status | ٹوکن صورتحال | ٽوڪن صورتحال |
| [ ] | Walk | `ashok.1.today` | The family sleeps on the floor. | گھر والے فرش پر سوتے ہیں۔ | گهر وارا فرش تي سمهن ٿا. |
| [ ] | Walk | `ashok.1.waymed` | The plan shows shaded seating, water and washrooms. Beds for families need a hospital decision. | نقشے پر سایہ دار نشستیں، پانی اور واش روم۔ گھر والوں کے بستر ہسپتال کا فیصلہ ہے۔ | نقشي تي ڇانوَ واريون سيٽون، پاڻي ۽ واش روم. گهر وارن جا بسترا اسپتال جو فيصلو. |
| [ ] | Walk | `ashok.1.feature` | Facilities layer | سہولیات کی تہہ | سهولتن جي تهه |
| [ ] | Walk | `ashok.2.today` | Daily food costs add up. | روزانہ کھانے کا خرچ بڑھتا جاتا ہے۔ | روزانو کاڌي جو خرچ وڌندو وڃي. |
| [ ] | Walk | `ashok.2.waymed` | The pre-visit page says what to bring, aiming for fewer wasted trips (hypothesis). | آنے سے پہلے کا صفحہ بتاتا ہے کیا لائیں، تاکہ کم چکر لگیں (مفروضہ)۔ | اچڻ کان اڳ وارو صفحو ٻڌائي ته ڇا آڻجي، ته جيئن گهٽ چڪر لڳن (مفروضو). |
| [ ] | Walk | `ashok.2.feature` | Pre-visit page | آنے سے پہلے | اچڻ کان اڳ |
| [ ] | Journey | `0.stage` | Arrive | پہنچنا | پهچڻ |
| [ ] | Journey | `0.today` | Lost: did not know where to go or whom to ask | گم: کہاں جائیں، کس سے پوچھیں | گم: ڪٿي وڃون، ڪنهن کان پڇون |
| [ ] | Journey | `0.expected` | Welcomed in my own language | اپنی زبان میں خوش آمدید | پنهنجي ٻوليءَ ۾ ڀليڪار |
| [ ] | Journey | `0.feature` | Language first, pre-visit page | پہلے زبان، آنے سے پہلے | پهريان ٻولي، اچڻ کان اڳ |
| [ ] | Journey | `1.stage` | Find the way | راستہ ڈھونڈنا | رستو ڳولڻ |
| [ ] | Journey | `1.today` | Conflicting directions ("emergency no. 3") | متضاد ہدایات ("ایمرجنسی نمبر 3") | متضاد هدايتون ("ايمرجنسي نمبر 3") |
| [ ] | Journey | `1.expected` | One clear route, one colour and shape | ایک واضح راستہ، ایک رنگ اور شکل | هڪ واضح رستو، هڪ رنگ ۽ شڪل |
| [ ] | Journey | `1.feature` | Slip QR, route, department signs | پرچی کیو آر، راستہ، نشان | پرچي ڪيو آر، رستو، نشان |
| [ ] | Journey | `2.stage` | Wrong turn | غلط موڑ | غلط موڙ |
| [ ] | Journey | `2.today` | Hours lost while the child got worse | گھنٹے ضائع، بچہ بگڑتا رہا | ڪلاڪ ضايع، ٻار خراب ٿيندو رهيو |
| [ ] | Journey | `2.expected` | Corrected at the next sign | اگلے نشان پر درستی | ايندڙ نشان تي درستي |
| [ ] | Journey | `2.feature` | Landmark QR, "I feel lost", guide | مقام کیو آر، "راستہ بھول گیا"، رہنما | جاءِ ڪيو آر، "رستو ڀلجي ويو"، رهنما |
| [ ] | Journey | `3.stage` | Wait | انتظار | انتظار |
| [ ] | Journey | `3.today` | No news; nowhere to sit; told to move on | کوئی خبر نہیں؛ بیٹھنے کی جگہ نہیں | ڪا خبر ناهي؛ ويهڻ جي جاءِ ناهي |
| [ ] | Journey | `3.expected` | I know my place in line and where to sit | قطار میں اپنی جگہ اور بیٹھنے کی جگہ معلوم | قطار ۾ پنهنجي جاءِ ۽ ويهڻ جي جاءِ معلوم |
| [ ] | Journey | `3.feature` | Live status, board, facilities, family page | تازہ صورتحال، بورڈ، سہولیات | تازي صورتحال، بورڊ، سهولتون |
| [ ] | Journey | `4.stage` | Consultation | معائنہ | معائنو |
| [ ] | Journey | `4.today` | Medical language hard to follow; follow-up unclear | طبی زبان مشکل؛ آگے واضح نہیں | طبي ٻولي ڏکي؛ اڳتي واضح ناهي |
| [ ] | Journey | `4.expected` | I leave knowing when to come back | معلوم کہ دوبارہ کب آنا ہے | معلوم ته ٻيهر ڪڏهن اچڻو آهي |
| [ ] | Journey | `4.feature` | Your-turn alert, follow-up card | باری کی اطلاع، کارڈ | واري جي اطلاع، ڪارڊ |
| [ ] | Evidence | `0` | Language first, Listen button | پہلے زبان، سنیں بٹن | پهريان ٻولي، ٻڌو بٽڻ |
| [ ] | Evidence | `1` | One route + Emergency button | ایک راستہ + ایمرجنسی بٹن | هڪ رستو + ايمرجنسي بٽڻ |
| [ ] | Evidence | `2` | Landmark QR + "I feel lost" | مقام کیو آر + راستہ بھول گیا | جاءِ ڪيو آر + رستو ڀلجي ويو |
| [ ] | Evidence | `3` | Live token status + family share | تازہ ٹوکن + گھر والے | تازو ٽوڪن + گهر وارا |
| [ ] | Evidence | `4` | Facilities layer | سہولیات کی تہہ | سهولتن جي تهه |
| [ ] | Evidence | `5` | Follow-up card, pre-visit page | کارڈ، آنے سے پہلے | ڪارڊ، اچڻ کان اڳ |
| [ ] | Evidence | `6` | "One or two attendants" guidance | "ایک یا دو تیماردار" | "هڪ يا ٻه سنڀاليندڙ" |
| [ ] | Rejected | `0.idea` | Camera tracking of visitors | کیمرے سے نگرانی | ڪئميرا سان نگراني |
| [ ] | Rejected | `0.why` | Privacy, cost, maintenance | رازداری، خرچ، دیکھ بھال | رازداري، خرچ، سار سنڀال |
| [ ] | Rejected | `1.idea` | Walking guide robots | چلنے والے روبوٹ | هلندڙ روبوٽ |
| [ ] | Rejected | `1.why` | Cost | خرچ | خرچ |
| [ ] | Pilot | `0` | One department, two weeks | ایک شعبہ، دو ہفتے | هڪ شعبو، ٻه هفتا |
| [ ] | Pilot | `1` | Measure: task success rate | پیمائش: کام میں کامیابی کی شرح | ماپ: ڪم ۾ ڪاميابي جي شرح |
| [ ] | Pilot | `2` | Measure: time to reach the department | پیمائش: شعبے تک پہنچنے کا وقت | ماپ: شعبي تائين پهچڻ جو وقت |
| [ ] | Pilot | `3` | Measure: first-time-right rate (one-tap question) | پیمائش: پہلی بار صحیح پہنچنے کی شرح | ماپ: پهريون ڀيرو صحيح پهچڻ جي شرح |
| [ ] | Pilot | `4` | Before: hospital approval, signage, real schedules, staff training, Sindhi review | پہلے: ہسپتال کی منظوری، نشانات، اصل اوقات، تربیت، سندھی جانچ | اڳ ۾: اسپتال جي منظوري، نشان، اصل وقت، تربيت، سنڌي جانچ |
