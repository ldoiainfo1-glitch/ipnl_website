/**
 * Final clean fix for admin.ts:
 * 1. Remove misplaced notification block (lines with body.userId in GET route)
 * 2. Fix type errors in PATCH /kyc/update notification block
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'routes', 'admin.ts');
let a = fs.readFileSync(file, 'utf8');

// ─── Step 1: Remove misplaced block ─────────────────────────────────────────
// The misplaced block appears in GET /kyc/:userId and uses _notifiedUserId / _kycStatus
// Remove everything between "    // Fire-and-forget KYC status notification" 
// and "    })();" (inclusive) that appears before the PATCH /kyc/update route

const patchIdx = a.indexOf("router.patch('/kyc/update'");

// Find the wrongly placed IIFE in the GET route (before patch route)
const wrongBlockStart = a.indexOf('    // Fire-and-forget KYC status notification');
if (wrongBlockStart !== -1 && wrongBlockStart < patchIdx) {
  const wrongBlockEnd = a.indexOf('    })();', wrongBlockStart) + '    })();'.length;
  // Also remove the blank line after it
  let endPos = wrongBlockEnd;
  if (a[endPos] === '\n') endPos++;
  if (a[endPos] === '\r' && a[endPos+1] === '\n') endPos += 2;
  a = a.substring(0, wrongBlockStart) + a.substring(endPos);
  console.log('Removed misplaced notification block from GET route');
} else {
  console.log('Misplaced block not found or already removed (wrongBlockStart:', wrongBlockStart, 'patchIdx:', patchIdx, ')');
}

// ─── Step 2: Fix type errors in PATCH /kyc/update notification block ─────────
// Replace the notification block in PATCH with a type-safe version
// Find the block by unique marker
const oldNotif = `
    // Fire-and-forget KYC status notification
    ;(async () => {
      try {
        const notifUserId = body.userId;
        const notifStatus = body.status;
        let n;
        if (notifStatus === 'APPROVED') {
          n = await createNotification({ userId: notifUserId, type: 'KYC_APPROVED', title: 'KYC Approved', message: 'Congratulations! Your KYC has been approved. Your account is now Verified.', relatedEntityType: 'kyc' });
        } else if (notifStatus === 'REJECTED') {
          n = await createNotification({ userId: notifUserId, type: 'KYC_REJECTED', title: 'KYC Rejected', message: 'Your KYC was rejected. Reason: ' + (body.rejectionReason || '') + '. Please resubmit.', relatedEntityType: 'kyc' });
        } else if (notifStatus === 'UNDER_REVIEW') {
          n = await createNotification({ userId: notifUserId, type: 'KYC_SUBMITTED', title: 'KYC Under Review', message: 'Your KYC is under review. Note: ' + (body.reviewNote || ''), relatedEntityType: 'kyc' });
        }
        if (n) emitToUsers([notifUserId], 'notification:new', n);
        console.log('[admin] KYC notification sent to', notifUserId, 'status:', notifStatus);
      } catch (e) { console.error('[admin] KYC notif error:', e); }
    })();

    `;

const newNotif = `
    // Fire-and-forget KYC status notification
    if (body.userId) {
      const notifUserId: string = body.userId;
      const notifStatus = body.status;
      ;(async () => {
        try {
          let n;
          if (notifStatus === 'APPROVED') {
            n = await createNotification({ userId: notifUserId, type: 'KYC_APPROVED', title: 'KYC Approved', message: 'Congratulations! Your KYC has been approved. Your account is now Verified.', relatedEntityType: 'kyc' });
          } else if (notifStatus === 'REJECTED') {
            n = await createNotification({ userId: notifUserId, type: 'KYC_REJECTED', title: 'KYC Rejected', message: 'Your KYC was rejected. Reason: ' + (body.rejectionReason || '') + '. Please resubmit.', relatedEntityType: 'kyc' });
          } else if (notifStatus === 'UNDER_REVIEW') {
            n = await createNotification({ userId: notifUserId, type: 'KYC_SUBMITTED', title: 'KYC Under Review', message: 'Your KYC is under review. Note: ' + (body.reviewNote || ''), relatedEntityType: 'kyc' });
          }
          if (n) emitToUsers([notifUserId], 'notification:new', n);
          console.log('[admin] KYC notification sent to', notifUserId, 'status:', notifStatus);
        } catch (e) { console.error('[admin] KYC notif error:', e); }
      })();
    }

    `;

if (a.includes(oldNotif)) {
  a = a.replace(oldNotif, newNotif);
  console.log('Fixed type-safe notification block in PATCH /kyc/update');
} else {
  console.log('WARNING: could not find old notif block for replacement');
  // Show what we have around the PATCH handler
  const pi = a.indexOf("router.patch('/kyc/update'");
  console.log('PATCH handler excerpt:', a.substring(pi + 800, pi + 1500));
}

fs.writeFileSync(file, a, 'utf8');
console.log('admin.ts saved');
