import { useState, useRef, useEffect } from 'react';
import { useKyc } from '@/hooks/useKyc';
import { useAuthStore } from '@/store/authStore';
import { KycStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  FileText,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_KYC_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

type KycFileField = 'panCard' | 'gstCertificate' | 'reraCertificate' | 'incorporationCertificate' | 'addressProof';

const KYC_DOCUMENTS: Array<{ field: KycFileField; label: string; required?: boolean }> = [
  { field: 'panCard', label: 'PAN Card', required: true },
  { field: 'incorporationCertificate', label: 'Incorporation / Registration Certificate', required: true },
  { field: 'gstCertificate', label: 'GST Certificate' },
  { field: 'reraCertificate', label: 'RERA Certificate' },
  { field: 'addressProof', label: 'Address Proof' },
];

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp)(\?|$)/i.test(url);
}

const WORKFLOW_STEPS = [
  { label: 'Submitted', status: KycStatus.SUBMITTED },
  { label: 'Under Review', status: KycStatus.UNDER_REVIEW },
  { label: 'Approved', status: KycStatus.APPROVED },
];

function WorkflowTracker({ currentStatus }: { currentStatus: KycStatus }) {
  const activeIndex = WORKFLOW_STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className="flex items-center gap-2">
      {WORKFLOW_STEPS.map((step, idx) => {
        const isDone = idx < activeIndex || currentStatus === KycStatus.APPROVED;
        const isActive = idx === activeIndex && currentStatus !== KycStatus.APPROVED;
        return (
          <div key={step.status} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isDone
                    ? 'border-green-500 bg-green-500 text-white'
                    : isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{step.label}</span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mb-4 ${
                  idx < activeIndex ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface FileInputProps {
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
}

function FileInput({ label, hint, file, onChange, error, required }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file]);

  return (
    <div className="space-y-1">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div
        className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
          error
            ? 'border-destructive'
            : isDragActive
            ? 'border-primary'
            : 'border-border hover:border-primary'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          onChange(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              <span className="truncate">{file.name}</span>
              <span className="text-muted-foreground text-xs ml-auto">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            {previewUrl && (
              <img
                src={previewUrl}
                alt={`${label} preview`}
                className="h-24 w-auto rounded-md border border-border object-contain"
              />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Replace
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md border border-border hover:border-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="w-5 h-5" />
            <span className="text-sm">Click to upload</span>
            <span className="text-xs">PDF, JPG, PNG, WEBP</span>
            <span className="text-[11px]">or drag and drop</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function KycVerification() {
  const { user } = useAuthStore();
  const {
    kycStatus,
    isLoading,
    submitKyc,
    resubmitKyc,
    deleteKycDocument,
    isSubmitting,
    isDeletingDocument,
    kycUploadProgress,
  } = useKyc();

  const [files, setFiles] = useState({
    panCard: null as File | null,
    gstCertificate: null as File | null,
    reraCertificate: null as File | null,
    incorporationCertificate: null as File | null,
    addressProof: null as File | null,
  });

  const [fileErrors, setFileErrors] = useState<Partial<Record<KycFileField, string>>>({});

  const validateSelectedFile = (file: File | null): string | null => {
    if (!file) return null;
    if (!ALLOWED_KYC_MIME_TYPES.includes(file.type)) {
      return 'Only PDF, PNG, JPG/JPEG, and WEBP files are allowed.';
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return 'File size must be 5 MB or smaller.';
    }
    return null;
  };

  const setFileForField = (field: KycFileField, file: File | null) => {
    const error = validateSelectedFile(file);
    setFileErrors((prev) => ({ ...prev, [field]: error ?? undefined }));
    setFiles((prev) => ({ ...prev, [field]: error ? null : file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(fileErrors).some(Boolean)) {
      alert('Please fix file validation errors before submitting.');
      return;
    }
    const hasPanCard = Boolean(files.panCard || kycStatus?.panCard);
    const hasIncorporationCertificate = Boolean(files.incorporationCertificate || kycStatus?.incorporationCertificate);
    if (!hasPanCard || !hasIncorporationCertificate) {
      alert('PAN Card and Incorporation Certificate are required.');
      return;
    }
    try {
      const payload = {
        panCard: files.panCard ?? undefined,
        gstCertificate: files.gstCertificate ?? undefined,
        reraCertificate: files.reraCertificate ?? undefined,
        incorporationCertificate: files.incorporationCertificate ?? undefined,
        addressProof: files.addressProof ?? undefined,
      };
      const isResubmit = Boolean(kycStatus?.id);
      if (isResubmit) {
        await resubmitKyc(payload);
      } else {
        await submitKyc(payload);
      }
      alert('KYC documents submitted successfully. Our team will review within 2-3 business days.');
    } catch {
      alert('Submission failed. Please try again.');
    }
  };

  const handleDeleteDocument = async (field: KycFileField, label: string) => {
    if (kycStatus?.status === KycStatus.APPROVED) {
      alert('Approved KYC documents cannot be deleted. Contact support for changes.');
      return;
    }
    const confirmed = window.confirm(`Delete uploaded ${label}? You can upload a corrected document after deleting it.`);
    if (!confirmed) return;
    try {
      await deleteKycDocument(field);
    } catch {
      alert('Unable to delete this document. Please try again.');
    }
  };

  const statusBadgeVariant = (status: KycStatus) => {
    switch (status) {
      case KycStatus.APPROVED:
        return 'success';
      case KycStatus.UNDER_REVIEW:
      case KycStatus.SUBMITTED:
        return 'warning';
      case KycStatus.REJECTED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const canSubmit =
    !kycStatus ||
    kycStatus.status === KycStatus.NOT_SUBMITTED ||
    kycStatus.status === KycStatus.SUBMITTED ||
    kycStatus.status === KycStatus.UNDER_REVIEW ||
    kycStatus.status === KycStatus.REJECTED;

  const uploadedDocuments = KYC_DOCUMENTS
    .map((doc) => ({ ...doc, url: kycStatus?.[doc.field] as string | undefined }))
    .filter((doc) => Boolean(doc.url));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading KYC status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your KYC to get a Verified Badge and unlock full platform access
        </p>
      </div>

      {/* Verified Badge Banner */}
      {kycStatus?.status === KycStatus.APPROVED && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center gap-4 py-6">
            <ShieldCheck className="w-12 h-12 text-green-500 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-300">
                Verified Member
              </h2>
              <p className="text-green-600 dark:text-green-400 text-sm">
                Your KYC has been approved. You now have full access to the IPN network.
              </p>
              {kycStatus.reviewedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Approved on {formatDate(kycStatus.reviewedAt)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Notice */}
      {kycStatus?.status === KycStatus.REJECTED && (
        <Card className="border-destructive">
          <CardContent className="flex items-start gap-4 py-6">
            <XCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">KYC Rejected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {kycStatus.rejectionReason || 'Your KYC submission was rejected. Please re-upload corrected documents.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Workflow */}
      {kycStatus && kycStatus.status !== KycStatus.NOT_SUBMITTED && kycStatus.status !== KycStatus.REJECTED && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Verification Status</CardTitle>
              <Badge variant={statusBadgeVariant(kycStatus.status) as any}>
                {kycStatus.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <WorkflowTracker currentStatus={kycStatus.status} />
            {kycStatus.status === KycStatus.SUBMITTED && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Documents submitted on {kycStatus.createdAt ? formatDate(kycStatus.createdAt) : '—'}. Pending review.</span>
              </div>
            )}
            {kycStatus.status === KycStatus.UNDER_REVIEW && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>Our compliance team is reviewing your documents. This typically takes 2–3 business days.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Uploaded Documents</CardTitle>
            <CardDescription>
              Review the files you submitted. Before approval, you can delete a wrong file and upload the corrected one below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.field} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {doc.label} {doc.required && <span className="text-destructive">*</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                        {doc.url}
                      </p>
                    </div>
                    <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  </div>

                  {doc.url && isImageUrl(doc.url) ? (
                    <a href={doc.url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={doc.url}
                        alt={`${doc.label} preview`}
                        className="h-28 w-full rounded-md border border-border object-contain bg-muted"
                      />
                    </a>
                  ) : (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-28 items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground hover:text-foreground"
                    >
                      Open PDF / document
                    </a>
                  )}

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                    {kycStatus?.status !== KycStatus.APPROVED && (
                      <button
                        type="button"
                        disabled={isDeletingDocument}
                        onClick={() => handleDeleteDocument(doc.field, doc.label)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:border-destructive disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Form */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>
              {kycStatus?.status === KycStatus.REJECTED
                ? 'Resubmit KYC Documents'
                : uploadedDocuments.length > 0
                ? 'Replace or Add Documents'
                : 'Submit KYC Documents'}
            </CardTitle>
            <CardDescription>
              Upload clear, legible copies of all required documents. Accepted formats: PDF, JPG, PNG, WEBP (max 5 MB each).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <FileInput
                label="PAN Card"
                hint="Required — Individual or company PAN card"
                file={files.panCard}
                onChange={(f) => setFileForField('panCard', f)}
                error={fileErrors.panCard}
                required
              />

              <FileInput
                label="Incorporation / Registration Certificate"
                hint="Required — Company incorporation or firm registration certificate"
                file={files.incorporationCertificate}
                onChange={(f) => setFileForField('incorporationCertificate', f)}
                error={fileErrors.incorporationCertificate}
                required
              />

              <FileInput
                label="GST Certificate"
                hint="Optional — GST registration certificate"
                file={files.gstCertificate}
                onChange={(f) => setFileForField('gstCertificate', f)}
                error={fileErrors.gstCertificate}
              />

              {(user?.reraNumber || user?.role === 'DEVELOPER' || user?.role === 'BROKER') && (
                <FileInput
                  label="RERA Certificate"
                  hint="Optional — RERA registration certificate (required for Developers & Brokers)"
                  file={files.reraCertificate}
                  onChange={(f) => setFileForField('reraCertificate', f)}
                  error={fileErrors.reraCertificate}
                />
              )}

              <FileInput
                label="Address Proof"
                hint="Optional — Utility bill, bank statement, or official letter (not older than 3 months)"
                file={files.addressProof}
                onChange={(f) => setFileForField('addressProof', f)}
                error={fileErrors.addressProof}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? `Uploading... ${kycUploadProgress ?? 0}%`
                  : kycStatus?.status === KycStatus.REJECTED
                  ? 'Resubmit Documents'
                  : uploadedDocuments.length > 0
                  ? 'Save Document Changes'
                  : 'Submit for Verification'}
              </Button>

              {(isSubmitting || kycUploadProgress !== null) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Upload progress</span>
                    <span>{kycUploadProgress ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${kycUploadProgress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What happens after submission?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>Our compliance team receives your documents and starts the review process.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>PAN, GST, and RERA numbers are cross-verified against government databases.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>Upon approval, your profile receives a <strong>Verified Badge</strong> and your account is fully activated.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <span>You will be notified via email and in-app notification of the decision.</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
