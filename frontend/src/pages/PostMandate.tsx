import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMandates } from '@/hooks/useMandates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { ASSET_CLASSES, INDIAN_CITIES, INDIAN_STATES } from '@/utils/constants';
import { MandateType, CreateMandateRequest, PropertyType } from '@/types';

export default function PostMandate() {
  const navigate = useNavigate();
  const { createMandate, isCreating } = useMandates();
  
  const [formData, setFormData] = useState<CreateMandateRequest>({
    type: MandateType.SELL,
    title: '',
    description: '',
    city: '',
    state: '',
    locality: '',
    propertyType: PropertyType.RESIDENTIAL_LAND,
    builtUpArea: undefined,
    plotArea: undefined,
    ticketSize: 0,
    ticketSizeMax: undefined,
    tags: [],
    isOffMarket: false,
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMandate(formData);
      alert('Mandate submitted successfully and is now pending admin approval before going live.');
      navigate('/marketplace');
    } catch (error: any) {
      alert(error.detail || 'Failed to post mandate');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Post New Mandate</CardTitle>
          <CardDescription>
            Share your buy or sell mandate on India Property Network Ltd.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm uppercase tracking-wider text-muted-foreground">Mandate Type</Label>
                  <div className="flex gap-0 mt-2 border border-input rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: MandateType.BUY })}
                      className={`
                        flex-1 py-4 px-6 font-semibold text-sm uppercase tracking-wide transition-all duration-200
                        ${formData.type === MandateType.BUY
                          ? 'bg-blue-500/20 text-blue-400 border-r border-input'
                          : 'bg-transparent text-muted-foreground hover:bg-secondary/50 border-r border-input'
                        }
                      `}
                    >
                      BUY-SIDE (LOOKING FOR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: MandateType.SELL })}
                      className={`
                        flex-1 py-4 px-6 font-semibold text-sm uppercase tracking-wide transition-all duration-200
                        ${formData.type === MandateType.SELL
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-transparent text-muted-foreground hover:bg-secondary/50'
                        }
                      `}
                    >
                      SELL-SIDE (OFFERING)
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="assetClass">Asset Class *</Label>
                  <select
                    id="assetClass"
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                    required
                  >
                    {ASSET_CLASSES.map((asset) => (
                      <option key={asset.value} value={asset.value}>
                        {asset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Premium Commercial Plot in Bandra West"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about the property..."
                  rows={6}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <select
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select City</option>
                    {INDIAN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="locality">Locality (Optional)</Label>
                <Input
                  id="locality"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  placeholder="e.g., Linking Road, Bandra West"
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Details</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="builtUpArea">Built-up Area (sq ft)</Label>
                  <Input
                    id="builtUpArea"
                    type="number"
                    value={formData.builtUpArea || ''}
                    onChange={(e) => setFormData({ ...formData, builtUpArea: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g., 2500"
                  />
                </div>

                <div>
                  <Label htmlFor="plotArea">Plot Area (sq ft)</Label>
                  <Input
                    id="plotArea"
                    type="number"
                    value={formData.plotArea || ''}
                    onChange={(e) => setFormData({ ...formData, plotArea: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
            </div>

            {/* Financial */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Financial Details</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ticketSize">Ticket Size (₹) *</Label>
                  <Input
                    id="ticketSize"
                    type="number"
                    value={formData.ticketSize || ''}
                    onChange={(e) => setFormData({ ...formData, ticketSize: Number(e.target.value) })}
                    placeholder="e.g., 50000000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ticketSizeMax">Max Ticket Size (₹)</Label>
                  <Input
                    id="ticketSizeMax"
                    type="number"
                    value={formData.ticketSizeMax || ''}
                    onChange={(e) => setFormData({ ...formData, ticketSizeMax: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g., 100000000"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tags</h3>
              
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags (e.g., urgent, negotiable)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Visibility</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOffMarket"
                  checked={formData.isOffMarket}
                  onChange={(e) => setFormData({ ...formData, isOffMarket: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <Label htmlFor="isOffMarket" className="cursor-pointer">
                  Mark as Off-Market (still visible on India Property Network Ltd., hidden from public listing channels)
                </Label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-3 pt-4">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Posting...' : 'Post Mandate'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
