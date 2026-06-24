import { useState, useRef, useEffect } from 'react';
import { useMyProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { PropertyType, KycStatus, UserStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ASSET_CLASSES, INDIAN_CITIES, INDIAN_STATES } from '@/utils/constants';
import { formatIndianNumber } from '@/utils/formatters';
import { ShieldCheck, Upload, Globe, Linkedin, Building2, Star, AlertCircle } from 'lucide-react';
import { ImageCropModal } from '@/components/ImageCropModal';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function AssetPreferenceSelector({
  selected,
  onChange,
}: {
  selected: PropertyType[];
  onChange: (v: PropertyType[]) => void;
}) {
  const toggle = (cls: PropertyType) => {
    if (selected.includes(cls)) {
      onChange(selected.filter((c) => c !== cls));
    } else {
      onChange([...selected, cls]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ASSET_CLASSES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => toggle(value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(value)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuthStore();
  const {
    profile,
    isLoading,
    updateProfile,
    isUpdating,
    updateLogo,
    isUploadingLogo,
    logoUploadProgress,
  } = useMyProfile();

  const effectiveUser = profile ?? user;

  const [form, setForm] = useState({
    companyName: '',
    mobile: '',
    companyDescription: '',
    website: '',
    linkedin: '',
    city: '',
    state: '',
    assetPreferences: [] as PropertyType[],
    ticketSizeMin: '',
    ticketSizeMax: '',
  });

  const [saved, setSaved] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isLogoDragActive, setIsLogoDragActive] = useState(false);
  const [cropModalImage, setCropModalImage] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (effectiveUser) {
      setForm({
        companyName: effectiveUser.companyName ?? '',
        mobile: effectiveUser.mobile ?? '',
        companyDescription: effectiveUser.companyDescription ?? '',
        website: effectiveUser.website ?? '',
        linkedin: effectiveUser.linkedin ?? '',
        city: effectiveUser.city ?? '',
        state: effectiveUser.state ?? '',
        assetPreferences: effectiveUser.assetPreferences ?? [],
        ticketSizeMin: effectiveUser.ticketSizeMin?.toString() ?? '',
        ticketSizeMax: effectiveUser.ticketSizeMax?.toString() ?? '',
      });
    }
  }, [effectiveUser]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      companyName: form.companyName,
      mobile: form.mobile,
      companyDescription: form.companyDescription || undefined,
      website: form.website || undefined,
      linkedin: form.linkedin || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      assetPreferences: form.assetPreferences,
      ticketSizeMin: form.ticketSizeMin ? Number(form.ticketSizeMin) : undefined,
      ticketSizeMax: form.ticketSizeMax ? Number(form.ticketSizeMax) : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const processLogoFile = async (file: File | null) => {
    if (!file) return;
    setLogoUploadError(null);

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoUploadError('Only PNG, JPG/JPEG, and WEBP files are allowed.');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setLogoUploadError('Logo size must be 5 MB or smaller.');
      return;
    }

    // Show crop modal
    const imageUrl = URL.createObjectURL(file);
    setCropModalImage(imageUrl);
  };

  const handleCropComplete = async (croppedFile: File) => {
    // Clean up crop modal
    if (cropModalImage) {
      URL.revokeObjectURL(cropModalImage);
      setCropModalImage(null);
    }

    // Create preview and upload
    const previewUrl = URL.createObjectURL(croppedFile);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoPreviewUrl(previewUrl);

    try {
      await updateLogo({ logo: croppedFile });
    } catch (err: any) {
      const detail = err?.detail || err?.message || 'Unknown error';
      setLogoUploadError(`Logo upload failed: ${detail}`);
      URL.revokeObjectURL(previewUrl);
      setLogoPreviewUrl(null);
    }
  };

  const handleCropCancel = () => {
    if (cropModalImage) {
      URL.revokeObjectURL(cropModalImage);
      setCropModalImage(null);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    await processLogoFile(file);
    e.target.value = '';
  };

  const handleLogoDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsLogoDragActive(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    await processLogoFile(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const isVerified = effectiveUser?.kycStatus === KycStatus.APPROVED;
  const isApproved = effectiveUser?.status === UserStatus.APPROVED;
  const displayedLogo = logoPreviewUrl ?? effectiveUser?.logo;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Firm Profile</h1>
        <p className="text-muted-foreground">
          Your public profile visible to other verified members
        </p>
      </div>

      {/* Profile header card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="space-y-2">
              <div
                className={`relative group w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 transition-colors ${
                  isLogoDragActive ? 'border-primary' : 'border-border'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsLogoDragActive(true);
                }}
                onDragLeave={() => setIsLogoDragActive(false)}
                onDrop={handleLogoDrop}
              >
                {displayedLogo ? (
                  <img
                    src={displayedLogo}
                    alt="Company logo"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                )}
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  disabled={isUploadingLogo}
                >
                  <Upload className="w-5 h-5 text-white" />
                </button>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
              <div className="text-center text-[11px] text-muted-foreground">Drop logo here</div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary"
                  disabled={isUploadingLogo}
                >
                  Replace
                </button>
                {logoPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(logoPreviewUrl);
                      setLogoPreviewUrl(null);
                    }}
                    className="text-xs px-2 py-1 rounded-md border border-border hover:border-destructive"
                    disabled={isUploadingLogo}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold truncate">
                  {effectiveUser?.companyName}
                </h2>
                {isVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{effectiveUser?.role?.replace(/_/g, ' ')}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {effectiveUser?.reputationScore ?? 0} rep
                </span>
                <Badge variant={isApproved ? 'default' : 'warning'}>
                  {effectiveUser?.status?.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="secondary">{effectiveUser?.tier}</Badge>
              </div>
            </div>
          </div>

          {(isUploadingLogo || logoUploadProgress !== null) && (
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploading logo...</span>
                <span>{logoUploadProgress ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${logoUploadProgress ?? 0}%` }}
                />
              </div>
            </div>
          )}
          {logoUploadError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{logoUploadError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core details visible on your public profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="companyName">Company / Firm Name *</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="companyDescription">Company Description</Label>
              <Textarea
                id="companyDescription"
                value={form.companyDescription}
                onChange={(e) => setForm({ ...form, companyDescription: e.target.value })}
                placeholder="Describe your firm, expertise, and focus areas..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.companyDescription.length}/1000
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="website">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="linkedin">
                  <Linkedin className="w-3.5 h-3.5 inline mr-1" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Used for search and discovery</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="city">Primary City</Label>
              <select
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select city</option>
                {INDIAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Preferences</CardTitle>
            <CardDescription>
              Which asset classes are you active in? Helps other members find you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AssetPreferenceSelector
              selected={form.assetPreferences}
              onChange={(v) => setForm({ ...form, assetPreferences: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="ticketSizeMin">Min Ticket Size (₹)</Label>
                <Input
                  id="ticketSizeMin"
                  type="number"
                  min={0}
                  value={form.ticketSizeMin}
                  onChange={(e) => setForm({ ...form, ticketSizeMin: e.target.value })}
                  placeholder="e.g. 10000000"
                />
                {form.ticketSizeMin && (
                  <p className="text-xs text-muted-foreground">
                    {formatIndianNumber(Number(form.ticketSizeMin))}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="ticketSizeMax">Max Ticket Size (₹)</Label>
                <Input
                  id="ticketSizeMax"
                  type="number"
                  min={0}
                  value={form.ticketSizeMax}
                  onChange={(e) => setForm({ ...form, ticketSizeMax: e.target.value })}
                  placeholder="e.g. 500000000"
                />
                {form.ticketSizeMax && (
                  <p className="text-xs text-muted-foreground">
                    {formatIndianNumber(Number(form.ticketSizeMax))}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Profile'}
          </Button>
          {saved && (
            <p className="text-sm text-green-600 font-medium">Profile updated successfully!</p>
          )}
        </div>
      </form>

      {/* Crop Modal */}
      {cropModalImage && (
        <ImageCropModal
          imageUrl={cropModalImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}