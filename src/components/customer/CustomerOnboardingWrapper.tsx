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
    const { isCustomerSession, isProfileComplete, customerPhone, completeCustomerProfile, roles } = useAuth();

    // specific roles that have dashboard access and should NOT see the onboarding
    const dashboardRoles = ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection'];

    const hasDashboardAccess = roles.some(role => dashboardRoles.includes(role));

    // Only show onboarding for customers with incomplete profiles AND no dashboard access
    const showOnboarding = isCustomerSession && !isProfileComplete && customerPhone && !hasDashboardAccess;

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
