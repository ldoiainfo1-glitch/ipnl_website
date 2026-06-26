const fs = require('fs');
const f = 'D:/shalinii/ipnl_website/backend/src/routes/admin.ts';
let c = fs.readFileSync(f, 'utf8');

// Normalize to LF for matching
const normalized = c.replace(/\r\n/g, '\n');

const old = `    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    return res.json((data ?? []).map((row) => {
      const mandate = toMandateDTO(row);
      const review = reviewMap.get(mandate.id);
      const owner = profileMap.get(row.user_id);
      const ownerKycStatus = kycStatusMap.get(row.user_id) ?? owner?.kyc_status ?? 'NOT_SUBMITTED';
      return {
        ...mandate,
        user: owner ? toUserDTO(owner, { kycStatus: ownerKycStatus as any }) : undefined,
        ownerKycStatus,
        moderationStatus: review?.status ?? 'PENDING',
        moderationNote: review?.note,
        moderationReviewedBy: review?.reviewedBy,
        moderationReviewedAt: review?.reviewedAt,
      };
    }));`;

const neu = `    const profileById = new Map(
      await Promise.all((profiles ?? []).map(async (profile) => {
        const user = await toUserDTO(profile, { kycStatus: kycStatusMap.get(profile.id) as any });
        return [profile.id, user] as const;
      }))
    );

    return res.json((data ?? []).map((row) => {
      const mandate = toMandateDTO(row);
      const review = reviewMap.get(mandate.id);
      const user = profileById.get(row.user_id);
      return {
        ...mandate,
        user,
        ownerKycStatus: kycStatusMap.get(row.user_id) ?? 'NOT_SUBMITTED',
        moderationStatus: review?.status ?? 'PENDING',
        moderationNote: review?.note,
        moderationReviewedBy: review?.reviewedBy,
        moderationReviewedAt: review?.reviewedAt,
      };
    }));`;

if (normalized.includes(old)) {
  const fixed = normalized.replace(old, neu);
  // Restore original line endings
  const usesCRLF = c.includes('\r\n');
  fs.writeFileSync(f, usesCRLF ? fixed.replace(/\n/g, '\r\n') : fixed);
  console.log('SUCCESS - fixed the bug');
} else {
  console.log('NOT FOUND - searching for partial match...');
  const idx = normalized.indexOf('const profileMap = new Map');
  console.log('profileMap at index:', idx);
  if (idx >= 0) console.log('Context:', normalized.substring(idx - 10, idx + 300));
}
