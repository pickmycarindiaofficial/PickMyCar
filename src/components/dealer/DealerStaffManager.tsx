import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    UserPlus,
    MoreVertical,
    Lock,
    Unlock,
    Pencil,
    Loader2,
    Shield,
    Check,
    X,
    MessageSquare,
    Car,
} from 'lucide-react';
import {
    useDealerStaff,
    useCreateStaffAccount,
    useUpdateStaffPermissions,
    useToggleStaffLock,
    StaffAccount,
    CreateStaffInput,
} from '@/hooks/useStaffAccounts';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function DealerStaffManager() {
    const { user } = useAuth();
    // Assuming user.id is the dealer_id since this component is for dealers
    const dealerId = user?.id;

    const { data: staffList, isLoading } = useDealerStaff(dealerId || null);
    const createStaff = useCreateStaffAccount();
    const updatePermissions = useUpdateStaffPermissions();
    const toggleLock = useToggleStaffLock();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);

    // Create form state
    const [createForm, setCreateForm] = useState<CreateStaffInput>({
        username: '',
        password: 'temp_password', // Not used for dealer staff login (OTP based), but required by helper
        full_name: '',
        phone_number: '',
        role: 'dealer_staff',
        dealer_id: dealerId || undefined,
        permissions: {
            manage_listings: true,
            view_leads: false,
        },
    });

    // Edit permissions state
    const [editPermissions, setEditPermissions] = useState({
        manage_listings: false,
        view_leads: false,
    });

    const handleCreate = async () => {
        if (!createForm.username || !createForm.full_name || !createForm.phone_number) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate phone number (basic check)
        if (!/^\+91[6-9]\d{9}$/.test(createForm.phone_number)) {
            toast.error('Please enter a valid Indian mobile number starting with +91');
            return;
        }

        await createStaff.mutateAsync({
            ...createForm,
            role: 'dealer_staff', // Enforce role
            dealer_id: dealerId,
            password: Math.random().toString(36).slice(-8), // Random dummy password
        });
        setIsCreateOpen(false);
        setCreateForm({
            username: '',
            password: 'temp_password',
            full_name: '',
            phone_number: '',
            role: 'dealer_staff',
            dealer_id: dealerId,
            permissions: { manage_listings: true, view_leads: false },
        });
    };

    const handleUpdatePermissions = async () => {
        if (!selectedStaff) return;
        await updatePermissions.mutateAsync({
            staffId: selectedStaff.id,
            permissions: editPermissions,
        });
        setIsEditOpen(false);
    };

    const openEdit = (staff: StaffAccount) => {
        setSelectedStaff(staff);
        setEditPermissions(staff.permissions || { manage_listings: false, view_leads: false });
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        Team Management
                    </h2>
                    <p className="text-muted-foreground">Manage your staff access and permissions</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Staff Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Team Member</DialogTitle>
                            <DialogDescription>
                                Create an account for your staff. They will login using their username and OTP sent to WhatsApp.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    placeholder="e.g. Rahul Sharma"
                                    value={createForm.full_name}
                                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    placeholder="e.g. rahul_sales"
                                    value={createForm.username}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                        })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">Used for login. Lowercase letters only.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>WhatsApp Number</Label>
                                <Input
                                    placeholder="+919876543210"
                                    value={createForm.phone_number}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        // Auto-prefix +91 if not present and typing numbers
                                        if (val.length === 1 && /^[6-9]$/.test(val)) {
                                            val = '+91' + val;
                                        }
                                        setCreateForm({ ...createForm, phone_number: val });
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">OTP will be sent to this number via WhatsApp.</p>
                            </div>

                            <div className="space-y-3 pt-2 border-t">
                                <Label className="text-base">Access Permissions</Label>

                                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4 text-blue-500" />
                                            <Label className="text-sm font-medium">Manage Car Listings</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Add, edit, and delete car inventory</p>
                                    </div>
                                    <Switch
                                        checked={createForm.permissions?.manage_listings}
                                        onCheckedChange={(v) =>
                                            setCreateForm({
                                                ...createForm,
                                                permissions: { ...createForm.permissions!, manage_listings: v },
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-green-500" />
                                            <Label className="text-sm font-medium">View Leads & Queries</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Access customer enquiries and messages</p>
                                    </div>
                                    <Switch
                                        checked={createForm.permissions?.view_leads}
                                        onCheckedChange={(v) =>
                                            setCreateForm({
                                                ...createForm,
                                                permissions: { ...createForm.permissions!, view_leads: v },
                                            })
                                        }
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

            <Card>
                <CardHeader>
                    <CardTitle>Staff Members ({staffList?.length || 0})</CardTitle>
                    <CardDescription>Manage your team's access to the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Username (Login ID)</TableHead>
                                        <TableHead>Permissions</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffList?.map((staff) => (
                                        <TableRow key={staff.id}>
                                            <TableCell>
                                                <div className="font-medium">{staff.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{staff.phone_number}</div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{staff.username}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {staff.permissions?.manage_listings && (
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                                            <Car className="h-3 w-3" /> Inventory
                                                        </Badge>
                                                    )}
                                                    {staff.permissions?.view_leads && (
                                                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                                            <MessageSquare className="h-3 w-3" /> Leads
                                                        </Badge>
                                                    )}
                                                    {!staff.permissions?.manage_listings && !staff.permissions?.view_leads && (
                                                        <span className="text-xs text-muted-foreground italic">No access</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {staff.is_locked ? (
                                                    <Badge variant="destructive">Locked</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                                )}
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
                                                            Edit Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className={staff.is_locked ? "text-green-600" : "text-amber-600"}
                                                            onClick={() => toggleLock.mutate({ staffId: staff.id, lock: !staff.is_locked })}
                                                        >
                                                            {staff.is_locked ? (
                                                                <>
                                                                    <Unlock className="mr-2 h-4 w-4" /> Unlock Account
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Lock className="mr-2 h-4 w-4" /> Lock Account
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {staffList?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No staff members added yet. Add someone to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Permissions</DialogTitle>
                        <DialogDescription>
                            Change access levels for <b>{selectedStaff?.full_name}</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label>Manage Car Listings</Label>
                                <p className="text-xs text-muted-foreground">Add, edit, delete cars</p>
                            </div>
                            <Switch
                                checked={editPermissions.manage_listings}
                                onCheckedChange={(v) => setEditPermissions({ ...editPermissions, manage_listings: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label>View Leads</Label>
                                <p className="text-xs text-muted-foreground">My leads and team leads</p>
                            </div>
                            <Switch
                                checked={editPermissions.view_leads}
                                onCheckedChange={(v) => setEditPermissions({ ...editPermissions, view_leads: v })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdatePermissions} disabled={updatePermissions.isPending}>
                            {updatePermissions.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
