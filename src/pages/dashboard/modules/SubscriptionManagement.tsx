import { useState } from 'react';
import { useAllSubscriptionPlans, useCreateSubscriptionPlan, useUpdateSubscriptionPlan, useDeleteSubscriptionPlan, useTogglePlanStatus, SubscriptionPlan } from '@/hooks/useSubscriptionPlans';
import { useAllDealerSubscriptions, useManuallyActivateSubscription } from '@/hooks/useDealerSubscription';
import { useDealers } from '@/hooks/useDealers';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, CheckCircle, XCircle, X, DollarSign, BarChart3, Settings2, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const planSchema = z.object({
  name: z.string().min(1, 'Plan ID is required').regex(/^[a-z_]+$/, 'Use lowercase letters and underscores only'),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().min(10, 'Add a subtitle (min 10 characters)'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('INR'),
  billing_period: z.enum(['monthly', 'quarterly', 'half_yearly', 'annual']),
  listing_limit: z.number().min(1, 'Must allow at least 1 listing'),
  featured_ads_limit: z.number().min(0, 'Must be 0 or more'),
  features: z.array(z.string().min(1, 'Feature cannot be empty')).min(1, 'Add at least one feature'),
  is_popular: z.boolean().default(false),
  sort_order: z.number().default(0),
});

const activationSchema = z.object({
  dealer_id: z.string().uuid('Select a dealer'),
  plan_id: z.string().uuid('Select a plan'),
  duration_months: z.number().min(1).max(12),
  activation_notes: z.string().optional(),
});

export default function SubscriptionManagement() {
  const { data: plans } = useAllSubscriptionPlans();
  const { data: subscriptions } = useAllDealerSubscriptions();
  const { data: dealers } = useDealers();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const deletePlan = useDeleteSubscriptionPlan();
  const togglePlanStatus = useTogglePlanStatus();
  const activateSubscription = useManuallyActivateSubscription();
  
  const [activeTab, setActiveTab] = useState('plans');
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const planForm = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      display_name: '',
      description: 'Perfect for dealers',
      price: 999,
      currency: 'INR',
      billing_period: 'monthly' as const,
      listing_limit: 15,
      featured_ads_limit: 2,
      features: [''],
      is_popular: false,
      sort_order: 0,
    },
  });

  const activationForm = useForm({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      dealer_id: '',
      plan_id: '',
      duration_months: 1,
      activation_notes: '',
    },
  });

  const handleSavePlan = async (data: z.infer<typeof planSchema>) => {
    try {
      if (editingPlan) {
        // Update existing plan
        await updatePlan.mutateAsync({
          id: editingPlan.id,
          ...data,
          features: data.features.filter(f => f.trim() !== ''),
        });
      } else {
        // Create new plan
        await createPlan.mutateAsync({
          name: data.name,
          display_name: data.display_name,
          description: data.description,
          price: data.price,
          listing_limit: data.listing_limit,
          featured_ads_limit: data.featured_ads_limit,
          is_popular: data.is_popular,
          currency: data.currency,
          billing_period: data.billing_period,
          features: data.features.filter(f => f.trim() !== ''),
          is_active: true,
          sort_order: data.sort_order,
        });
      }
      setPlanDialogOpen(false);
      setEditingPlan(null);
      planForm.reset();
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleManualActivation = async (data: z.infer<typeof activationSchema>) => {
    try {
      await activateSubscription.mutateAsync({
        dealer_id: data.dealer_id,
        plan_id: data.plan_id,
        duration_months: data.duration_months,
        activation_notes: data.activation_notes,
      });
      setActivationDialogOpen(false);
      activationForm.reset();
    } catch (error) {
      console.error('Failed to activate:', error);
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    planForm.reset({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      billing_period: plan.billing_period as any,
      listing_limit: plan.listing_limit,
      featured_ads_limit: plan.featured_ads_limit,
      features: plan.features.length > 0 ? plan.features : [''],
      is_popular: plan.is_popular,
      sort_order: plan.sort_order,
    });
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deletePlan.mutateAsync(planId);
      setDeletingPlanId(null);
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    try {
      await togglePlanStatus.mutateAsync({ id: planId, is_active: !currentStatus });
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const plansColumns = [
    {
      accessorKey: 'display_name',
      header: 'Plan Name',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.display_name}</div>
          <div className="text-xs text-muted-foreground">{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }: any) => (
        <div className="font-medium">
          {row.original.currency === 'INR' ? '₹' : '$'}
          {row.original.price}
          <span className="text-xs text-muted-foreground ml-1">
            /{row.original.billing_period}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'listing_limit',
      header: 'Listings',
      cell: ({ row }: any) => (
        <div className="text-center">
          <div className="font-medium">{row.original.listing_limit}</div>
          <div className="text-xs text-muted-foreground">cars</div>
        </div>
      ),
    },
    {
      accessorKey: 'featured_ads_limit',
      header: 'Featured',
      cell: ({ row }: any) => (
        <div className="text-center">
          <div className="font-medium">{row.original.featured_ads_limit}</div>
          <div className="text-xs text-muted-foreground">ads</div>
        </div>
      ),
    },
    {
      accessorKey: 'is_popular',
      header: 'Popular',
      cell: ({ row }: any) => (
        row.original.is_popular ? 
          <Badge variant="default" className="bg-amber-500">⭐ Popular</Badge> : 
          <span className="text-muted-foreground text-sm">—</span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(row.original.id, row.original.is_active)}
            title={row.original.is_active ? 'Deactivate' : 'Activate'}
          >
            {row.original.is_active ? 
              <PowerOff className="h-4 w-4 text-orange-600" /> : 
              <Power className="h-4 w-4 text-green-600" />
            }
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditPlan(row.original)}
            title="Edit Plan"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingPlanId(row.original.id)}
            title="Delete Plan"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const subscriptionColumns = [
    {
      accessorKey: 'dealer.full_name',
      header: 'Dealer',
    },
    {
      accessorKey: 'plan.display_name',
      header: 'Plan',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'starts_at',
      header: 'Start Date',
      cell: ({ row }: any) => format(new Date(row.original.starts_at), 'dd MMM yyyy'),
    },
    {
      accessorKey: 'ends_at',
      header: 'End Date',
      cell: ({ row }: any) => format(new Date(row.original.ends_at), 'dd MMM yyyy'),
    },
    {
      accessorKey: 'manually_activated',
      header: 'Manual',
      cell: ({ row }: any) => (
        row.original.manually_activated ? 
          <CheckCircle className="h-4 w-4 text-green-600" /> : 
          <XCircle className="h-4 w-4 text-gray-400" />
      ),
    },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground mt-2">Manage plans and dealer subscriptions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="plans">Active Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Active Subscriptions</TabsTrigger>
        </TabsList>

        {/* Active Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Manage subscription plan templates available to dealers
            </p>
            <Dialog 
              open={planDialogOpen} 
              onOpenChange={(open) => {
                setPlanDialogOpen(open);
                if (!open) {
                  setEditingPlan(null);
                  planForm.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlan 
                      ? 'Update the plan details below' 
                      : 'Configure a new plan that will be available to dealers on the Plans page'
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...planForm}>
                  <form onSubmit={planForm.handleSubmit(handleSavePlan)} className="space-y-6">
                    <div className="grid md:grid-cols-[60%_40%] gap-6">
                      {/* Left Column - Plan Details */}
                      <div className="space-y-6">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-sm">Plan Details</h3>
                          
                          <FormField
                            control={planForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plan ID*</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="starter_plan" disabled={!!editingPlan} />
                                </FormControl>
                                <FormDescription>
                                  Technical identifier (lowercase, underscores only)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={planForm.control}
                            name="display_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Name*</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Starter Plan" />
                                </FormControl>
                                <FormDescription>
                                  This appears on the plans page
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={planForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subtitle*</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Perfect for small dealers getting started"
                                    rows={2}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Catchy one-liner to attract dealers
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Features Section */}
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Features
                          </h3>
                          
                          <FormField
                            control={planForm.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="space-y-2">
                                    {field.value.map((feature, index) => (
                                      <div key={index} className="flex gap-2">
                                        <Input
                                          value={feature}
                                          onChange={(e) => {
                                            const newFeatures = [...field.value];
                                            newFeatures[index] = e.target.value;
                                            field.onChange(newFeatures);
                                          }}
                                          placeholder={`Feature ${index + 1}`}
                                        />
                                        {field.value.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const newFeatures = field.value.filter((_, i) => i !== index);
                                              field.onChange(newFeatures);
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => field.onChange([...field.value, ''])}
                                      className="w-full"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Feature
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Add features that will be displayed to dealers
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Right Column - Pricing & Settings */}
                      <div className="space-y-6">
                        {/* Pricing Section */}
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Pricing
                          </h3>

                          <FormField
                            control={planForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price*</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    placeholder="999.00"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Amount in rupees
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={planForm.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={planForm.control}
                            name="billing_period"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing Period*</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="grid grid-cols-2 gap-2"
                                  >
                                    <div>
                                      <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
                                      <label
                                        htmlFor="monthly"
                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                                      >
                                        <span className="text-sm font-medium">Monthly</span>
                                      </label>
                                    </div>
                                    <div>
                                      <RadioGroupItem value="quarterly" id="quarterly" className="peer sr-only" />
                                      <label
                                        htmlFor="quarterly"
                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                                      >
                                        <span className="text-sm font-medium">Quarterly</span>
                                        <span className="text-xs text-muted-foreground">3 months</span>
                                      </label>
                                    </div>
                                    <div>
                                      <RadioGroupItem value="half_yearly" id="half_yearly" className="peer sr-only" />
                                      <label
                                        htmlFor="half_yearly"
                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                                      >
                                        <span className="text-sm font-medium">Half-Yearly</span>
                                        <span className="text-xs text-muted-foreground">6 months</span>
                                      </label>
                                    </div>
                                    <div>
                                      <RadioGroupItem value="annual" id="annual" className="peer sr-only" />
                                      <label
                                        htmlFor="annual"
                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                                      >
                                        <span className="text-sm font-medium">Annual</span>
                                        <span className="text-xs text-muted-foreground">12 months</span>
                                      </label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Limits Section */}
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Limits
                          </h3>

                          <FormField
                            control={planForm.control}
                            name="listing_limit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Car Listings*</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum active listings
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={planForm.control}
                            name="featured_ads_limit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Featured Ads*</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum featured listings
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Settings Section */}
                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Settings2 className="h-4 w-4" />
                            Settings
                          </h3>

                          <FormField
                            control={planForm.control}
                            name="is_popular"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Mark as Popular</FormLabel>
                                  <FormDescription className="text-xs">
                                    Shows "Most Popular" badge
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={planForm.control}
                            name="sort_order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sort Order</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Lower numbers appear first
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setPlanDialogOpen(false);
                          setEditingPlan(null);
                          planForm.reset();
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={createPlan.isPending || updatePlan.isPending}
                      >
                        {editingPlan 
                          ? (updatePlan.isPending ? 'Updating...' : 'Update Plan')
                          : (createPlan.isPending ? 'Creating...' : 'Create Plan')
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            columns={plansColumns}
            data={plans || []}
            searchKey="display_name"
            searchPlaceholder="Search plans..."
          />
        </TabsContent>

        {/* Active Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              View and manage active dealer subscriptions
            </p>
            <Dialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Manual Activation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manually Activate Subscription</DialogTitle>
                  <DialogDescription>
                    Activate a subscription plan for a dealer without payment
                  </DialogDescription>
                </DialogHeader>
                <Form {...activationForm}>
                  <form onSubmit={activationForm.handleSubmit(handleManualActivation)} className="space-y-4">
                    <FormField
                      control={activationForm.control}
                      name="dealer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dealer</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select dealer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dealers?.map((dealer) => (
                                <SelectItem key={dealer.id} value={dealer.id}>
                                  {dealer.full_name} ({dealer.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={activationForm.control}
                      name="plan_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plans?.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.display_name} - ₹{plan.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={activationForm.control}
                      name="duration_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (months)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={activationForm.control}
                      name="activation_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Reason for manual activation..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      Activate Subscription
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            columns={subscriptionColumns}
            data={subscriptions || []}
            searchKey="dealer.full_name"
            searchPlaceholder="Search by dealer name..."
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPlanId} onOpenChange={() => setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the plan. It will no longer be visible to dealers, but existing subscriptions will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlanId && handleDeletePlan(deletingPlanId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
