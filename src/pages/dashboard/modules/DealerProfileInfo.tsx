import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDealerProfileManagement } from '@/hooks/useDealerProfileManagement';
import { useUpdateDealerProfile } from '@/hooks/useUpdateDealerProfile';
import { useUploadDealerImage } from '@/hooks/useUploadDealerImage';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Save, Upload, Eye, X, Plus,
  Building2, Globe, Award, Clock, Settings, Image as ImageIcon, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { optimizeCarImage } from '@/lib/imageCompression';

const SPECIALIZATIONS = [
  'Luxury Cars', 'SUVs', 'Sedans', 'Hatchbacks', 'Electric Vehicles',
  'Sports Cars', 'Commercial Vehicles', 'Vintage Cars', 'Pre-owned Cars'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DealerProfileInfo() {
  const { dealerId: paramDealerId } = useParams();
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  // Determine which dealer ID to use
  const dealerId = roles?.includes('powerdesk') ? paramDealerId : user?.id;

  const { data: profile, isLoading } = useDealerProfileManagement(dealerId);
  const updateProfile = useUpdateDealerProfile(dealerId);
  const uploadLogo = useUploadDealerImage(dealerId, 'logo');
  const uploadBanner = useUploadDealerImage(dealerId, 'banner');
  const { data: cities } = useCities();

  const [formData, setFormData] = useState<any>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [operatingHours, setOperatingHours] = useState<any>({});
  const [certifications, setCertifications] = useState<string[]>([]);
  const [awards, setAwards] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [newAward, setNewAward] = useState('');
  const [customerPhotos, setCustomerPhotos] = useState<Array<{ url: string; caption?: string; uploaded_at?: string }>>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState<string | null>(null);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(profile);
      setLogoPreview(profile.logo_url);
      setBannerPreview(profile.banner_url);
      setSelectedSpecializations(profile.specialization || []);
      setOperatingHours(profile.operating_hours || {});
      setCertifications(profile.certifications || []);
      setAwards(profile.awards || []);
      setCustomerPhotos(profile.customer_photos || []);
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);

    try {
      const url = await uploadLogo.mutateAsync(file);
      // Auto-save logo immediately
      await updateProfile.mutateAsync({ logo_url: url });
      setFormData({ ...formData, logo_url: url });
    } catch (error) {
      console.error('Failed to upload logo:', error);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setBannerPreview(preview);

    try {
      const url = await uploadBanner.mutateAsync(file);
      // Auto-save banner immediately
      await updateProfile.mutateAsync({ banner_url: url });
      setFormData({ ...formData, banner_url: url });
    } catch (error) {
      console.error('Failed to upload banner:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
        about_text: formData.about_text,
        website_url: formData.website_url,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        twitter_url: formData.twitter_url,
        google_place_id: formData.google_place_id,
        year_established: formData.year_established ? parseInt(formData.year_established) : null,
        specialization: selectedSpecializations,
        operating_hours: operatingHours,
        certifications,
        awards,
        customer_photos: customerPhotos,
        show_logo: formData.show_logo,
        show_banner: formData.show_banner,
        show_about: formData.show_about,
        show_social_media: formData.show_social_media,
        show_operating_hours: formData.show_operating_hours,
        show_certifications: formData.show_certifications,
        show_awards: formData.show_awards,
        show_google_rating: formData.show_google_rating,
        show_customer_photos: formData.show_customer_photos,
      });

      toast.success('Profile updated successfully!', {
        action: dealerId ? {
          label: 'View Live',
          onClick: () => window.open(`/dealer/${dealerId}`, '_blank')
        } : undefined,
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleVisibilityToggle = async (field: string, value: boolean) => {
    // Update local state immediately for instant UI feedback
    setFormData({ ...formData, [field]: value });
    setSavingVisibility(field);

    try {
      await updateProfile.mutateAsync({ [field]: value });
      toast.success('Visibility setting updated', { duration: 2000 });
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error('Failed to update setting');
      // Revert local state on error
      setFormData({ ...formData, [field]: !value });
    } finally {
      setSavingVisibility(null);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const addAward = () => {
    if (newAward.trim()) {
      setAwards([...awards, newAward.trim()]);
      setNewAward('');
    }
  };

  const handleCustomerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !dealerId) return;

    // Validate file count
    if (customerPhotos.length + files.length > 20) {
      toast.error(`Cannot upload more than 20 photos. You have ${customerPhotos.length} photos already.`);
      return;
    }

    setUploadingPhoto(true);
    const toastId = toast.loading('Uploading customer photos...');

    try {
      const newPhotos: Array<{ url: string; caption?: string }> = [];

      for (const file of Array.from(files)) {
        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 2MB.`);
          continue;
        }

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error(`${file.name} is not a valid image format.`);
          continue;
        }

        const optimized = await optimizeCarImage(file);
        const timestamp = Date.now();
        const path = `${dealerId}/customer-photos/${timestamp}-${file.name}`;

        const { data, error: uploadError } = await supabase.storage
          .from('dealer-customer-photos')
          .upload(path, optimized.medium.file, {
            upsert: true,
            contentType: file.type
          });

        if (uploadError) {
          // Provide specific error messages
          if (uploadError.message.includes('row-level security')) {
            throw new Error('You do not have permission to upload photos for this dealer. Please contact support.');
          } else if (uploadError.message.includes('payload too large')) {
            throw new Error(`${file.name} is too large after compression. Try a smaller image.`);
          } else {
            throw uploadError;
          }
        }

        const { data: { publicUrl } } = supabase.storage
          .from('dealer-customer-photos')
          .getPublicUrl(data.path);

        newPhotos.push({ url: publicUrl });
      }

      if (newPhotos.length === 0) {
        toast.dismiss(toastId);
        toast.error('No photos were uploaded successfully.');
        setUploadingPhoto(false);
        return;
      }

      const updatedPhotos = [...customerPhotos, ...newPhotos];
      setCustomerPhotos(updatedPhotos);

      // Auto-save to database immediately
      const { error: saveError } = await (supabase as any)

        .from('dealer_profiles')
        .update({ customer_photos: updatedPhotos })
        .eq('id', dealerId);

      if (saveError) {
        console.error('[Customer Photos] Save error:', saveError);

        if (saveError.message.includes('row-level security')) {
          throw new Error('You do not have permission to update this dealer profile.');
        } else {
          throw saveError;
        }
      }

      toast.dismiss(toastId);
      toast.success(`Successfully uploaded ${newPhotos.length} photo(s)!`);

      // Reset file input
      e.target.value = '';

    } catch (error: any) {
      console.error('[Customer Photos] Error:', error);
      toast.dismiss(toastId);
      toast.error(error.message || 'Failed to upload customer photos');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeCustomerPhoto = async (index: number) => {
    const updatedPhotos = customerPhotos.filter((_, i) => i !== index);
    setCustomerPhotos(updatedPhotos);

    // Auto-save to database
    try {
      const { error } = await (supabase as any)
        .from('dealer_profiles')
        .update({ customer_photos: updatedPhotos })
        .eq('id', dealerId);

      if (error) throw error;
      toast.success('Photo removed successfully');
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-screen">Dealer profile not found</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {roles?.includes('powerdesk')
                ? `Edit Dealer Profile - ${profile.dealership_name}`
                : 'My Profile'
              }
            </h1>
            <p className="text-muted-foreground">
              Manage {profile.dealership_name} profile information and visibility
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="online">Online Presence</TabsTrigger>
          <TabsTrigger value="business">Business Details</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="photos">Customer Photos</TabsTrigger>
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dealership Name</Label>
                  <Input value={profile.dealership_name} disabled />
                </div>
                <div>
                  <Label>Business Type</Label>
                  <Input value={profile.business_type || 'N/A'} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GST Number</Label>
                  <Input value={profile.gst_number || 'N/A'} disabled />
                </div>
                <div>
                  <Label>PAN Number</Label>
                  <Input value={profile.pan_number || 'N/A'} disabled />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={profile.address} disabled />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={profile.city_name || 'N/A'} disabled />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={profile.state} disabled />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input value={profile.pincode} disabled />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Branding & Visual Identity</h2>
            </div>
            <div className="space-y-6">
              <div>
                <Label>Logo (Recommended: 200x200px)</Label>
                <div className="mt-2 flex items-center gap-4">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="h-24 w-24 object-contain rounded border" />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Banner Image (Recommended: 1200x300px)</Label>
                <div className="mt-2 space-y-4">
                  {bannerPreview && (
                    <img src={bannerPreview} alt="Banner" className="w-full h-48 object-cover rounded border" />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">PNG or JPG, max 5MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>About Us</Label>
                <Textarea
                  value={formData.about_text || ''}
                  onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
                  placeholder="Tell customers about your dealership, experience, and what makes you unique..."
                  rows={8}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(formData.about_text || '').length} / 1000 characters
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Online Presence Tab */}
        <TabsContent value="online">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Online Presence</h2>
            </div>
            <div className="grid gap-4">
              <div>
                <Label>Website URL</Label>
                <Input
                  value={formData.website_url || ''}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.yourwebsite.com"
                />
              </div>
              <div>
                <Label>Facebook Page URL</Label>
                <Input
                  value={formData.facebook_url || ''}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  placeholder="https://www.facebook.com/yourpage"
                />
              </div>
              <div>
                <Label>Instagram Profile URL</Label>
                <Input
                  value={formData.instagram_url || ''}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://www.instagram.com/yourprofile"
                />
              </div>
              <div>
                <Label>Twitter Profile URL</Label>
                <Input
                  value={formData.twitter_url || ''}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  placeholder="https://twitter.com/yourprofile"
                />
              </div>
              <Separator />
              <div>
                <Label>Google Place ID</Label>
                <Input
                  value={formData.google_place_id || ''}
                  onChange={(e) => setFormData({ ...formData, google_place_id: e.target.value })}
                  placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used to fetch Google reviews and ratings (Optional)
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Business Details Tab */}
        <TabsContent value="business">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Business Details</h2>
            </div>
            <div className="space-y-6">
              <div>
                <Label>Year Established</Label>
                <Input
                  type="number"
                  value={formData.year_established || ''}
                  onChange={(e) => setFormData({ ...formData, year_established: e.target.value })}
                  placeholder="2010"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <Separator />

              <div>
                <Label>Specializations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SPECIALIZATIONS.map((spec) => (
                    <Badge
                      key={spec}
                      variant={selectedSpecializations.includes(spec) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSpecialization(spec)}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Operating Hours</Label>
                <div className="space-y-3 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="grid grid-cols-4 gap-4 items-center">
                      <Label className="col-span-1">{day}</Label>
                      <Input
                        type="time"
                        value={operatingHours[day]?.open || ''}
                        onChange={(e) => setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day], open: e.target.value }
                        })}
                        placeholder="09:00"
                        className="col-span-1"
                      />
                      <Input
                        type="time"
                        value={operatingHours[day]?.close || ''}
                        onChange={(e) => setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day], close: e.target.value }
                        })}
                        placeholder="18:00"
                        className="col-span-1"
                      />
                      <Switch
                        checked={operatingHours[day]?.closed || false}
                        onCheckedChange={(checked) => setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day], closed: checked }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Achievements & Recognition</h2>
            </div>
            <div className="space-y-6">
              <div>
                <Label>Certifications</Label>
                <div className="flex gap-2 mt-2 mb-3">
                  <Input
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    placeholder="Enter certification name"
                    onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                  />
                  <Button onClick={addCertification} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, idx) => (
                    <Badge key={idx} variant="secondary">
                      {cert}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Awards</Label>
                <div className="flex gap-2 mt-2 mb-3">
                  <Input
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    placeholder="Enter award name"
                    onKeyPress={(e) => e.key === 'Enter' && addAward()}
                  />
                  <Button onClick={addAward} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {awards.map((award, idx) => (
                    <Badge key={idx} variant="secondary">
                      {award}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => setAwards(awards.filter((_, i) => i !== idx))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Visibility Settings Tab */}
        <TabsContent value="visibility">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Visibility Settings</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Control which information is displayed on your public profile page
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Logo</Label>
                  <p className="text-sm text-muted-foreground">Display your dealership logo</p>
                </div>
                <Switch
                  checked={formData.show_logo ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_logo: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Banner</Label>
                  <p className="text-sm text-muted-foreground">Display banner image</p>
                </div>
                <Switch
                  checked={formData.show_banner ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_banner: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show About Us</Label>
                  <p className="text-sm text-muted-foreground">Display about text and specializations</p>
                </div>
                <Switch
                  checked={formData.show_about ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_about: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Social Media</Label>
                  <p className="text-sm text-muted-foreground">Display social media links</p>
                </div>
                <Switch
                  checked={formData.show_social_media ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_social_media: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Operating Hours</Label>
                  <p className="text-sm text-muted-foreground">Display business hours</p>
                </div>
                <Switch
                  checked={formData.show_operating_hours ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_operating_hours: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Certifications</Label>
                  <p className="text-sm text-muted-foreground">Display certifications</p>
                </div>
                <Switch
                  checked={formData.show_certifications ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_certifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Awards</Label>
                  <p className="text-sm text-muted-foreground">Display awards and recognition</p>
                </div>
                <Switch
                  checked={formData.show_awards ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_awards: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Customer Photos</Label>
                  <p className="text-sm text-muted-foreground">Display happy customer photos</p>
                </div>
                <Switch
                  checked={formData.show_customer_photos ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_customer_photos: checked })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Customer Photos Tab */}
        <TabsContent value="photos">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Happy Customer Photos</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Upload photos of happy customers with their purchased vehicles. These photos build trust and social proof.
            </p>
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="customer-photos">Upload Photos (Max 20)</Label>
                    {customerPhotos.length > 0 && (
                      <Badge variant="secondary">
                        {customerPhotos.length} / 20 photos
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="customer-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCustomerPhotoUpload}
                    disabled={uploadingPhoto || customerPhotos.length >= 20}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload photos of happy customers with their purchased vehicles. PNG or JPG, max 2MB each.
                  </p>
                </div>

                {/* Photo Grid Display */}
                {customerPhotos.length > 0 ? (
                  <div className="border rounded-lg p-4 bg-secondary/20">
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Uploaded Photos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {customerPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border hover:border-primary transition-colors">
                            <img
                              src={photo.url}
                              alt={`Customer ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => removeCustomerPhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {photo.caption && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {photo.caption}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-1">No photos uploaded yet</p>
                    <p className="text-xs text-muted-foreground">
                      Upload photos to showcase your happy customers
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Visibility Settings Tab */}
        <TabsContent value="visibility">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Visibility Settings</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Control which information is displayed on your public profile page
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Logo</Label>
                  <p className="text-sm text-muted-foreground">Display your dealership logo</p>
                </div>
                <Switch
                  checked={formData.show_logo ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_logo', checked)}
                  disabled={savingVisibility === 'show_logo'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Banner</Label>
                  <p className="text-sm text-muted-foreground">Display banner image</p>
                </div>
                <Switch
                  checked={formData.show_banner ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_banner', checked)}
                  disabled={savingVisibility === 'show_banner'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show About Us</Label>
                  <p className="text-sm text-muted-foreground">Display about text and specializations</p>
                </div>
                <Switch
                  checked={formData.show_about ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_about', checked)}
                  disabled={savingVisibility === 'show_about'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Social Media</Label>
                  <p className="text-sm text-muted-foreground">Display social media links</p>
                </div>
                <Switch
                  checked={formData.show_social_media ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_social_media', checked)}
                  disabled={savingVisibility === 'show_social_media'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Operating Hours</Label>
                  <p className="text-sm text-muted-foreground">Display business hours</p>
                </div>
                <Switch
                  checked={formData.show_operating_hours ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_operating_hours', checked)}
                  disabled={savingVisibility === 'show_operating_hours'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Certifications</Label>
                  <p className="text-sm text-muted-foreground">Display certifications</p>
                </div>
                <Switch
                  checked={formData.show_certifications ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_certifications', checked)}
                  disabled={savingVisibility === 'show_certifications'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Awards</Label>
                  <p className="text-sm text-muted-foreground">Display awards and recognition</p>
                </div>
                <Switch
                  checked={formData.show_awards ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_awards', checked)}
                  disabled={savingVisibility === 'show_awards'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Google Rating</Label>
                  <p className="text-sm text-muted-foreground">Display Google rating and reviews</p>
                </div>
                <Switch
                  checked={formData.show_google_rating ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_google_rating', checked)}
                  disabled={savingVisibility === 'show_google_rating'}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Customer Photos</Label>
                  <p className="text-sm text-muted-foreground">Display happy customer photos</p>
                </div>
                <Switch
                  checked={formData.show_customer_photos ?? true}
                  onCheckedChange={(checked) => handleVisibilityToggle('show_customer_photos', checked)}
                  disabled={savingVisibility === 'show_customer_photos'}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Live Preview</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              This is how your profile will appear to customers
            </p>
            <Button
              onClick={() => window.open(`/dealer/${dealerId}`, '_blank')}
              disabled={!dealerId}
            >
              <Eye className="h-4 w-4 mr-2" />
              Open Public Profile
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
