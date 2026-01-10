import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Smartphone } from 'lucide-react';
import logoImage from '@/assets/logo.png';

const CustomerAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number
      if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        toast({
          title: 'Invalid Phone Number',
          description: 'Please enter a valid 10-digit Indian mobile number',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { phoneNumber, purpose: 'login' },
      });

      if (error) throw error;

      if (data.success) {
        setVerificationId(data.verificationId);
        setExpiresAt(data.expiresAt);
        setStep('otp');
        toast({
          title: 'OTP Sent',
          description: 'Please check your WhatsApp for the verification code',
        });
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-whatsapp-otp', {
        body: {
          verificationId,
          otp,
          phoneNumber,
          purpose: 'login',
        },
      });

      if (error) throw error;

      if (data.success) {
        // Check if we have a customer session token
        if (data.customerToken) {
          // Store customer token in sessionStorage
          sessionStorage.setItem('pmc_customer_token', data.customerToken);
          sessionStorage.setItem('pmc_customer_phone', phoneNumber);

          toast({
            title: 'Welcome!',
            description: 'Login successful!',
          });
        } else {
          toast({
            title: 'Phone Verified!',
            description: data.message || 'Your phone number has been verified.',
          });
        }

        // Force page refresh to update auth state
        const returnTo = searchParams.get('returnTo') || '/';
        window.location.href = returnTo;
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
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
            className="h-40 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to PickMyCar
          </h1>
          <p className="text-muted-foreground mt-2">Login with your mobile number</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {step === 'phone' ? 'Enter Mobile Number' : 'Enter OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'phone'
                ? 'We\'ll send you a verification code via WhatsApp'
                : 'Enter the 6-digit code sent to your WhatsApp'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center bg-muted rounded-md px-3 text-sm">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || phoneNumber.length !== 10}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Are you a dealer or staff member?</p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/staff-login')}
                    className="text-primary"
                  >
                    Staff Login →
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                  className="mb-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Change Number
                </Button>

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
                    Sent to +91 {phoneNumber}
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
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={loading}
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

export default CustomerAuth;
