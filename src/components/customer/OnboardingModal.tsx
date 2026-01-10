import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, MapPin, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Indian cities list
const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
    'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
    'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kochi', 'Chandigarh',
    'Mysore', 'Salem', 'Tiruchirappalli', 'Thiruvananthapuram', 'Noida', 'Gurgaon',
].sort();

interface OnboardingModalProps {
    isOpen: boolean;
    phoneNumber: string;
    onComplete: () => void;
}

export function OnboardingModal({ isOpen, phoneNumber, onComplete }: OnboardingModalProps) {
    const [fullName, setFullName] = useState('');
    const [city, setCity] = useState('');
    const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
    const [loading, setLoading] = useState(false);

    // Auto-detect location on mount
    useEffect(() => {
        if (isOpen) {
            detectLocation();
        }
    }, [isOpen]);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            return;
        }

        setLocationStatus('detecting');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Use reverse geocoding to get city name
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await response.json();

                    const detectedCity = data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        data.address?.county ||
                        data.address?.state_district;

                    if (detectedCity) {
                        // Find closest match in our cities list
                        const matchedCity = INDIAN_CITIES.find(c =>
                            detectedCity.toLowerCase().includes(c.toLowerCase()) ||
                            c.toLowerCase().includes(detectedCity.toLowerCase())
                        );

                        if (matchedCity) {
                            setCity(matchedCity);
                        } else {
                            // Just set the detected city name
                            setCity(detectedCity);
                        }
                    }

                    setLocationStatus('detected');
                } catch (error) {
                    console.error('Geocoding error:', error);
                    setLocationStatus('error');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationStatus('error');
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    };

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            toast.error('Please enter your name');
            return;
        }
        if (!city.trim()) {
            toast.error('Please select your city');
            return;
        }

        setLoading(true);

        try {
            // Update or create customer profile
            const { error } = await (supabase as any)
                .from('customer_profiles')
                .upsert({
                    phone_number: phoneNumber,
                    full_name: fullName.trim(),
                    city: city.trim(),
                    is_profile_complete: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'phone_number' });

            if (error) throw error;

            toast.success('Welcome to PickMyCar!');
            onComplete();
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error(error.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} modal>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()} // Prevent closing
                onEscapeKeyDown={(e) => e.preventDefault()} // Prevent closing
            >
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-3xl">🚗</span>
                    </div>
                    <DialogTitle className="text-2xl">Welcome to PickMyCar!</DialogTitle>
                    <DialogDescription className="text-base">
                        Let's set up your profile in just 30 seconds
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Your Name
                        </Label>
                        <Input
                            id="fullName"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="h-12 text-lg"
                            autoFocus
                        />
                    </div>

                    {/* Location Detection */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Your City
                            {locationStatus === 'detecting' && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Detecting...
                                </span>
                            )}
                            {locationStatus === 'detected' && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Detected
                                </span>
                            )}
                        </Label>

                        <Select value={city} onValueChange={setCity}>
                            <SelectTrigger className="h-12 text-lg">
                                <SelectValue placeholder="Select your city" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {INDIAN_CITIES.map((cityName) => (
                                    <SelectItem key={cityName} value={cityName}>
                                        {cityName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {locationStatus === 'error' && (
                            <button
                                type="button"
                                onClick={detectLocation}
                                className="text-sm text-primary hover:underline"
                            >
                                📍 Retry location detection
                            </button>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={loading || !fullName.trim() || !city.trim()}
                    className="w-full h-12 text-lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue to Browse 🚗
                        </>
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default OnboardingModal;
