// The server answers in all three languages, so it registers every dictionary at start-up.
import { registerDictionary } from '../src/lib/i18n/core.ts';
import { ur } from '../src/lib/i18n/ur.ts';
import { sd } from '../src/lib/i18n/sd.ts';

registerDictionary('ur', ur);
registerDictionary('sd', sd);
