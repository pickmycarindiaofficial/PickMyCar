import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StaffAccount {
    id: string;
    username: string;
    full_name: string;
    email: string | null;
    phone_number: string;
    role: 'powerdesk' | 'dealer' | 'sales' | 'finance' | 'inspection' | 'website_manager';
    is_active: boolean;
    is_locked: boolean;
    failed_login_attempts: number;
    last_login_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateStaffInput {
    username: string;
    password: string;
    full_name: string;
    phone_number: string;
    role: StaffAccount['role'];
    email?: string;
    created_by?: string;
}

export interface UpdateStaffInput {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
    role?: StaffAccount['role'];
    is_active?: boolean;
    is_locked?: boolean;
}

export interface VerifyPasswordResult {
    staff_id: string | null;
    full_name: string | null;
    role: string | null;
    phone_number: string | null;
    is_locked: boolean;
    is_valid: boolean;
}

// Fetch all staff accounts
export function useStaffAccounts() {
    return useQuery({
        queryKey: ['staff-accounts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff_accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as StaffAccount[];
        },
    });
}

// Fetch staff by role
export function useStaffByRole(role: StaffAccount['role']) {
    return useQuery({
        queryKey: ['staff-accounts', role],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff_accounts')
                .select('*')
                .eq('role', role)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as StaffAccount[];
        },
    });
}

// Create staff account
export function useCreateStaffAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateStaffInput) => {
            const { data, error } = await supabase.rpc('create_staff_account', {
                p_username: input.username,
                p_password: input.password,
                p_full_name: input.full_name,
                p_phone_number: input.phone_number,
                p_role: input.role,
                p_email: input.email || null,
                p_created_by: input.created_by || null,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-accounts'] });
            toast.success('Staff account created successfully');
        },
        onError: (error: any) => {
            console.error('Error creating staff:', error);
            if (error.message?.includes('duplicate')) {
                toast.error('Username already exists');
            } else {
                toast.error(error.message || 'Failed to create staff account');
            }
        },
    });
}

// Update staff account
export function useUpdateStaffAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateStaffInput) => {
            const { id, ...updates } = input;
            const { data, error } = await supabase
                .from('staff_accounts')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-accounts'] });
            toast.success('Staff account updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update staff account');
        },
    });
}

// Reset staff password
export function useResetStaffPassword() {
    return useMutation({
        mutationFn: async ({ staffId, newPassword }: { staffId: string; newPassword: string }) => {
            const { error } = await supabase.rpc('update_staff_password', {
                p_staff_id: staffId,
                p_new_password: newPassword,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Password reset successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reset password');
        },
    });
}

// Toggle staff lock status
export function useToggleStaffLock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ staffId, lock }: { staffId: string; lock: boolean }) => {
            const { error } = await supabase
                .from('staff_accounts')
                .update({
                    is_locked: lock,
                    failed_login_attempts: lock ? 5 : 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', staffId);

            if (error) throw error;

            // Log the action
            await supabase.rpc('log_staff_login', {
                p_staff_id: staffId,
                p_username: null,
                p_action: lock ? 'account_locked' : 'account_unlocked',
            });
        },
        onSuccess: (_, { lock }) => {
            queryClient.invalidateQueries({ queryKey: ['staff-accounts'] });
            toast.success(lock ? 'Account locked' : 'Account unlocked');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update lock status');
        },
    });
}

// Verify staff password (for login)
export async function verifyStaffPassword(username: string, password: string): Promise<VerifyPasswordResult> {
    const { data, error } = await supabase.rpc('verify_staff_password', {
        p_username: username,
        p_password: password,
    });

    if (error) throw error;

    // RPC returns an array, get first result
    const result = Array.isArray(data) ? data[0] : data;
    return result as VerifyPasswordResult;
}

// Check if username exists
export async function checkStaffUsernameExists(username: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('staff_account_exists', {
        p_username: username,
    });

    if (error) throw error;
    return data as boolean;
}

// Get staff by username
export async function getStaffByUsername(username: string) {
    const { data, error } = await supabase.rpc('get_staff_by_username', {
        p_username: username,
    });

    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
}

// Record failed login
export async function recordStaffFailedLogin(staffId: string) {
    await supabase.rpc('record_staff_failed_login', { p_staff_id: staffId });
}

// Record successful login
export async function recordStaffSuccessfulLogin(staffId: string) {
    await supabase.rpc('record_staff_successful_login', { p_staff_id: staffId });
}

// Log login attempt
export async function logStaffLogin(
    staffId: string | null,
    username: string,
    action: string,
    failureReason?: string
) {
    await supabase.rpc('log_staff_login', {
        p_staff_id: staffId,
        p_username: username,
        p_action: action,
        p_failure_reason: failureReason || null,
    });
}
