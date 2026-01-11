import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Calendar, ArrowLeft, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import { ROLE_LABELS } from '@/types/auth';
import { Navbar } from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, roles, isCustomerSession, customerPhone } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form values when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl((profile as any).avatar_url || null);
    }
  }, [profile]);

  // Format member since date as "Month Year"
  const formatMemberSince = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Handle profile picture upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const userId = profile?.id || customerPhone;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, show a friendlier message
        if (uploadError.message.includes('not found')) {
          throw new Error('Profile picture storage is not configured. Please contact support.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Update profile with new avatar URL
      if (isCustomerSession && customerPhone) {
        await (supabase as any)
          .from('customer_profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('phone_number', customerPhone);
      } else if (profile?.id) {
        await (supabase as any)
          .from('profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
      }

      toast({
        title: 'Profile picture updated',
        description: 'Your new profile picture has been saved.',
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id && !customerPhone) return;

    setIsSaving(true);
    try {
      if (isCustomerSession && customerPhone) {
        // Update customer profile
        const { error } = await (supabase as any)
          .from('customer_profiles')
          .update({
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('phone_number', customerPhone);

        if (error) throw error;
      } else if (profile?.id) {
        // Update staff/admin profile
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (error) throw error;
      }

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display phone number
  const displayPhone = isCustomerSession ? customerPhone : profile?.phone_number;

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={() => { }} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Profile Picture Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Your avatar and basic info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={fullName || 'Profile'} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                      {getInitials(fullName || profile?.full_name || '')}
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload overlay button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-lg">{fullName || profile?.full_name || 'User'}</h3>
                {displayPhone && (
                  <p className="text-sm text-muted-foreground">+91 {displayPhone}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary"
                  >
                    {ROLE_LABELS[role] || role}
                  </span>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Change Picture
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name - Editable */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Phone Number - NOT Editable */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={displayPhone ? `+91 ${displayPhone}` : ''}
                      className="pl-10 bg-muted/50"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Phone number cannot be changed as it's used for login
                  </p>
                </div>

                {/* Account Status - Always Active for logged-in users */}
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formatMemberSince(profile?.created_at)}
                      className="pl-10 bg-muted/50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-4 pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
