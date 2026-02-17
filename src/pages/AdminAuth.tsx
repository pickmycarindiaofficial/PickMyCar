import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import {
  verifyStaffPassword,
  recordStaffFailedLogin,
  recordStaffSuccessfulLogin,
  logStaffLogin,
  getStaffByUsername,
} from '@/hooks/useStaffAccounts';

type AuthStep = 'username' | 'password' | 'otp';

const AdminAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createStaffSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffFullName, setStaffFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get staff by username from new staff_accounts table
      const staff = await getStaffByUsername(username);

      if (!staff) {
        await logStaffLogin(null, username, 'login_failed', 'Username not found');
        throw new Error('Username not found');
      }

      // Check if user has PowerDesk role
      if (staff.role !== 'powerdesk') {
        await logStaffLogin(staff.id, username, 'login_failed', 'Not a PowerDesk admin');
        throw new Error('Access denied. PowerDesk admin privileges required.');
      }

      // Check if account is locked
      if (staff.is_locked) {
        throw new Error('Account is locked. Please contact your administrator.');
      }

      setStaffId(staff.id);
      setStaffFullName(staff.full_name);
      setPhoneNumber(staff.phone_number);
      setStep('password');

      await logStaffLogin(staff.id, username, 'login_success');
    } catch (error: any) {
      console.error('Error verifying username:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid username',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify password using new staff_accounts table
      const result = await verifyStaffPassword(username, password);

      if (!result.is_valid) {
        if (result.is_locked) {
          throw new Error('Account is locked. Please contact your administrator.');
        }
        await recordStaffFailedLogin(staffId);
        await logStaffLogin(staffId, username, 'login_failed', 'Invalid password');
        throw new Error('Invalid password');
      }

      // Password verified! Now send OTP
      const { data: otpData, error: otpError } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { phoneNumber: phoneNumber.replace('+91', ''), purpose: 'admin_login' },
      });

      if (otpError) {
        console.error('OTP Error:', otpError);
        throw new Error(otpError.message || 'Failed to send OTP. Please try again.');
      }

      // Check if the response indicates an error (rate limiting, etc.)
      if (otpData?.error) {
        throw new Error(otpData.error);
      }

      if (otpData?.success) {
        setVerificationId(otpData.verificationId);
        setStep('otp');

        await logStaffLogin(staffId, username, 'otp_sent');

        toast({
          title: 'OTP Sent',
          description: 'Please check your WhatsApp for the verification code',
        });
      } else {
        throw new Error('Unexpected response from OTP service');
      }
    } catch (error: any) {
      console.error('Error verifying password:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Phone number should match exactly how it was stored (without +91)
      const cleanPhone = phoneNumber.replace('+91', '');

      const { data, error } = await supabase.functions.invoke('verify-whatsapp-otp', {
        body: {
          verificationId,
          otp,
          phoneNumber: cleanPhone,
        },
      });

      if (error) throw error;

      if (data.success) {
        // OTP verified! Record successful login
        await recordStaffSuccessfulLogin(staffId);
        await logStaffLogin(staffId, username, 'otp_verified');

        // Create secure server-side session (NOT localStorage)
        try {
          await createStaffSession(staffId, username, 'powerdesk', staffFullName);
        } catch (sessionError) {
          console.error('Session creation error:', sessionError);
          // Fallback: still allow login but warn
          toast({
            title: 'Warning',
            description: 'Session created with limited security. Please run the SQL migration.',
            variant: 'destructive',
          });
        }

        toast({
          title: 'Login Successful',
          description: 'Welcome back, PowerDesk Admin!',
        });

        const returnTo = searchParams.get('returnTo') || '/dashboard';
        navigate(returnTo);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);

      await logStaffLogin(staffId, username, 'otp_failed', error.message);

      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
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
            className="h-34 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            PowerDesk Admin
          </h1>
          <p className="text-muted-foreground mt-2">Secure 3-step authentication</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Step {step === 'username' ? '1' : step === 'password' ? '2' : '3'} of 3
            </CardTitle>
            <CardDescription>
              {step === 'username' && 'Enter your admin username'}
              {step === 'password' && 'Enter your password'}
              {step === 'otp' && 'Enter the OTP sent to your WhatsApp'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'username' && (
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/staff-login')}
                  className="w-full text-sm text-muted-foreground"
                >
                  ← Back to Staff Login
                </Button>
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => navigate('/staff-login?tab=signup')}
                      className="px-0 text-primary"
                    >
                      Sign up here
                    </Button>
                  </p>
                </div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Username: {username}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('username');
                    setPassword('');
                  }}
                  className="w-full"
                >
                  ← Back
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    disabled={loading}
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Sent to {phoneNumber.replace(/(\d{5})(\d{5})/, '$1-*****')}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordSubmit}
                  disabled={loading}
                  className="w-full"
                >
                  Resend OTP
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuth;
