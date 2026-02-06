import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, ArrowRight, Phone } from 'lucide-react';
import { getStaffLoginInfo } from '@/hooks/useStaffAccounts';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';

export default function DealerStaffLogin() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { loginDealerStaff } = useAuth();
    const [step, setStep] = useState<'username' | 'otp'>('username');
    const [loading, setLoading] = useState(false);

    // Login Data
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [staffId, setStaffId] = useState<string | null>(null);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Get staff info
            const staff = await getStaffLoginInfo(username);

            if (!staff) {
                throw new Error('Username not found or account inactive');
            }

            if (staff.is_locked) {
                throw new Error('Account is locked. Contact your dealer admin.');
            }

            setStaffId(staff.id);
            setPhoneNumber(staff.phone_number);

            // Mask phone number for display (+91 98*** **210)
            const p = staff.phone_number;
            const masked = p.length > 4 ? `${p.slice(0, 3)}XXXXXX${p.slice(-4)}` : p;
            setMaskedPhone(masked);

            // Strip +91 for the Edge Function which expects 10 digits
            const formattedPhone = staff.phone_number.replace(/^\+91/, '').replace(/\D/g, '');

            // 2. Send OTP via Edge Function
            const { data, error: otpError } = await supabase.functions.invoke('send-whatsapp-otp', {
                body: {
                    phoneNumber: formattedPhone,
                    userType: 'staff' // Explicitly set user type/purpose context
                }
            });

            if (otpError) {
                console.error('OTP Send Error:', otpError);
                throw new Error('Failed to send OTP via WhatsApp. Please try again.');
            }

            if (data?.verificationId) {
                setVerificationId(data.verificationId);
            } else {
                throw new Error('Failed to initialize verification session.');
            }

            setStep('otp');
            toast({
                title: 'OTP Sent',
                description: `Code sent to WhatsApp number ${masked}`,
            });

        } catch (error: any) {
            console.error('Login Error:', error);
            toast({
                variant: 'destructive',
                title: 'Login Error',
                description: error.message || 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        setLoading(true);

        try {
            if (!verificationId) {
                throw new Error('Verification session lost. Please request code again.');
            }

            // 1. Verify OTP via Edge Function
            const { data, error } = await supabase.functions.invoke('verify-whatsapp-otp', {
                body: {
                    verificationId: verificationId,
                    otp: otp,
                    phoneNumber: phoneNumber.replace(/^\+91/, '').replace(/\D/g, ''), // Send formatted phone just in case
                    userType: 'staff'
                }
            });

            if (error || !data?.success) {
                throw new Error('Invalid OTP code');
            }

            // 2. Fetch full staff details for session
            const { data: staffData } = await supabase
                .from('staff_accounts')
                .select('*')
                .eq('id', staffId)
                .single();

            if (!staffData) throw new Error('Staff record not found');

            // 3. Create Session (Local Storage matches existing pattern)
            // 3. Create Session via AuthContext (Updates State Immediately)
            const session = {
                staffId: staffData.id,
                username: staffData.username,
                role: staffData.role,
                fullName: staffData.full_name,
                permissions: staffData.permissions,
                dealerId: staffData.dealer_id,
                sessionId: 'local-session' // Initialize proper session ID structure
            };

            await loginDealerStaff(session);

            // 4. Log successful login
            await supabase.rpc('log_staff_login', {
                p_staff_id: staffId,
                p_username: username,
                p_action: 'otp_login_success'
            });

            toast({
                title: 'Login Successful',
                description: 'Welcome back!',
            });

            navigate('/dashboard');

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: error.message || 'Invalid code',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Staff Access</CardTitle>
                    <CardDescription>
                        {step === 'username'
                            ? 'Enter your username to receive a login code'
                            : `Enter the code sent to ${maskedPhone}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'username' ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    placeholder="e.g. rahul_sales"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoFocus
                                    className="h-12 text-lg"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11" disabled={loading || !username}>
                                {loading ? <Loader2 className="animate-spin" /> : <>Get Login Code <ArrowRight className="ml-2 h-4 w-4" /></>}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(v) => setOtp(v)}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            <Button type="submit" className="w-full h-11" disabled={loading || otp.length !== 6}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                            </Button>

                            <div className="text-center">
                                <Button
                                    variant="link"
                                    type="button"
                                    className="text-sm text-muted-foreground"
                                    onClick={() => setStep('username')}
                                >
                                    Wrong user? Go back
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
