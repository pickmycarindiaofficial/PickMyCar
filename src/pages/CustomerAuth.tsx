import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Smartphone, Shield, Car, CheckCircle2 } from 'lucide-react';
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
        if (data.customerToken) {
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

  const features = [
    { icon: Car, text: 'Browse 1000+ verified used cars' },
    { icon: Shield, text: 'Every car inspected & certified' },
    { icon: CheckCircle2, text: 'Easy financing & documentation' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Feature Showcase (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#236ceb] via-[#1e5bc9] to-[#0f3d8c] relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="mb-12">
            <img src={logoImage} alt="PickMyCar" className="h-20 brightness-0 invert" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Find Your Perfect<br />
            <span className="text-blue-200">Pre-Owned Car</span>
          </h1>

          <p className="text-blue-100 text-lg mb-10 max-w-md">
            Join thousands of happy customers who found their dream car with us.
          </p>

          <div className="space-y-5">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 text-white">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                  <feature.icon className="h-6 w-6" />
                </div>
                <span className="text-lg font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-blue-200">Happy Customers</div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-sm text-blue-200">Premium Cars</div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.8★</div>
              <div className="text-sm text-blue-200">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={logoImage} alt="PickMyCar" className="h-20 mx-auto mb-4" />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {step === 'phone' ? 'Welcome Back!' : 'Verify OTP'}
            </h2>
            <p className="text-muted-foreground">
              {step === 'phone'
                ? 'Sign in to continue your car buying journey'
                : 'Enter the 6-digit code sent to your WhatsApp'
              }
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Mobile Number
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center bg-muted rounded-xl px-4 text-sm font-medium border border-border">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      disabled={loading}
                      className="h-12 rounded-xl text-lg"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send a verification code via WhatsApp
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#236ceb] to-[#4b8cf5] hover:from-[#1e5bc9] hover:to-[#3a7de3] shadow-lg"
                  disabled={loading || phoneNumber.length !== 10}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-5 w-5" />
                      Send OTP
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                  onClick={() => navigate('/staff-login')}
                >
                  Staff / Dealer Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change Number (+91 {phoneNumber})
                </button>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    disabled={loading}
                    className="h-14 rounded-xl text-center text-2xl tracking-[0.5em] font-mono"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-[#236ceb] to-[#4b8cf5] hover:from-[#1e5bc9] hover:to-[#3a7de3] shadow-lg"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Didn't receive code? Resend OTP
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
