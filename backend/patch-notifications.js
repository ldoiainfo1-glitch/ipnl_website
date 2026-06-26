/**
 * One-shot script to patch mandates.ts and admin.ts with notification code.
 * Run: node patch-notifications.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src', 'routes');

// ─── mandates.ts ───────────────────────────────────────────────────────────

(function patchMandates() {
  const file = path.join(SRC, 'mandates.ts');
  let c = fs.readFileSync(file, 'utf8');

  // 1. Add imports (idempotent)
  if (!c.includes("import { createNotification }")) {
    c = c.replace(
      "import { toUserDTO } from '../models/profile';",
      "import { toUserDTO } from '../models/profile';\nimport { createNotification } from '../lib/notificationsStore';\nimport { emitToUsers } from '../lib/realtime';"
    );
    console.log('[mandates] imports added');
  } else {
    console.log('[mandates] imports already present');
  }

  // 2. Add getAdminUserIds helper (idempotent)
  if (!c.includes('getAdminUserIds')) {
    c = c.replace(
      'const router = express.Router();',
      `const router = express.Router();

async function getAdminUserIds(supabase) {
  const { data } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
  return (data ?? []).map((p) => p.id);
}`
    );
    console.log('[mandates] getAdminUserIds helper added');
  } else {
    console.log('[mandates] getAdminUserIds already present');
  }

  // 3. Add notification code before final 201 return in POST route (idempotent)
  const marker = '    return res.status(201).json(attachMandateReviewMetadata(toMandateDTO(data), reviewRow));';
  if (c.includes(marker) && !c.includes('MANDATE_POSTED')) {
    const notifBlock = `    const mandateDTO = attachMandateReviewMetadata(toMandateDTO(data), reviewRow);

    // Fire-and-forget notifications
    const _posterId = req.user.id;
    const _mandateTitle = data.title;
    const _mandateId = data.id;
    ;(async () => {
      try {
        const posterNotif = await createNotification({
          userId: _posterId,
          type: 'MANDATE_POSTED',
          title: 'Mandate Submitted for Review',
          message: 'Your mandate "' + _mandateTitle + '" has been submitted and is pending admin approval.',
          relatedEntityId: _mandateId,
          relatedEntityType: 'mandate',
        });
        emitToUsers([_posterId], 'notification:new', posterNotif);

        const { data: posterProfile } = await supabase.from('profiles').select('company_name').eq('id', _posterId).maybeSingle();
        const companyName = posterProfile && posterProfile.company_name ? posterProfile.company_name : 'A member';
        const adminIds = await getAdminUserIds(supabase);
        console.log('[mandates] admin IDs found:', adminIds);
        for (const adminId of adminIds) {
          const adminNotif = await createNotification({
            userId: adminId,
            type: 'MANDATE_POSTED',
            title: 'New Mandate Pending Review',
            message: companyName + ' has posted a new mandate: "' + _mandateTitle + '". Review it in the admin panel.',
            relatedEntityId: _mandateId,
            relatedEntityType: 'mandate',
          });
          emitToUsers([adminId], 'notification:new', adminNotif);
          console.log('[mandates] admin notif created for', adminId);
        }
      } catch (notifErr) {
        console.error('[mandates] notification error (non-fatal):', notifErr && notifErr.message);
      }
    })();

    return res.status(201).json(mandateDTO);`;

    c = c.replace(marker, notifBlock);
    console.log('[mandates] POST notification block added');
  } else if (!c.includes(marker)) {
    console.log('[mandates] WARNING: could not find POST 201 return marker');
  } else {
    console.log('[mandates] POST notification already present');
  }

  fs.writeFileSync(file, c, 'utf8');
  console.log('[mandates] file saved');
})();

// ─── admin.ts ───────────────────────────────────────────────────────────────

(function patchAdmin() {
  const file = path.join(SRC, 'admin.ts');
  let c = fs.readFileSync(file, 'utf8');

  // 1. Add imports (idempotent)
  if (!c.includes("import { createNotification }")) {
    const importAnchor = "import type { Database } from '../types/database';";
    if (c.includes(importAnchor)) {
      c = c.replace(
        importAnchor,
        importAnchor + "\nimport { createNotification } from '../lib/notificationsStore';\nimport { emitToUsers } from '../lib/realtime';"
      );
      console.log('[admin] imports added');
    } else {
      console.log('[admin] WARNING: could not find import anchor');
    }
  } else {
    console.log('[admin] imports already present');
  }

  // 2. Add notification code before final return in PATCH /kyc/update (idempotent)
  const marker = "    return res.json(await rowToKycDoc(data, profile));\n  } catch (err: any) { return serverError(res, err.message); }\n});";
  const markerCRLF = "    return res.json(await rowToKycDoc(data, profile));\r\n  } catch (err: any) { return serverError(res, err.message); }\r\n});";

  const actualMarker = c.includes(markerCRLF) ? markerCRLF : (c.includes(marker) ? marker : null);
  const eol = c.includes('\r\n') ? '\r\n' : '\n';

  if (actualMarker && !c.includes('KYC_APPROVED')) {
    const notifBlock = [
      '',
      '    // Fire-and-forget KYC status notification',
      '    const _notifiedUserId = body.userId;',
      '    const _kycStatus = body.status;',
      '    ;(async () => {',
      '      try {',
      "        let n;",
      "        if (_kycStatus === 'APPROVED') {",
      "          n = await createNotification({ userId: _notifiedUserId, type: 'KYC_APPROVED', title: 'KYC Approved', message: 'Congratulations! Your KYC has been approved. Your account is now Verified.', relatedEntityType: 'kyc' });",
      "        } else if (_kycStatus === 'REJECTED') {",
      "          n = await createNotification({ userId: _notifiedUserId, type: 'KYC_REJECTED', title: 'KYC Rejected', message: 'Your KYC was rejected. Reason: ' + (body.rejectionReason || '') + '. Please resubmit.', relatedEntityType: 'kyc' });",
      "        } else if (_kycStatus === 'UNDER_REVIEW') {",
      "          n = await createNotification({ userId: _notifiedUserId, type: 'KYC_SUBMITTED', title: 'KYC Under Review', message: 'Your KYC is under review. Note: ' + (body.reviewNote || ''), relatedEntityType: 'kyc' });",
      "        }",
      "        if (n) emitToUsers([_notifiedUserId], 'notification:new', n);",
      "        console.log('[admin] KYC notification sent to', _notifiedUserId, 'status:', _kycStatus);",
      "      } catch (e) { console.error('[admin] KYC notification error:', e && e.message); }",
      "    })();",
      '',
      '    return res.json(await rowToKycDoc(data, profile));',
      "  } catch (err) { return serverError(res, err.message); }",
      "});",
    ].join(eol);

    c = c.replace(actualMarker, notifBlock);
    console.log('[admin] KYC notification block added');
  } else if (!actualMarker) {
    console.log('[admin] WARNING: could not find KYC update return marker; trying looser match');
    // Dump context around rowToKycDoc
    const idx = c.lastIndexOf('return res.json(await rowToKycDoc');
    console.log('[admin] last rowToKycDoc at index', idx, '— context:', JSON.stringify(c.substring(idx, idx + 120)));
  } else {
    console.log('[admin] KYC notification already present');
  }

  fs.writeFileSync(file, c, 'utf8');
  console.log('[admin] file saved');
})();

console.log('\nDone. Run: npm run build');
