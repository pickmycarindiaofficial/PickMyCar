import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Briefcase, Eye, EyeOff, UserPlus } from 'lucide-react';
import { AppRole, ROLE_LABELS } from '@/types/auth';
import logoImage from '@/assets/logo.png';
import {
  verifyStaffPassword,
  recordStaffFailedLogin,
  recordStaffSuccessfulLogin,
  logStaffLogin,
  getStaffByUsername,
} from '@/hooks/useStaffAccounts';

const STAFF_ROLES: AppRole[] = ['sales', 'finance', 'inspection', 'website_manager'];

const StaffAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('sales');
  const [showPassword, setShowPassword] = useState(false);

  // Signup State
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupRole, setSignupRole] = useState<AppRole>('sales');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get staff by username
      const staff = await getStaffByUsername(username);

      if (!staff) {
        await logStaffLogin(null, username, 'login_failed', 'Username not found');
        throw new Error('Invalid username or password');
      }

      // Check if account is locked
      if (staff.is_locked) {
        throw new Error('Account is locked. Please contact your administrator.');
      }

      // Verify password
      const result = await verifyStaffPassword(username, password);

      if (!result.is_valid) {
        await recordStaffFailedLogin(staff.id);
        await logStaffLogin(staff.id, username, 'login_failed', 'Invalid password');
        throw new Error('Invalid username or password');
      }

      // Check if user has the selected role
      if (staff.role !== selectedRole) {
        await logStaffLogin(staff.id, username, 'login_failed', `Role mismatch: expected ${selectedRole}, got ${staff.role}`);
        throw new Error('You do not have access with the selected role');
      }

      // Record successful login
      await recordStaffSuccessfulLogin(staff.id);
      await logStaffLogin(staff.id, username, 'login_success');

      // Store staff session
      const staffSession = {
        staffId: staff.id,
        username,
        role: staff.role,
        fullName: staff.full_name,
        phoneNumber: staff.phone_number,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem('staff_session', JSON.stringify(staffSession));

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${ROLE_LABELS[selectedRole]}!`,
      });

      const returnTo = searchParams.get('returnTo') || '/dashboard';
      navigate(returnTo);
    } catch (error: any) {
      console.error('Error logging in:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (signupUsername.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (signupPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (!/^[6-9]\d{9}$/.test(signupPhone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      // Create staff account using RPC
      const { data, error } = await supabase.rpc('create_staff_account', {
        p_username: signupUsername,
        p_password: signupPassword,
        p_full_name: signupFullName,
        p_phone_number: `+91${signupPhone}`,
        p_role: signupRole,
        p_email: null,
        p_created_by: null,
      });

      if (error) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error('This username is already taken. Please choose another.');
        }
        throw error;
      }

      toast({
        title: 'Account Created! 🎉',
        description: 'You can now login with your username and password.',
      });

      // Switch to login tab
      setActiveTab('login');
      setUsername(signupUsername);
      setSelectedRole(signupRole);
      setSignupUsername('');
      setSignupPassword('');
      setSignupPhone('');
      setSignupFullName('');
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'Could not create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logoImage}
            alt="PickMyCar"
            className="h-40 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">
            Staff Portal
          </h1>
          <p className="text-muted-foreground mt-2">Login or create your staff account</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                    <SelectTrigger id="role" className="bg-background">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>

                <div className="space-y-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/auth')}
                    className="w-full text-sm text-muted-foreground"
                  >
                    ← Back to Customer Login
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/dealer/login')}
                    className="w-full text-sm text-emerald-600"
                  >
                    Dealer Login (OTP) →
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/admin-login')}
                    className="w-full text-sm text-primary"
                  >
                    PowerDesk Admin Login →
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select value={signupRole} onValueChange={(value) => setSignupRole(value as AppRole)}>
                    <SelectTrigger id="signup-role" className="bg-background">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="johndoe"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and underscores</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center bg-muted rounded-md px-3 text-sm">
                      +91
                    </div>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="9876543210"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  By signing up, you agree to our Terms of Service
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffAuth;
