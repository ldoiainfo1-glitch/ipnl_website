/**
 * Adds mandate approval/rejection notifications to all three admin mandate routes.
 */
const fs = require('fs');
const file = 'src/routes/admin.ts';
let c = fs.readFileSync(file, 'utf8');

// ─── Shared notification helper string ──────────────────────────────────────

// ─── 1. PATCH /mandates/:id/review ──────────────────────────────────────────
// Insert notification block between writeAuditLog and return res.json
const reviewAudit = "    await writeAuditLog(req.user!.id, `MANDATE_${body.status}`, 'mandate_review', req.params.id, body.note);";
const reviewReturn = "\n    const review = rowToMandateReview(reviewRow);";

if (c.includes(reviewAudit) && !c.includes('MANDATE review notification')) {
  const notifBlock = `
    // Fire-and-forget mandate review notification
    ;(async () => {
      try {
        const mandateOwnerId = existing.data.user_id as string;
        const mandateTitle = (existing.data.title || 'Your mandate') as string;
        const reviewStatus = body.status;
        let msg = '';
        if (reviewStatus === 'APPROVED') msg = 'Your mandate "' + mandateTitle + '" has been approved and is now live on the marketplace!';
        else if (reviewStatus === 'REJECTED') msg = 'Your mandate "' + mandateTitle + '" was rejected. Note: ' + (body.note || '');
        else if (reviewStatus === 'UNDER_REVIEW') msg = 'Your mandate "' + mandateTitle + '" is currently under review. Note: ' + (body.note || '');
        if (msg) {
          const n = await createNotification({ userId: mandateOwnerId, type: 'MANDATE_UPDATED', title: 'Mandate ' + reviewStatus, message: msg, relatedEntityId: req.params.id, relatedEntityType: 'mandate' });
          emitToUsers([mandateOwnerId], 'notification:new', n);
          console.log('[admin] mandate review notification sent to', mandateOwnerId, 'status:', reviewStatus);
        }
      } catch (e) { console.error('[admin] mandate review notification error:', e); }
    })();`;

  c = c.replace(reviewAudit, reviewAudit + notifBlock);
  console.log('[1] Added notification to PATCH /mandates/:id/review');
} else if (c.includes('MANDATE review notification')) {
  console.log('[1] Already present in /mandates/:id/review');
} else {
  console.log('[1] ERROR: could not find anchor in /mandates/:id/review');
}

// ─── 2. PATCH /mandates/:id/hide ─────────────────────────────────────────────
const hideAudit = "    await writeAuditLog(req.user!.id, 'MANDATE_REJECTED', 'mandate_review', req.params.id, reason);";

if (c.includes(hideAudit) && !c.includes('MANDATE hide notification')) {
  const notifBlock = `
    // Fire-and-forget mandate hide notification
    ;(async () => {
      try {
        const mandateOwnerId2 = (data as any).user_id as string;
        const mandateTitle2 = ((data as any).title || 'Your mandate') as string;
        const msg2 = 'Your mandate "' + mandateTitle2 + '" has been rejected/hidden.' + (reason ? ' Reason: ' + reason : '');
        const n2 = await createNotification({ userId: mandateOwnerId2, type: 'MANDATE_UPDATED', title: 'Mandate Rejected', message: msg2, relatedEntityId: req.params.id, relatedEntityType: 'mandate' });
        emitToUsers([mandateOwnerId2], 'notification:new', n2);
        console.log('[admin] mandate hide notification sent to', mandateOwnerId2);
      } catch (e) { console.error('[admin] mandate hide notification error:', e); }
    })();`;

  c = c.replace(hideAudit, hideAudit + notifBlock);
  console.log('[2] Added notification to PATCH /mandates/:id/hide');
} else if (c.includes('MANDATE hide notification')) {
  console.log('[2] Already present in /mandates/:id/hide');
} else {
  console.log('[2] ERROR: could not find anchor in /mandates/:id/hide');
}

// ─── 3. PATCH /mandates/:id/unhide ───────────────────────────────────────────
const unhideAudit = "    await writeAuditLog(req.user!.id, 'MANDATE_APPROVED', 'mandate_review', req.params.id);";

if (c.includes(unhideAudit) && !c.includes('MANDATE unhide notification')) {
  const notifBlock = `
    // Fire-and-forget mandate unhide/approve notification
    ;(async () => {
      try {
        const mandateOwnerId3 = existing.data.user_id as string;
        const mandateTitle3 = ((data as any).title || 'Your mandate') as string;
        const msg3 = 'Your mandate "' + mandateTitle3 + '" has been approved and is now live on the marketplace!';
        const n3 = await createNotification({ userId: mandateOwnerId3, type: 'MANDATE_UPDATED', title: 'Mandate Approved', message: msg3, relatedEntityId: req.params.id, relatedEntityType: 'mandate' });
        emitToUsers([mandateOwnerId3], 'notification:new', n3);
        console.log('[admin] mandate unhide notification sent to', mandateOwnerId3);
      } catch (e) { console.error('[admin] mandate unhide notification error:', e); }
    })();`;

  c = c.replace(unhideAudit, unhideAudit + notifBlock);
  console.log('[3] Added notification to PATCH /mandates/:id/unhide');
} else if (c.includes('MANDATE unhide notification')) {
  console.log('[3] Already present in /mandates/:id/unhide');
} else {
  console.log('[3] ERROR: could not find anchor in /mandates/:id/unhide');
}

fs.writeFileSync(file, c, 'utf8');
console.log('\nadmin.ts saved. Run: npm run build');
