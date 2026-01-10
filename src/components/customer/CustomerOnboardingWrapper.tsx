import { useAuth } from '@/contexts/AuthContext';
import OnboardingModal from '@/components/customer/OnboardingModal';

interface CustomerOnboardingWrapperProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that shows the onboarding modal for new customers
 * who haven't completed their profile yet.
 */
export function CustomerOnboardingWrapper({ children }: CustomerOnboardingWrapperProps) {
    const { isCustomerSession, isProfileComplete, customerPhone, completeCustomerProfile } = useAuth();

    // Only show onboarding for customers with incomplete profiles
    const showOnboarding = isCustomerSession && !isProfileComplete && customerPhone;

    return (
        <>
            {children}
            <OnboardingModal
                isOpen={!!showOnboarding}
                phoneNumber={customerPhone || ''}
                onComplete={completeCustomerProfile}
            />
        </>
    );
}

export default CustomerOnboardingWrapper;
