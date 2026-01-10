import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Phone, Calendar, ArrowLeft } from 'lucide-react';
import { ROLE_LABELS } from '@/types/auth';
import { Navbar } from '@/components/layout/Navbar';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, roles } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={() => { }} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground text-lg">
            Manage your personal information
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Your avatar and basic info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground">@{profile?.username}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary"
                  >
                    {ROLE_LABELS[role]}
                  </span>
                ))}
              </div>
              <Button variant="outline" className="w-full">
                Change Picture
              </Button>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={profile?.username || ''}
                      className="pl-10"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile?.phone_number || ''}
                      placeholder="Enter your phone number"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${profile?.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      {profile?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
                    className="pl-10"
                    disabled
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings - Only show for non-customer sessions (staff/admin who have passwords) */}
        {!profile?.phone_number?.includes('@customer') && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
