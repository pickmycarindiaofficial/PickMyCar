import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeSessionStorage } from '@/lib/utils';

// Session token storage key
const SESSION_TOKEN_KEY = 'pmc_staff_token';

type StaffAction = 'create' | 'update' | 'delete' | 'read';
type AllowedTable = 'banners' | 'cars' | 'leads' | 'dealers' | 'enquiries' | 'test_drives';

interface SecureApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Secure API hook for staff operations.
 * All operations go through the staff-manage-data Edge Function
 * which validates the staff session and uses Service Role Key.
 */
export function useSecureStaffApi() {
    const getToken = useCallback((): string | null => {
        return safeSessionStorage.getItem(SESSION_TOKEN_KEY);
    }, []);

    const secureRequest = useCallback(async <T = any>(
        action: StaffAction,
        table: AllowedTable,
        data?: Record<string, any>,
        id?: string
    ): Promise<SecureApiResponse<T>> => {
        const token = getToken();

        if (!token) {
            return { success: false, error: 'Not authenticated. Please login again.' };
        }

        try {
            const { data: response, error } = await supabase.functions.invoke('staff-manage-data', {
                body: { action, table, data, id },
                headers: {
                    'x-staff-token': token,
                },
            });

            if (error) {
                return { success: false, error: error.message };
            }

            if (response?.error) {
                return { success: false, error: response.error };
            }

            return { success: true, data: response?.data };
        } catch (err: any) {
            console.error('Secure API error:', err);
            return { success: false, error: err.message || 'Request failed' };
        }
    }, [getToken]);

    // Convenience methods
    const create = useCallback(<T = any>(table: AllowedTable, data: Record<string, any>) => {
        return secureRequest<T>('create', table, data);
    }, [secureRequest]);

    const update = useCallback(<T = any>(table: AllowedTable, id: string, data: Record<string, any>) => {
        return secureRequest<T>('update', table, data, id);
    }, [secureRequest]);

    const remove = useCallback((table: AllowedTable, id: string) => {
        return secureRequest('delete', table, undefined, id);
    }, [secureRequest]);

    const read = useCallback(<T = any>(table: AllowedTable, id?: string) => {
        return secureRequest<T>('read', table, undefined, id);
    }, [secureRequest]);

    return {
        secureRequest,
        create,
        update,
        remove,
        read,
        getToken,
    };
}

export default useSecureStaffApi;
