import express from 'express';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, serverError, unauthorized } from '../utils/apiError';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { createUploadPath, getStorageInfo, uploadObject } from '../lib/objectStorage';
import { upload, uploadErrorHandler } from '../middleware/upload';

function rowToKycDoc(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    panCard: row.pan_card ?? undefined,
    gstCertificate: row.gst_certificate ?? undefined,
    reraCertificate: row.rera_certificate ?? undefined,
    incorporationCertificate: row.incorporation_certificate ?? undefined,
    addressProof: row.address_proof ?? undefined,
    status: row.status,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    reviewNote: row.review_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const router = express.Router();

const KYC_DOCUMENT_COLUMNS = {
  panCard: 'pan_card',
  gstCertificate: 'gst_certificate',
  reraCertificate: 'rera_certificate',
  incorporationCertificate: 'incorporation_certificate',
  addressProof: 'address_proof',
} as const;

type KycDocumentField = keyof typeof KYC_DOCUMENT_COLUMNS;

router.get('/me', verifySupabase, async (req, res) => {
  try {
    if (!req.user) return unauthorized(res);
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data } = await supabase
      .from('kyc_reviews').select('*').eq('user_id', req.user.id).maybeSingle();

    if (!data) return res.json({ userId: req.user.id, status: 'NOT_SUBMITTED' });
    return res.json(rowToKycDoc(data));
  } catch (err: any) { return serverError(res, err.message); }
});

router.post(
  '/submit',
  verifySupabase,
  upload.fields([
    { name: 'panCard', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'reraCertificate', maxCount: 1 },
    { name: 'incorporationCertificate', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
  ]),
  uploadErrorHandler,
  async (req: express.Request, res: express.Response) => {
    if (!req.user) return unauthorized(res);

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const panCardFile = files?.panCard?.[0];
    const incorporationCertificateFile = files?.incorporationCertificate?.[0];

    if (!panCardFile || !incorporationCertificateFile) {
      return badRequest(res, 'panCard and incorporationCertificate are required');
    }

    const now = new Date().toISOString();

    const uploadIfPresent = async (file: Express.Multer.File | undefined, namespace: string) => {
      if (!file) return undefined;
      const ext = file.mimetype === 'application/pdf' ? 'pdf' : file.mimetype.split('/')[1] || 'bin';
      const path = createUploadPath(namespace, req.user!.id, ext);
      const uploaded = await uploadObject({
        path,
        body: file.buffer,
        contentType: file.mimetype,
      });
      return uploaded.url;
    };

    const panCardUrl = await uploadIfPresent(panCardFile, 'kyc/pan-card');
    const incorporationCertificateUrl = await uploadIfPresent(
      incorporationCertificateFile,
      'kyc/incorporation-certificate',
    );
    const gstCertificateUrl = await uploadIfPresent(files?.gstCertificate?.[0], 'kyc/gst-certificate');
    const reraCertificateUrl = await uploadIfPresent(files?.reraCertificate?.[0], 'kyc/rera-certificate');
    const addressProofUrl = await uploadIfPresent(files?.addressProof?.[0], 'kyc/address-proof');

    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data: record, error: dbErr } = await supabase
      .from('kyc_reviews')
      .upsert(
        {
          user_id: req.user.id,
          status: 'SUBMITTED',
          pan_card: panCardUrl ?? null,
          incorporation_certificate: incorporationCertificateUrl ?? null,
          gst_certificate: gstCertificateUrl ?? null,
          rera_certificate: reraCertificateUrl ?? null,
          address_proof: addressProofUrl ?? null,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .single();
    if (dbErr || !record) return serverError(res, dbErr?.message ?? 'Failed to save KYC');

    return res.status(201).json({ ...rowToKycDoc(record), storage: getStorageInfo() });
  },
);

router.patch(
  '/resubmit',
  verifySupabase,
  upload.fields([
    { name: 'panCard', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'reraCertificate', maxCount: 1 },
    { name: 'incorporationCertificate', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
  ]),
  uploadErrorHandler,
  async (req: express.Request, res: express.Response) => {
    if (!req.user) return unauthorized(res);

    const supabase2 = getSupabaseAdmin();
    if (!supabase2) return serverError(res, 'Supabase not configured');

    const now = new Date().toISOString();
    const { data: existing } = await supabase2
      .from('kyc_reviews').select('*').eq('user_id', req.user.id).maybeSingle();
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const uploadIfPresent = async (file: Express.Multer.File | undefined, namespace: string) => {
      if (!file) return undefined;
      const ext = file.mimetype === 'application/pdf' ? 'pdf' : file.mimetype.split('/')[1] || 'bin';
      const path = createUploadPath(namespace, req.user!.id, ext);
      const uploaded = await uploadObject({
        path,
        body: file.buffer,
        contentType: file.mimetype,
      });
      return uploaded.url;
    };

    const panCardUrl = (await uploadIfPresent(files?.panCard?.[0], 'kyc/pan-card')) ?? (existing as any)?.pan_card;
    const incorporationCertificateUrl =
      (await uploadIfPresent(files?.incorporationCertificate?.[0], 'kyc/incorporation-certificate')) ??
      (existing as any)?.incorporation_certificate;
    const gstCertificateUrl =
      (await uploadIfPresent(files?.gstCertificate?.[0], 'kyc/gst-certificate')) ?? (existing as any)?.gst_certificate;
    const reraCertificateUrl =
      (await uploadIfPresent(files?.reraCertificate?.[0], 'kyc/rera-certificate')) ?? (existing as any)?.rera_certificate;
    const addressProofUrl =
      (await uploadIfPresent(files?.addressProof?.[0], 'kyc/address-proof')) ?? (existing as any)?.address_proof;

    if (!panCardUrl || !incorporationCertificateUrl) {
      return badRequest(res, 'panCard and incorporationCertificate are required');
    }

    const { data: record2, error: dbErr2 } = await supabase2
      .from('kyc_reviews')
      .upsert(
        {
          user_id: req.user.id,
          status: 'SUBMITTED',
          pan_card: panCardUrl ?? null,
          incorporation_certificate: incorporationCertificateUrl ?? null,
          gst_certificate: gstCertificateUrl ?? null,
          rera_certificate: reraCertificateUrl ?? null,
          address_proof: addressProofUrl ?? null,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .single();
    if (dbErr2 || !record2) return serverError(res, dbErr2?.message ?? 'Failed to save KYC');

    return res.json({ ...rowToKycDoc(record2), storage: getStorageInfo() });
  },
);

router.delete('/documents/:field', verifySupabase, async (req, res) => {
  try {
    if (!req.user) return unauthorized(res);
    const field = req.params.field as KycDocumentField;
    const column = KYC_DOCUMENT_COLUMNS[field];
    if (!column) return badRequest(res, 'Invalid KYC document field');

    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data: existing, error: existingError } = await supabase
      .from('kyc_reviews')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (existingError) return badRequest(res, existingError.message);
    if (!existing) return badRequest(res, 'No KYC documents found');
    if (existing.status === 'APPROVED') {
      return badRequest(res, 'Approved KYC documents cannot be deleted. Contact support for changes.');
    }

    const nextRequiredDocsPresent = {
      pan_card: field === 'panCard' ? null : existing.pan_card,
      incorporation_certificate:
        field === 'incorporationCertificate' ? null : existing.incorporation_certificate,
    };
    const nextStatus =
      nextRequiredDocsPresent.pan_card && nextRequiredDocsPresent.incorporation_certificate
        ? existing.status
        : 'NOT_SUBMITTED';

    const { data, error } = await supabase
      .from('kyc_reviews')
      .update({
        [column]: null,
        status: nextStatus,
        review_note: null,
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', req.user.id)
      .select('*')
      .single();
    if (error || !data) return serverError(res, error?.message ?? 'Failed to delete KYC document');

    return res.json(rowToKycDoc(data));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;
