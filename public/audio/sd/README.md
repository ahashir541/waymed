# Native Sindhi voice recordings (to be recorded)

Most phones and kiosks have no Sindhi text-to-speech voice. When a Sindhi voice is missing,
WayMed plays short recordings from this folder for core phrases, and always shows the text.

## How to add recordings

1. Ask a native Sindhi speaker to record each phrase below, calm and slow, as `.mp3` (mono, 64 kbps is enough).
2. Save each file in this folder, e.g. `welcome.mp3`.
3. Add it to `manifest.json`, e.g. `"clips": { "welcome": "welcome.mp3", "emergency": "emergency.mp3" }`.
4. Rebuild (`npm run build`). The files are cached for offline use.

## Phrases (clip id: text to record)

| Clip id | Sindhi text (draft, TODO: native review) | English meaning |
|---|---|---|
| welcome | وي ميڊ ۾ ڀليڪار. پنهنجي ٻولي چونڊيو. | Welcome to WayMed. Choose your language. |
| emergency | سڌو ايمرجنسي وڃو. ڳاڙهي رستي تي هلو. ڪنهن به عملي کي ٻڌايو ته ايمرجنسي آهي. | Go straight to Emergency... |
| your_turn | هاڻي توهان جي واري آهي. | It is your turn now. |
| you_are_next | ايندڙ واري توهان جي آهي. | You are next. |
| go_straight | سڌو وڃو. | Go straight. |
| turn_left | کاٻي پاسي مڙو. | Turn left. |
| turn_right | ساڄي پاسي مڙو. | Turn right. |
| arrived | توهان پهچي ويا. | You have arrived. |
| ask_staff | مدد لاءِ ويجهي عملي کان پڇو. | Ask the nearest staff member for help. |
