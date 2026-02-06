import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, UserProfile } from '@/types/auth';

// Session token storage keys
const SESSION_TOKEN_KEY = 'pmc_staff_token';
const CUSTOMER_TOKEN_KEY = 'pmc_customer_token';
const CUSTOMER_PHONE_KEY = 'pmc_customer_phone';
const DEALER_TOKEN_KEY = 'dealer_token';
const DEALER_INFO_KEY = 'dealer_info';

interface StaffSessionData {
  staffId: string;
  username: string;
  role: string;
  fullName: string;
  sessionId: string;
  permissions?: {
    manage_listings: boolean;
    view_leads: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  loading: boolean;
  isStaffSession: boolean;
  staffSession: StaffSessionData | null;
  isCustomerSession: boolean;
  customerPhone: string | null;
  isProfileComplete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, username: string, password: string, fullName: string, phoneNumber: string, role: AppRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  createStaffSession: (staffId: string, username: string, role: string, fullName: string) => Promise<string>;
  validateStaffSession: () => Promise<boolean>;
  completeCustomerProfile: () => void;
  loginDealerStaff: (data: StaffSessionData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { hashToken, generateToken } from '@/lib/auth-utils';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaffSession, setIsStaffSession] = useState(false);
  const [staffSession, setStaffSession] = useState<StaffSessionData | null>(null);
  const [isCustomerSession, setIsCustomerSession] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(true); // Default true, false only for incomplete customers

  // Get token from sessionStorage
  const getSessionToken = useCallback((): string | null => {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  }, []);

  // Validate staff session with server
  const validateStaffSession = useCallback(async (): Promise<boolean> => {
    const token = getSessionToken();
    if (!token) {
      return false;
    }

    try {
      const tokenHash = await hashToken(token);
      const { data, error } = await (supabase.rpc as any)('validate_staff_session', {
        p_token_hash: tokenHash,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (result?.is_valid) {
        const staffData: StaffSessionData = {
          staffId: result.staff_id,
          username: result.username,
          role: result.role,
          fullName: result.full_name,
          sessionId: result.session_id,
        };

        setStaffSession(staffData);
        setIsStaffSession(true);
        setRoles([result.role as AppRole]);

        // Create mock user for ProtectedRoute compatibility
        const mockUser = {
          id: result.staff_id,
          email: `${result.username}@staff.carcrm.com`,
          user_metadata: {
            full_name: result.full_name,
            is_staff: true,
          },
        } as unknown as User;
        setUser(mockUser);

        setProfile({
          id: result.staff_id,
          username: result.username,
          full_name: result.full_name,
        } as UserProfile);

        return true;
      } else {
        // Invalid session - clear token
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        setStaffSession(null);
        setIsStaffSession(false);
        return false;
      }
    } catch (error) {
      console.error('Staff session validation error:', error);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setStaffSession(null);
      setIsStaffSession(false);
      return false;
    }
  }, [getSessionToken]);

  // Create new staff session after OTP verification
  const createStaffSession = useCallback(async (
    staffId: string,
    username: string,
    role: string,
    fullName: string
  ): Promise<string> => {
    const token = generateToken();
    const tokenHash = await hashToken(token);

    const { data, error } = await (supabase.rpc as any)('create_staff_session', {
      p_staff_id: staffId,
      p_token_hash: tokenHash,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_expires_hours: 8,
    });

    if (error) throw error;

    // Store token in sessionStorage (NOT localStorage)
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);

    const staffData: StaffSessionData = {
      staffId,
      username,
      role,
      fullName,
      sessionId: data,
    };

    setStaffSession(staffData);
    setIsStaffSession(true);
    setRoles([role as AppRole]);

    // Create mock user for compatibility
    const mockUser = {
      id: staffId,
      email: `${username}@staff.carcrm.com`,
      user_metadata: { full_name: fullName, is_staff: true },
    } as unknown as User;
    setUser(mockUser);

    setProfile({
      id: staffId,
      username,
      full_name: fullName,
    } as UserProfile);

    return token;
  }, []);

  const loginDealerStaff = useCallback(async (data: StaffSessionData): Promise<void> => {
    // 1. Store in localStorage
    localStorage.setItem('staff_session', JSON.stringify(data));

    // 2. Create mock user
    const mockUser = {
      id: data.staffId,
      email: `${data.username}@staff.dealer.pickmycar.in`,
      user_metadata: {
        is_staff: true,
        is_dealer_staff: true,
        full_name: data.fullName,
        dealer_id: data.permissions // DealerID is not in permissions, check where it is in data
      }
    } as unknown as User;

    // 3. Update State
    setUser(mockUser);
    setRoles([data.role as AppRole]);
    setIsStaffSession(true);
    setStaffSession({
      ...data,
      sessionId: 'local-session'
    });
    setProfile({
      id: data.staffId,
      username: data.username,
      full_name: data.fullName,
    } as any);

    setLoading(false);
  }, []);

  useEffect(() => {
    // Check for dealer session (stored in localStorage by DealerLogin)
    // Check for dealer session (stored in localStorage by DealerLogin)
    const checkDealerSession = async () => {
      const dealerToken = localStorage.getItem(DEALER_TOKEN_KEY);
      const dealerInfoStr = localStorage.getItem(DEALER_INFO_KEY);

      if (dealerToken && dealerInfoStr) {
        try {
          const dealerInfo = JSON.parse(dealerInfoStr);
          console.log('[AuthContext] Found dealer session:', dealerInfo.dealership_name);

          // Create mock user for dealer
          const mockUser = {
            id: dealerInfo.id,
            email: `${dealerInfo.username}@dealer.pickmycar.in`,
            user_metadata: {
              is_dealer: true,
              dealership_name: dealerInfo.dealership_name,
              owner_name: dealerInfo.owner_name,
            },
          } as unknown as User;

          setUser(mockUser);
          setRoles(['dealer' as AppRole]);
          setProfile({
            id: dealerInfo.id,
            username: dealerInfo.username,
            full_name: dealerInfo.owner_name,
          } as unknown as UserProfile);
          setLoading(false);
          return true;
        } catch (e) {
          console.error('[AuthContext] Error parsing dealer info:', e);
          localStorage.removeItem(DEALER_TOKEN_KEY);
          localStorage.removeItem(DEALER_INFO_KEY);
        }
      }
      return false;
    };

    // NEW: Check for Dealer STAFF session
    const checkDealerStaffSession = () => {
      const staffSessionStr = localStorage.getItem('staff_session');
      if (staffSessionStr) {
        try {
          const session = JSON.parse(staffSessionStr);

          // Create mock user for dealer staff
          const mockUser = {
            id: session.staffId,
            email: `${session.username}@staff.dealer.pickmycar.in`,
            user_metadata: {
              is_staff: true,
              is_dealer_staff: true,
              full_name: session.fullName,
              dealer_id: session.dealerId
            }
          } as unknown as User;

          setUser(mockUser);
          setRoles([session.role as AppRole]);
          setIsStaffSession(true);
          setStaffSession({
            staffId: session.staffId,
            username: session.username,
            role: session.role,
            fullName: session.fullName,
            permissions: session.permissions,
            sessionId: 'local-session'
          });
          setProfile({
            id: session.staffId,
            username: session.username,
            full_name: session.fullName,
            // role: session.role
          } as any);

          setLoading(false);
          return true;

        } catch (e) {
          console.error('Error parsing staff session', e);
          localStorage.removeItem('staff_session');
        }
      }
      return false;
    };

    // Check for customer session token first
    const checkCustomerSession = async () => {
      const customerToken = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
      const phone = sessionStorage.getItem(CUSTOMER_PHONE_KEY);

      if (customerToken && phone) {
        // Check if profile exists and is complete
        const { data: customerProfile } = await (supabase as any)
          .from('customer_profiles')
          .select('*')
          .eq('phone_number', phone)
          .single();

        const profileComplete = customerProfile?.is_profile_complete ?? false;

        // Create mock user for customer
        const mockUser = {
          id: customerProfile?.id || `customer_${phone}`,
          email: `${phone}@customer.pickmycar.in`,
          user_metadata: {
            phone_number: phone,
            is_customer: true,
            full_name: customerProfile?.full_name,
          },
        } as unknown as User;

        setUser(mockUser);
        setRoles(['user' as AppRole]);
        setCustomerPhone(phone);
        setIsCustomerSession(true);
        setIsProfileComplete(profileComplete);
        setProfile({
          id: customerProfile?.id || `customer_${phone}`,
          phone_number: phone,
          full_name: customerProfile?.full_name,
          city: customerProfile?.city,
        } as unknown as UserProfile);
        setLoading(false);
        return true;
      }
      return false;
    };

    // Set up auth state listener for customer auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (session?.user) {
          setUser(session.user);
          setIsStaffSession(false);
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else if (!isStaffSession) {
          // No Supabase session - check for staff session
          validateStaffSession().finally(() => setLoading(false));
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        // No Supabase session - check dealer, then customer, then staff
        const hasDealerSession = await checkDealerSession();
        if (!hasDealerSession) {
          const hasStaffSession = checkDealerStaffSession(); // NEW check
          if (!hasStaffSession) {
            const hasCustomerSession = await checkCustomerSession();
            if (!hasCustomerSession) {
              validateStaffSession().finally(() => setLoading(false));
            }
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [validateStaffSession, isStaffSession]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      const { data: rolesData, error: rolesError } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;
      setRoles((rolesData || []).map((r: any) => r.role as AppRole));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    username: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    role: AppRole
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { username, full_name: fullName, phone_number: phoneNumber, role },
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Clear staff session if exists
    const token = getSessionToken();
    if (token) {
      try {
        const tokenHash = await hashToken(token);
        await (supabase.rpc as any)('revoke_staff_session', { p_token_hash: tokenHash });
      } catch (error) {
        console.error('Error revoking staff session:', error);
      }
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }

    // Clear customer session tokens
    sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
    sessionStorage.removeItem(CUSTOMER_PHONE_KEY);

    // Clear dealer session tokens
    localStorage.removeItem(DEALER_TOKEN_KEY);
    localStorage.removeItem(DEALER_INFO_KEY);
    localStorage.removeItem('staff_session'); // NEW: Clear staff session

    // Clear Supabase session
    await supabase.auth.signOut();

    // Reset all state
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setStaffSession(null);
    setIsStaffSession(false);
    setIsCustomerSession(false);
    setCustomerPhone(null);
    setIsProfileComplete(true);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  // Mark customer profile as complete (called after onboarding)
  const completeCustomerProfile = useCallback(() => {
    setIsProfileComplete(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        isStaffSession,
        staffSession,
        isCustomerSession,
        customerPhone,
        isProfileComplete,
        signIn,
        signUp,
        signOut,
        hasRole,
        createStaffSession,
        validateStaffSession,
        completeCustomerProfile,
        loginDealerStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
