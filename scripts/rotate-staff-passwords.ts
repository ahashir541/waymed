// Gives every staff account a new random password and writes it to data/STAFF-LOGINS.txt (git-ignored).
// Use if the logins file was ever shared by mistake.   node scripts/rotate-staff-passwords.ts
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { loadConfig } from '../server/config.ts';
import { openDb } from '../server/db.ts';
import { listStaff, updateStaff } from '../server/auth.ts';

const db = openDb(loadConfig().databasePath);
const pw = randomBytes(12).toString('base64url');
const staff = listStaff(db);
for (const u of staff) updateStaff(db, u.id, { password: pw });
db.close();
const file = 'data/STAFF-LOGINS.txt';
let text: string;
try {
  text = readFileSync(file, 'utf8');
} catch {
  text = 'WayMed staff logins (local server). Keep this file private.\n';
}
text = /Password for all accounts below: .*/.test(text) ? text.replace(/Password for all accounts below: .*/, `Password for all accounts below: ${pw}`) : `${text}\nPassword for all accounts below: ${pw}\n`;
writeFileSync(file, text);
console.log(`New password set for ${staff.length} staff accounts and saved in ${file}. Old sessions were signed out.`);
