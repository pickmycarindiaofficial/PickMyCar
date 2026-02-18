import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { safeSessionStorage } from '@/lib/utils';
import { Loader2, ArrowLeft, Smartphone, Shield, Car, CheckCircle2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import logoImage from '@/assets/logo.png';

const CustomerAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, roles } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      // Check if user has staff/dealer roles - redirect to dashboard
      const hasStaffRole = roles.some(role =>
        ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection'].includes(role)
      );

      if (hasStaffRole) {
        navigate('/dashboard/home', { replace: true });
      } else {
        // Regular customer - redirect to home or returnTo
        const returnTo = searchParams.get('returnTo') || '/';
        navigate(returnTo, { replace: true });
      }
    }
  }, [user, loading, roles, navigate, searchParams]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        toast({
          title: 'Invalid Phone Number',
          description: 'Please enter a valid 10-digit Indian mobile number',
          variant: 'destructive',
        });
        setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
          safeSessionStorage.setItem('pmc_customer_token', data.customerToken);
          safeSessionStorage.setItem('pmc_customer_phone', phoneNumber);

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
      setIsLoading(false);
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
            <img src={logoImage} alt="PickMyCar" className="h-24 brightness-0 invert" />
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
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-b from-blue-50/80 via-white to-white dark:from-gray-900 dark:to-background p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <img src={logoImage} alt="PickMyCar" className="h-24 w-auto mx-auto drop-shadow-sm" />
          </div>

          {/* Welcome Text */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              {step === 'phone' ? 'Start Your Journey' : 'Verify Your Phone'}
            </h2>
            <p className="text-base text-muted-foreground text-balance">
              {step === 'phone'
                ? 'Enter your mobile number to get started with the best car buying experience.'
                : `We've sent a 6-digit code to your WhatsApp number +91-${phoneNumber}`
              }
            </p>
          </div>

          {/* Login Form */}
          <div className={`transition-all duration-300 ${step === 'phone' ? 'space-y-6' : 'space-y-6'}`}>
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                      <span className="text-lg font-bold text-gray-500 border-r border-gray-300 pr-3">+91</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      disabled={isLoading}
                      className="h-14 pl-16 rounded-2xl text-xl font-semibold bg-white dark:bg-card border-2 border-gray-100 hover:border-blue-200 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10 transition-all shadow-sm"
                      required
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                    <Shield className="w-3 h-3" /> Secure login via WhatsApp verify
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-[#236ceb] to-[#4b8cf5] hover:from-[#1e5bc9] hover:to-[#3a7de3] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  disabled={isLoading || phoneNumber.length !== 10}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Get Verification Code
                    </>
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                    <span className="bg-transparent px-3 text-muted-foreground/60">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => navigate('/dealer/login')}
                >
                  Staff / Dealer Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="bg-white dark:bg-card p-6 rounded-3xl border-2 border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="space-y-4">
                    <Label htmlFor="otp" className="text-center block text-sm font-medium text-muted-foreground">
                      Enter the code below
                    </Label>
                    <div className="flex justify-center pb-2">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                      >
                        <InputOTPGroup className="gap-2 sm:gap-3">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="h-12 w-10 sm:w-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-xl font-bold bg-gray-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-[#236ceb] to-[#4b8cf5] hover:from-[#1e5bc9] hover:to-[#3a7de3] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={handleSendOTP}
                    disabled={isLoading}
                  >
                    Didn't receive code? Resend
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 mx-auto flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change Number
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-muted-foreground/60 mt-8 max-w-xs mx-auto leading-relaxed">
            By continuing, you agree to PickMyCar's{' '}
            <a href="#" className="underline decoration-muted-foreground/40 underline-offset-2">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline decoration-muted-foreground/40 underline-offset-2">Privacy Policy</a>
            . We protect your data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
