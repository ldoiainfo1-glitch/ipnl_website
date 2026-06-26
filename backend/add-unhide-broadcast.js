const fs = require('fs');
const f = 'src/routes/admin.ts';
let c = fs.readFileSync(f, 'utf8');

// Find line 592 content (emitToUsers for unhide) to use as anchor
const lines = c.split('\n');
// Find the unhide notification block ending
let targetLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('[admin] mandate unhide notification sent to')) {
    targetLine = i;
    break;
  }
}
if (targetLine === -1) {
  console.log('ERROR: could not find unhide notification line');
  process.exit(1);
}
console.log('Found unhide notification at line', targetLine + 1);
console.log('Content:', lines[targetLine]);

// Insert broadcast lines after targetLine, before the catch line
const broadcastLines = [
  "        // Broadcast to all members when mandate goes live",
  "        const { data: posterProfile3 } = await supabase.from('profiles').select('company_name').eq('id', mandateOwnerId3).maybeSingle();",
  "        const companyName3 = (posterProfile3 as any)?.company_name || 'A member';",
  "        const mandateTitle3b = ((data as any).title || 'Untitled') as string;",
  "        const { data: allProfiles3 } = await supabase.from('profiles').select('id').neq('id', mandateOwnerId3);",
  "        const otherIds3 = ((allProfiles3 as any[]) || []).map((p: any) => p.id);",
  "        await Promise.all(otherIds3.map(async (uid3: string) => {",
  "          try {",
  "            const nb3 = await createNotification({ userId: uid3, type: 'MANDATE_POSTED', title: 'New Mandate Listed', message: companyName3 + ' has posted a new mandate: \"' + mandateTitle3b + '\" — check it out on the marketplace!', relatedEntityId: req.params.id, relatedEntityType: 'mandate' });",
  "            emitToUsers([uid3], 'notification:new', nb3);",
  "          } catch (_) {}",
  "        }));",
  "        console.log('[admin] broadcast mandate-listed (unhide) to', otherIds3.length, 'members');"
];

// Insert after targetLine
lines.splice(targetLine + 1, 0, ...broadcastLines);
fs.writeFileSync(f, lines.join('\n'), 'utf8');
console.log('FIXED - added broadcast after line', targetLine + 1);
