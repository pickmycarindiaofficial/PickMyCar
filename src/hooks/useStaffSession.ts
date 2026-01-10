import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffSession {
    staffId: string;
    username: string;
    role: string;
    fullName: string;
    sessionId: string;
    token: string;
}

interface UseStaffSessionReturn {
    session: StaffSession | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    createSession: (staffId: string, username: string, role: string, fullName: string) => Promise<string>;
    validateSession: () => Promise<boolean>;
    revokeSession: () => Promise<void>;
    getSessionToken: () => string | null;
}

// Generate a secure random token
const generateToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash token using SHA-256
const hashToken = async (token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Session token storage key
const SESSION_TOKEN_KEY = 'pmc_staff_token';

export function useStaffSession(): UseStaffSessionReturn {
    const [session, setSession] = useState<StaffSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get token from sessionStorage (secure - cleared on browser close)
    const getSessionToken = useCallback((): string | null => {
        return sessionStorage.getItem(SESSION_TOKEN_KEY);
    }, []);

    // Create a new session after successful OTP verification
    const createSession = useCallback(async (
        staffId: string,
        username: string,
        role: string,
        fullName: string
    ): Promise<string> => {
        const token = generateToken();
        const tokenHash = await hashToken(token);

        const { data, error } = await supabase.rpc('create_staff_session', {
            p_staff_id: staffId,
            p_token_hash: tokenHash,
            p_ip_address: null, // Could be captured server-side
            p_user_agent: navigator.userAgent,
            p_expires_hours: 8,
        });

        if (error) throw error;

        // Store token in sessionStorage (NOT localStorage)
        sessionStorage.setItem(SESSION_TOKEN_KEY, token);

        const newSession: StaffSession = {
            staffId,
            username,
            role,
            fullName,
            sessionId: data,
            token,
        };
        setSession(newSession);

        return token;
    }, []);

    // Validate current session
    const validateSession = useCallback(async (): Promise<boolean> => {
        const token = getSessionToken();
        if (!token) {
            setSession(null);
            setIsLoading(false);
            return false;
        }

        try {
            const tokenHash = await hashToken(token);
            const { data, error } = await supabase.rpc('validate_staff_session', {
                p_token_hash: tokenHash,
            });

            if (error) throw error;

            const result = Array.isArray(data) ? data[0] : data;

            if (result?.is_valid) {
                setSession({
                    staffId: result.staff_id,
                    username: result.username,
                    role: result.role,
                    fullName: result.full_name,
                    sessionId: result.session_id,
                    token,
                });
                setIsLoading(false);
                return true;
            } else {
                // Invalid session - clear token
                sessionStorage.removeItem(SESSION_TOKEN_KEY);
                setSession(null);
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            console.error('Session validation error:', error);
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
            setSession(null);
            setIsLoading(false);
            return false;
        }
    }, [getSessionToken]);

    // Revoke session (logout)
    const revokeSession = useCallback(async (): Promise<void> => {
        const token = getSessionToken();
        if (token) {
            try {
                const tokenHash = await hashToken(token);
                await supabase.rpc('revoke_staff_session', {
                    p_token_hash: tokenHash,
                });
            } catch (error) {
                console.error('Error revoking session:', error);
            }
        }
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        setSession(null);
    }, [getSessionToken]);

    // Validate session on mount
    useEffect(() => {
        validateSession();
    }, [validateSession]);

    return {
        session,
        isLoading,
        isAuthenticated: !!session,
        createSession,
        validateSession,
        revokeSession,
        getSessionToken,
    };
}

export default useStaffSession;
