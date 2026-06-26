/**
 * Adds "new mandate listed" broadcast notification to all members
 * when admin approves a mandate (review route APPROVED + unhide route).
 */
const fs = require('fs');
const f = 'src/routes/admin.ts';
let c = fs.readFileSync(f, 'utf8');

// ─── 1. In the /review route, after the owner notification, add broadcast ───
// Anchor: the end of the owner notification block inside the review IIFE
const reviewAnchor = "          console.log('[admin] mandate review notification sent to', mandateOwnerId, 'status:', reviewStatus);\r\n        }\r\n      } catch (e) { console.error('[admin] mandate review notification error:', e); }\r\n    })();";

const reviewBroadcast = `          console.log('[admin] mandate review notification sent to', mandateOwnerId, 'status:', reviewStatus);
        }
        // Broadcast to all members when mandate goes APPROVED/ACTIVE
        if (reviewStatus === 'APPROVED') {
          const { data: posterProfile } = await supabase
            .from('profiles').select('company_name').eq('id', mandateOwnerId).maybeSingle();
          const companyName = (posterProfile as any)?.company_name || 'A member';
          const { data: allProfiles } = await supabase
            .from('profiles').select('id').neq('id', mandateOwnerId);
          const otherIds = ((allProfiles as any[]) || []).map((p: any) => p.id);
          await Promise.all(otherIds.map(async (uid: string) => {
            try {
              const nb = await createNotification({
                userId: uid,
                type: 'MANDATE_POSTED',
                title: 'New Mandate Listed',
                message: companyName + ' has posted a new mandate: "' + mandateTitle + '" — check it out on the marketplace!',
                relatedEntityId: req.params.id,
                relatedEntityType: 'mandate',
              });
              emitToUsers([uid], 'notification:new', nb);
            } catch (_) {}
          }));
          console.log('[admin] broadcast mandate-listed notification to', otherIds.length, 'members');
        }
      } catch (e) { console.error('[admin] mandate review notification error:', e); }
    })();`;

const reviewAnchorLF = reviewAnchor.replace(/\r\n/g, '\n');
const reviewBroadcastLF = reviewBroadcast.replace(/\r\n/g, '\n');

if (c.includes(reviewAnchor)) {
  c = c.replace(reviewAnchor, reviewBroadcast);
  console.log('[1] Added broadcast to /mandates/:id/review (CRLF)');
} else if (c.includes(reviewAnchorLF)) {
  c = c.replace(reviewAnchorLF, reviewBroadcastLF);
  console.log('[1] Added broadcast to /mandates/:id/review (LF)');
} else {
  console.log('[1] ERROR: could not find review anchor. Trying partial search...');
  const partial = "console.log('[admin] mandate review notification sent to'";
  if (c.includes(partial)) console.log('  Partial anchor found - check whitespace');
  else console.log('  Partial anchor NOT found');
}

// ─── 2. In the /unhide route, add broadcast after owner notification ─────────
const unhideAnchor = "          console.log('[admin] mandate unhide notification sent to', mandateOwnerId3);";
const unhideBroadcast = `          console.log('[admin] mandate unhide notification sent to', mandateOwnerId3);
          // Broadcast to all members
          const { data: posterProfile3 } = await supabase
            .from('profiles').select('company_name').eq('id', mandateOwnerId3).maybeSingle();
          const companyName3 = (posterProfile3 as any)?.company_name || 'A member';
          const mandateTitle3b = ((data as any).title || 'Untitled') as string;
          const { data: allProfiles3 } = await supabase
            .from('profiles').select('id').neq('id', mandateOwnerId3);
          const otherIds3 = ((allProfiles3 as any[]) || []).map((p: any) => p.id);
          await Promise.all(otherIds3.map(async (uid3: string) => {
            try {
              const nb3 = await createNotification({
                userId: uid3,
                type: 'MANDATE_POSTED',
                title: 'New Mandate Listed',
                message: companyName3 + ' has posted a new mandate: "' + mandateTitle3b + '" — check it out on the marketplace!',
                relatedEntityId: req.params.id,
                relatedEntityType: 'mandate',
              });
              emitToUsers([uid3], 'notification:new', nb3);
            } catch (_) {}
          }));
          console.log('[admin] broadcast mandate-listed (unhide) to', otherIds3.length, 'members');`;

if (c.includes(unhideAnchor)) {
  c = c.replace(unhideAnchor, unhideBroadcast);
  console.log('[2] Added broadcast to /mandates/:id/unhide');
} else {
  console.log('[2] ERROR: could not find unhide anchor');
  const partial = "console.log('[admin] mandate unhide notification sent to'";
  console.log('  Partial search:', c.includes(partial) ? 'FOUND' : 'NOT FOUND');
}

// also need to pass supabase into the review IIFE — check if it's already accessible
// The IIFE is inside the route handler, so supabase is in scope. Good.

fs.writeFileSync(f, c, 'utf8');
console.log('\nadmin.ts saved.');
