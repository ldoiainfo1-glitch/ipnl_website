const fs = require('fs');
const f = 'D:/shalinii/ipnl_website/backend/src/routes/admin.ts';
let c = fs.readFileSync(f, 'utf8');

const normalized = c.replace(/\r\n/g, '\n');

const old = `    user: user ? toUserDTO(user, { kycStatus: row.status }) : undefined,`;
const neu = `    user: user ? await toUserDTO(user, { kycStatus: row.status }) : undefined,`;

if (normalized.includes(old)) {
  const usesCRLF = c.includes('\r\n');
  const fixed = normalized.replace(old, neu);
  fs.writeFileSync(f, usesCRLF ? fixed.replace(/\n/g, '\r\n') : fixed);
  console.log('SUCCESS');
} else {
  console.log('NOT FOUND');
  const idx = normalized.indexOf('user ? toUserDTO');
  console.log('Context:', idx >= 0 ? normalized.substring(idx - 5, idx + 80) : 'none');
}
