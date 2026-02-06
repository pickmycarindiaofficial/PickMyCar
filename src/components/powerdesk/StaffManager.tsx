import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    UserPlus,
    MoreVertical,
    Lock,
    Unlock,
    KeyRound,
    Pencil,
    Loader2,
    Shield,
    Users,
    Search,
    Eye,
    EyeOff,
} from 'lucide-react';
import {
    useStaffAccounts,
    useCreateStaffAccount,
    useUpdateStaffAccount,
    useResetStaffPassword,
    useToggleStaffLock,
    StaffAccount,
    CreateStaffInput,
} from '@/hooks/useStaffAccounts';
import { format } from 'date-fns';

const ROLE_OPTIONS: { value: StaffAccount['role']; label: string; color: string }[] = [
    { value: 'powerdesk', label: 'PowerDesk Admin', color: 'bg-purple-100 text-purple-800' },
    { value: 'dealer', label: 'Dealer', color: 'bg-blue-100 text-blue-800' },
    { value: 'sales', label: 'Sales', color: 'bg-green-100 text-green-800' },
    { value: 'finance', label: 'Finance', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'inspection', label: 'Inspection', color: 'bg-orange-100 text-orange-800' },
    { value: 'website_manager', label: 'Website Manager', color: 'bg-pink-100 text-pink-800' },
];

const getRoleConfig = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[1];
};

export function StaffManager() {
    const { data: staffList, isLoading } = useStaffAccounts();
    const createStaff = useCreateStaffAccount();
    const updateStaff = useUpdateStaffAccount();
    const resetPassword = useResetStaffPassword();
    const toggleLock = useToggleStaffLock();

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Create form state
    const [createForm, setCreateForm] = useState<CreateStaffInput>({
        username: '',
        password: '',
        full_name: '',
        phone_number: '',
        role: 'dealer',
        email: '',
    });

    // Edit form state
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'dealer' as StaffAccount['role'],
        is_active: true,
    });

    // Reset password state
    const [newPassword, setNewPassword] = useState('');

    const filteredStaff = staffList?.filter((staff) => {
        const matchesSearch =
            staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.phone_number.includes(searchTerm);
        const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleCreate = async () => {
        if (!createForm.username || !createForm.password || !createForm.full_name || !createForm.phone_number) {
            return;
        }

        await createStaff.mutateAsync(createForm);
        setIsCreateOpen(false);
        setCreateForm({
            username: '',
            password: '',
            full_name: '',
            phone_number: '',
            role: 'dealer',
            email: '',
        });
    };

    const handleEdit = async () => {
        if (!selectedStaff) return;

        await updateStaff.mutateAsync({
            id: selectedStaff.id,
            ...editForm,
        });
        setIsEditOpen(false);
    };

    const handleResetPassword = async () => {
        if (!selectedStaff || !newPassword) return;

        await resetPassword.mutateAsync({
            staffId: selectedStaff.id,
            newPassword,
        });
        setIsResetOpen(false);
        setNewPassword('');
    };

    const openEdit = (staff: StaffAccount) => {
        setSelectedStaff(staff);
        setEditForm({
            full_name: staff.full_name,
            email: staff.email || '',
            phone_number: staff.phone_number,
            role: staff.role,
            is_active: staff.is_active,
        });
        setIsEditOpen(true);
    };

    const openResetPassword = (staff: StaffAccount) => {
        setSelectedStaff(staff);
        setNewPassword('');
        setIsResetOpen(true);
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Staff Manager
                    </h2>
                    <p className="text-muted-foreground">Create and manage staff accounts</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create Staff Account</DialogTitle>
                            <DialogDescription>
                                Add a new staff member to the system
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={createForm.full_name}
                                        onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role *</Label>
                                    <Select
                                        value={createForm.role}
                                        onValueChange={(v) => setCreateForm({ ...createForm, role: v as StaffAccount['role'] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Username *</Label>
                                <Input
                                    placeholder="johndoe"
                                    value={createForm.username}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                        })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, underscores</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Password *</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Strong password"
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCreateForm({ ...createForm, password: generatePassword() })}
                                    >
                                        Generate
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone Number *</Label>
                                    <div className="flex gap-1">
                                        <span className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 text-sm">
                                            +91
                                        </span>
                                        <Input
                                            placeholder="9876543210"
                                            value={createForm.phone_number.replace('+91', '')}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    phone_number: '+91' + e.target.value.replace(/\D/g, '').slice(0, 10),
                                                })
                                            }
                                            className="rounded-l-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={createStaff.isPending}>
                                {createStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, username, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {ROLE_OPTIONS.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Staff List */}
            <Card>
                <CardHeader>
                    <CardTitle>Staff Accounts ({filteredStaff?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Desktop View - Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Staff</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Login</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStaff?.map((staff) => {
                                            const roleConfig = getRoleConfig(staff.role);
                                            return (
                                                <TableRow key={staff.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                {staff.role === 'powerdesk' ? (
                                                                    <Shield className="h-5 w-5 text-primary" />
                                                                ) : (
                                                                    <span className="font-medium text-primary">
                                                                        {staff.full_name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{staff.full_name}</p>
                                                                <p className="text-xs text-muted-foreground">{staff.email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">{staff.username}</TableCell>
                                                    <TableCell>
                                                        <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
                                                    </TableCell>
                                                    <TableCell>{staff.phone_number}</TableCell>
                                                    <TableCell>
                                                        {staff.is_locked ? (
                                                            <Badge variant="destructive">Locked</Badge>
                                                        ) : staff.is_active ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {staff.last_login_at
                                                            ? format(new Date(staff.last_login_at), 'dd MMM, HH:mm')
                                                            : 'Never'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEdit(staff)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openResetPassword(staff)}>
                                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                                    Reset Password
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        toggleLock.mutate({ staffId: staff.id, lock: !staff.is_locked })
                                                                    }
                                                                >
                                                                    {staff.is_locked ? (
                                                                        <>
                                                                            <Unlock className="mr-2 h-4 w-4" />
                                                                            Unlock Account
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Lock className="mr-2 h-4 w-4" />
                                                                            Lock Account
                                                                        </>
                                                                    )}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {filteredStaff?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No staff accounts found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile View - Cards */}
                            <div className="md:hidden space-y-4">
                                {filteredStaff?.map((staff) => {
                                    const roleConfig = getRoleConfig(staff.role);
                                    return (
                                        <div key={staff.id} className="bg-white rounded-lg border p-4 shadow-sm space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        {staff.role === 'powerdesk' ? (
                                                            <Shield className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <span className="font-medium text-primary">
                                                                {staff.full_name.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{staff.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{staff.username}</p>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="-mr-2">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEdit(staff)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openResetPassword(staff)}>
                                                            <KeyRound className="mr-2 h-4 w-4" />
                                                            Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                toggleLock.mutate({ staffId: staff.id, lock: !staff.is_locked })
                                                            }
                                                        >
                                                            {staff.is_locked ? (
                                                                <>
                                                                    <Unlock className="mr-2 h-4 w-4" />
                                                                    Unlock Account
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Lock className="mr-2 h-4 w-4" />
                                                                    Lock Account
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="space-y-1">
                                                    <p className="text-muted-foreground text-xs">Role</p>
                                                    <Badge className={roleConfig.color} variant="secondary">{roleConfig.label}</Badge>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-muted-foreground text-xs">Status</p>
                                                    <div>
                                                        {staff.is_locked ? (
                                                            <Badge variant="destructive" className="h-5">Locked</Badge>
                                                        ) : staff.is_active ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-5">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-gray-50 text-gray-500 h-5">
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Phone</p>
                                                    <p>{staff.phone_number}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-muted-foreground text-xs">Last Login</p>
                                                    <p>{staff.last_login_at
                                                        ? format(new Date(staff.last_login_at), 'dd MMM, HH:mm')
                                                        : 'Never'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredStaff?.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                        No staff accounts found
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Staff Account</DialogTitle>
                        <DialogDescription>Update details for {selectedStaff?.full_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={editForm.role}
                                onValueChange={(v) => setEditForm({ ...editForm, role: v as StaffAccount['role'] })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLE_OPTIONS.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                value={editForm.phone_number}
                                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Account Active</Label>
                            <Switch
                                checked={editForm.is_active}
                                onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={updateStaff.isPending}>
                            {updateStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {selectedStaff?.full_name} ({selectedStaff?.username})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button type="button" variant="outline" onClick={() => setNewPassword(generatePassword())}>
                                    Generate
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleResetPassword} disabled={resetPassword.isPending || !newPassword}>
                            {resetPassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default StaffManager;
