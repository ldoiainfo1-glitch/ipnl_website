/**
 * Fix admin.ts: remove misplaced notification from GET route, add to PATCH /kyc/update
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'routes', 'admin.ts');
let a = fs.readFileSync(file, 'utf8');

// Step 1: Remove the misplaced notification block from GET /kyc/:userId
// It starts with "    // Fire-and-forget KYC status notification" and ends with "    })();"
const wrongStart = '\n    // Fire-and-forget KYC status notification\n    const _notifiedUserId = body.userId;';
const wrongEnd = '    })();\n\n    return res.json(await rowToKycDoc(data, profile));\n  } catch (err) { return serverError(res, err.message); }\n});';
const cleanEnd = '\n    return res.json(await rowToKycDoc(data, profile));\n  } catch (err: any) { return serverError(res, err.message); }\n});';

// Find the GET /kyc/:userId handler and clean it
const getRouteCtx = "router.get('/kyc/:userId', verifySupabase";
const idxGet = a.indexOf(getRouteCtx);
if (idxGet === -1) {
  console.log('ERROR: could not find GET /kyc/:userId route');
  process.exit(1);
}

// Find the end of this specific handler (the });  before the next router.)
const notifStartInGet = a.indexOf(wrongStart, idxGet);
if (notifStartInGet !== -1) {
  // Find the closing of this block
  const notifEndPos = a.indexOf('    })();\n\n    return res.json(await rowToKycDoc(data, profile));', notifStartInGet);
  if (notifEndPos !== -1) {
    const fullWrong = a.substring(notifStartInGet, notifEndPos + '    })();'.length);
    a = a.replace(fullWrong, '');
    console.log('Removed misplaced notification block from GET route');
  } else {
    // Try with CRLF
    const notifEndPosCRLF = a.indexOf('    })();\r\n\r\n    return res.json(await rowToKycDoc(data, profile));', notifStartInGet);
    if (notifEndPosCRLF !== -1) {
      const fullWrong = a.substring(notifStartInGet, notifEndPosCRLF + '    })();'.length);
      a = a.replace(fullWrong, '');
      console.log('Removed misplaced notification block from GET route (CRLF)');
    } else {
      console.log('ERROR: could not find end of misplaced block');
      const ctx = a.substring(notifStartInGet, notifStartInGet + 800);
      console.log('Context:', ctx);
      process.exit(1);
    }
  }
} else {
  console.log('Misplaced block not found (may already be removed)');
}

// Step 2: Add notification in PATCH /kyc/update BEFORE its final return
const patchRouteCtx = "router.patch('/kyc/update'";
const idxPatch = a.indexOf(patchRouteCtx);
if (idxPatch === -1) {
  console.log('ERROR: could not find PATCH /kyc/update route');
  process.exit(1);
}
console.log('Found PATCH /kyc/update at index', idxPatch);

// Check if notification already added there
if (a.indexOf('KYC_APPROVED', idxPatch) !== -1 && a.indexOf('KYC_APPROVED', idxPatch) < idxPatch + 3000) {
  console.log('Notification already present in PATCH /kyc/update');
} else {
  // Find the final return in this handler
  const returnInPatch = a.indexOf("    return res.json(await rowToKycDoc(data, profile));", idxPatch);
  if (returnInPatch === -1) {
    console.log('ERROR: could not find return in PATCH /kyc/update');
    process.exit(1);
  }

  const notifCode = `
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

  a = a.substring(0, returnInPatch) + notifCode + a.substring(returnInPatch);
  console.log('Inserted notification in PATCH /kyc/update');
}

fs.writeFileSync(file, a, 'utf8');
console.log('admin.ts saved');
