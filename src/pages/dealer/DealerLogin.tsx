import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ArrowRight, Shield, Car, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo.png';

type LoginStep = 'username' | 'otp';

export default function DealerLogin() {
    const navigate = useNavigate();
    const [step, setStep] = useState<LoginStep>('username');
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [dealerId, setDealerId] = useState('');
    const [dealershipName, setDealershipName] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) {
            toast({ title: 'Error', description: 'Please enter your username', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            // Use unified OTP function with userType='dealer'
            const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
                body: {
                    username: username.trim(),
                    userType: 'dealer',
                    purpose: 'login'
                },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setVerificationId(data.verificationId);
            setDealerId(data.dealer_id);
            setDealershipName(data.dealership_name);
            setMaskedPhone(data.maskedPhone);
            setStep('otp');

            toast({ title: 'OTP Sent', description: data.message });

            // For development - show OTP in console if available
            if (data.dev_otp) {
                console.log('Development OTP:', data.dev_otp);
                toast({ title: 'Dev Mode', description: `OTP: ${data.dev_otp}` });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send OTP',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp.trim() || otp.length !== 6) {
            toast({ title: 'Error', description: 'Please enter a valid 6-digit OTP', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            // Use unified verify function with userType='dealer'
            const { data, error } = await supabase.functions.invoke('verify-whatsapp-otp', {
                body: {
                    verificationId: verificationId,
                    otp: otp.trim(),
                    userType: 'dealer'
                },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            // Store session token
            localStorage.setItem('dealer_token', data.token);
            localStorage.setItem('dealer_info', JSON.stringify(data.dealer));

            toast({ title: 'Welcome!', description: `Logged in as ${data.dealer.dealership_name}` });

            // Redirect to dashboard with full page reload so AuthContext picks up the new session
            window.location.href = '/dashboard/home';
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Invalid OTP',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: Car, text: 'List unlimited cars on our platform' },
        { icon: Users, text: 'Access to thousands of buyers' },
        { icon: TrendingUp, text: 'Real-time analytics & insights' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Feature Showcase (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 py-12">
                    <div className="mb-12">
                        <img src={logoImage} alt="PickMyCar" className="h-20" />
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-4">
                        Grow Your<br />
                        <span className="text-emerald-200">Dealership</span>
                    </h1>

                    <p className="text-emerald-100 text-lg mb-10 max-w-md">
                        Partner with PickMyCar and reach thousands of verified buyers looking for their perfect car.
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
                            <div className="text-3xl font-bold text-white">500+</div>
                            <div className="text-sm text-emerald-200">Partner Dealers</div>
                        </div>
                        <div className="h-10 w-px bg-white/20" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">50K+</div>
                            <div className="text-sm text-emerald-200">Cars Listed</div>
                        </div>
                        <div className="h-10 w-px bg-white/20" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">₹100Cr+</div>
                            <div className="text-sm text-emerald-200">Sales Generated</div>
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
                            {step === 'username' ? 'Dealer Portal' : 'Verify OTP'}
                        </h2>
                        <p className="text-muted-foreground">
                            {step === 'username'
                                ? 'Enter your username to receive OTP on WhatsApp'
                                : `Enter the 6-digit code sent to ${maskedPhone}`}
                        </p>
                    </div>

                    {/* Login Form */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
                        {step === 'username' ? (
                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-sm font-medium">
                                        Username
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="h-12 rounded-xl text-lg"
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        We'll send a verification code to your registered WhatsApp
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg"
                                    disabled={isLoading || !username.trim()}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            Send OTP
                                            <ArrowRight className="ml-2 h-5 w-5" />
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

                                <div className="space-y-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-12 rounded-xl"
                                        onClick={() => navigate('/auth')}
                                    >
                                        ← Back to Customer Login
                                    </Button>

                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <button
                                    type="button"
                                    onClick={() => { setStep('username'); setOtp(''); }}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Change Username ({username})
                                </button>

                                {dealershipName && (
                                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                        <p className="text-sm text-muted-foreground">Logging in to</p>
                                        <p className="text-lg font-semibold text-foreground">{dealershipName}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-sm font-medium">
                                        Verification Code
                                    </Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="• • • • • •"
                                        className="h-14 rounded-xl text-center text-2xl tracking-[0.5em] font-mono"
                                        disabled={isLoading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg"
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="mr-2 h-5 w-5" />
                                            Verify & Login
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={handleSendOTP}
                                    disabled={isLoading}
                                >
                                    Didn't receive code? Resend OTP
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-muted-foreground mt-6">
                        Need help? Contact{' '}
                        <a href="mailto:dealers@pickmycar.co.in" className="text-primary hover:underline">
                            dealers@pickmycar.co.in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
