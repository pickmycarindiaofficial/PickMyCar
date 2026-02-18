import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ImageUploader } from './ImageUploader';
import { DocumentUploader } from './DocumentUploader';
import { ColorPicker } from './ColorPicker';
import { carListingSchema } from '@/lib/validation';
import { useCreateCarListing, useUpdateCarListing } from '@/hooks/useCarListings';
import { useCarListingForEdit } from '@/hooks/useCarListingForEdit';
import { useBrands } from '@/hooks/useBrands';
import { useModels } from '@/hooks/useModels';
import { useCities } from '@/hooks/useCities';
import { useFuelTypes } from '@/hooks/useFuelTypes';
import { useTransmissions } from '@/hooks/useTransmissions';
import { useBodyTypes } from '@/hooks/useBodyTypes';
import { useSeatOptions } from '@/hooks/useSeatOptions';
import { useOwnerTypes } from '@/hooks/useOwnerTypes';
import { useCategories } from '@/hooks/useCategories';
import { useDealers } from '@/hooks/useDealers';
import { useFeatures } from '@/hooks/useFeatures';
import { useSaveCarListingFeatures } from '@/hooks/useCarListingFeatures';
import { useDealerSubscription } from '@/hooks/useDealerSubscription';
import { useDealerProfile } from '@/hooks/useDealerProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, User, Building2, X, Star, Sparkles, Lightbulb, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { supabase } from '@/lib/supabase-client';
import { numberToWords, formatPriceWithWords } from '@/lib/numberToWords';
import { MockAIService } from '@/lib/mock-ai';
import { ActionTooltip } from '@/components/ui/action-tooltip';
import { cn, safeLocalStorage } from "@/lib/utils";
import { ResponsiveSelect } from '@/components/ui/responsive-select';
import { MobileRadioCard } from '@/components/ui/mobile-radio-card';
import { useIsMobile } from '@/hooks/use-mobile';

type CarListingFormData = z.infer<typeof carListingSchema>;

interface CarListingFormProps {
  onSuccess?: () => void;
  listingId?: string;  // Pass listing ID for edit mode
  mode?: 'create' | 'edit';  // Explicit mode indicator
}

export function CarListingForm({
  onSuccess,
  listingId,
  mode = 'create'
}: CarListingFormProps) {
  const { user, hasRole } = useAuth();
  const isPowerDesk = hasRole('powerdesk');
  const isDealer = hasRole('dealer');
  const [sellerType, setSellerType] = useState<'individual' | 'dealer'>(
    isPowerDesk ? 'dealer' : isDealer ? 'dealer' : 'individual'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedDealer, setSelectedDealer] = useState<string>('');
  const [highlightInput, setHighlightInput] = useState('');
  const [suggestedHighlights, setSuggestedHighlights] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<{ description?: boolean; highlights?: boolean }>({});

  const { data: brands } = useBrands();
  const { data: models } = useModels();
  const { data: cities } = useCities();
  const { data: fuelTypes } = useFuelTypes();
  const { data: transmissions } = useTransmissions();
  const { data: bodyTypes } = useBodyTypes();
  const { data: seatOptions } = useSeatOptions();
  const { data: ownerTypes } = useOwnerTypes();
  const { data: categories } = useCategories();
  const { data: dealers } = useDealers();
  const { data: features } = useFeatures();
  const saveFeatures = useSaveCarListingFeatures();
  const { data: subscription } = useDealerSubscription();

  // Fetch current dealer's profile to auto-load city
  // For OTP dealers, also check localStorage for dealer ID
  let currentDealerId = isDealer && user?.id ? user.id : null;
  if (!currentDealerId && isDealer) {
    try {
      const dealerInfoStr = safeLocalStorage.getItem('dealer_info');
      if (dealerInfoStr) {
        const dealerInfo = JSON.parse(dealerInfoStr);
        currentDealerId = dealerInfo.id;
      }
    } catch (e) {
      console.error('Error parsing dealer info:', e);
    }
  }

  const { data: currentDealerProfile } = useDealerProfile(currentDealerId);

  // Fetch selected dealer's profile for PowerDesk
  const { data: selectedDealerProfile } = useDealerProfile(
    isPowerDesk && selectedDealer ? selectedDealer : null
  );

  const filteredModels = selectedBrand
    ? models?.filter(m => m.brand_id === selectedBrand)
    : models;
  const createListing = useCreateCarListing();
  const updateListing = useUpdateCarListing();
  const isEditMode = mode === 'edit' && !!listingId;

  // Fetch existing listing data for edit mode
  const { data: existingListing, isLoading: loadingExisting } = useCarListingForEdit(
    isEditMode ? listingId : null
  );

  const form = useForm<CarListingFormData>({
    resolver: zodResolver(carListingSchema),
    defaultValues: {
      seller_type: 'dealer',
      price_type: 'negotiable',
      car_condition: 'good',
      has_loan: false,
      photos: [],
      highlights: [],
      feature_ids: [],
      registration_number: '',
      insurance_status: 'not_applicable',
      insurance_validity: '',
      city_id: '',
    },
  });

  // Set selectedBrand and selectedDealer for edit mode
  useEffect(() => {
    if (isEditMode && existingListing) {
      if (existingListing.brand_id) {
        setSelectedBrand(existingListing.brand_id);
      }
      if (existingListing.seller_id) {
        setSelectedDealer(existingListing.seller_id);
      }
    }
  }, [isEditMode, existingListing]);

  // Reset form when existing listing data loads
  useEffect(() => {
    if (isEditMode && existingListing && !loadingExisting) {
      form.reset({
        seller_type: existingListing.seller_type || 'dealer',
        variant: existingListing.variant || '',
        year_of_make: existingListing.year_of_make || new Date().getFullYear(),
        brand_id: existingListing.brand_id || '',
        model_id: existingListing.model_id || '',
        body_type_id: existingListing.body_type_id || '',
        fuel_type_id: existingListing.fuel_type_id || '',
        transmission_id: existingListing.transmission_id || '',
        owner_type_id: existingListing.owner_type_id || '',
        city_id: existingListing.city_id || '',
        category_id: existingListing.category_id || '',
        seats: existingListing.seats || undefined,
        color: existingListing.color || '',
        kms_driven: existingListing.kms_driven || 0,
        registration_number: existingListing.registration_number || '',
        insurance_status: existingListing.insurance_status || 'not_applicable',
        insurance_validity: existingListing.insurance_validity || '',
        car_condition: existingListing.car_condition || 'good',
        expected_price: existingListing.expected_price || 0,
        price_type: existingListing.price_type || 'negotiable',
        photos: existingListing.photos || [],
        description: existingListing.description || '',
        highlights: existingListing.highlights || [],
        feature_ids: existingListing.feature_ids || [],
        is_featured: existingListing.is_featured || false,
        primary_phone: existingListing.primary_phone || '',
        alternate_phone: existingListing.alternate_phone || '',
        full_address: existingListing.full_address || '',
        rc_book_url: existingListing.rc_book_url || '',
        insurance_url: existingListing.insurance_url || '',
        has_loan: existingListing.has_loan || false,
        loan_papers_url: existingListing.loan_papers_url || '',
      });
    }
  }, [isEditMode, existingListing, loadingExisting, form]);

  // Auto-load city from dealer profile
  useEffect(() => {
    // For regular dealers: use their own profile
    if (isDealer && !isPowerDesk && currentDealerProfile?.city_id) {
      form.setValue('city_id', currentDealerProfile.city_id);
    }

    // For PowerDesk: use selected dealer's profile
    if (isPowerDesk && selectedDealerProfile?.city_id) {
      form.setValue('city_id', selectedDealerProfile.city_id);
    }
  }, [isDealer, isPowerDesk, currentDealerProfile, selectedDealerProfile, form]);

  const onSubmit = async (data: CarListingFormData) => {
    try {
      // Validate dealer has city configured (only for create mode)
      if (!isEditMode && isDealer && !currentDealerProfile?.city_id) {
        toast.error('Profile Incomplete', {
          description: 'Please complete your dealer profile with city information before listing cars.'
        });
        return;
      }

      const listingData: any = {
        ...data,
        seller_type: isPowerDesk ? 'dealer' : sellerType,
      };

      // Remove feature_ids from listing data (will be saved separately)
      const { feature_ids, ...listingDataWithoutFeatures } = listingData;

      // If PowerDesk selected a dealer, override seller_id
      if (isPowerDesk && selectedDealer) {
        listingDataWithoutFeatures.seller_id = selectedDealer;
      }

      let savedListing;

      if (isEditMode && listingId) {
        // UPDATE MODE
        try {
          // @ts-ignore - Supabase types
          savedListing = await updateListing.mutateAsync({
            id: listingId,
            ...listingDataWithoutFeatures
          });
        } catch (updateError: any) {
          throw updateError;
        }
      } else {
        // CREATE MODE
        // @ts-ignore - Supabase types
        savedListing = await createListing.mutateAsync(listingDataWithoutFeatures);
        toast.success('Listing created successfully!');
      }

      // Save features if any selected
      if (feature_ids && feature_ids.length > 0 && savedListing?.id) {
        await saveFeatures.mutateAsync({
          carListingId: savedListing.id,
          featureIds: feature_ids,
        });
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Reset form only in create mode
      if (!isEditMode) {
        form.reset();
        setHighlightInput('');
        setSuggestedHighlights([]);
      }
    } catch (error: any) {
      toast.error(
        isEditMode ? 'Failed to update listing' : 'Failed to create listing',
        {
          description: error.message || 'Please try again'
        }
      );
    }
  };


  const generateWithAI = async (type: 'description' | 'highlights') => {
    const brandId = form.watch('brand_id');
    const modelId = form.watch('model_id');
    const variant = form.watch('variant');
    const year = form.watch('year_of_make');
    const kms = form.watch('kms_driven');
    const fuelTypeId = form.watch('fuel_type_id');
    const transmissionId = form.watch('transmission_id');
    const color = form.watch('color');
    const condition = form.watch('car_condition');
    const ownerTypeId = form.watch('owner_type_id');

    if (!brandId || !modelId || !variant || !year || !kms) {
      toast.error('Please fill in basic car details first (brand, model, variant, year, kilometers)');
      return;
    }

    const brand = brands?.find(b => b.id === brandId)?.name || '';
    const model = models?.find(m => m.id === modelId)?.name || '';
    const fuel = (fuelTypes as any)?.find((f: any) => f.id === fuelTypeId)?.name || '';
    const transmission = (transmissions as any)?.find((t: any) => t.id === transmissionId)?.name || '';
    const owner = (ownerTypes as any)?.find((o: any) => o.id === ownerTypeId)?.name || '';

    setIsGenerating(prev => ({ ...prev, [type]: true }));

    try {
      // Use Mock AI Service instead of failing Edge Function
      const data = await MockAIService.generateContent(type, {
        brand,
        model,
        variant,
        year,
        kms,
        fuel,
        transmission,
        color,
        condition,
        owner,
      });

      if (type === 'description' && data?.description) {
        form.setValue('description', data.description);
        toast.success('Description generated successfully!');
      } else if (type === 'highlights' && data?.highlights) {
        setSuggestedHighlights(data.highlights);
        toast.success(`${data.highlights.length} highlights suggested! Click to add them.`);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content. Please try again or contact support.');
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Show loading state while fetching existing data */}
        {isEditMode && loadingExisting && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Loading listing data...</p>
            </div>
          </div>
        )}

        {/* Edit Mode Indicator */}
        {isEditMode && !loadingExisting && (
          <Alert className="border-primary bg-primary/5">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              You are editing an existing listing. Make your changes below and click "Update Listing" to save.
            </AlertDescription>
          </Alert>
        )}

        {/* Professional Tip Alert - Show for Dealers */}
        {(isDealer || isPowerDesk) && !loadingExisting && (
          <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="ml-2 text-sm text-blue-900 dark:text-blue-100">
              <strong className="font-semibold">💡 Tip:</strong> Please try to fill in all the details
              <div className="mt-1 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                It helps you <strong>print a full stock list</strong> with complete specs and pricing,
                generate a <strong>ready-to-display car spec sheet</strong>, and keep your inventory
                professional and organized.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* PowerDesk: Dealer Selection */}
        {isPowerDesk && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Post For
                <Badge variant="default">PowerDesk</Badge>
              </CardTitle>
              <CardDescription>Select which dealer this listing is for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormLabel>Dealer / PickMyCar</FormLabel>
                <ResponsiveSelect
                  value={selectedDealer}
                  onValueChange={setSelectedDealer}
                  placeholder="Select dealer or PickMyCar stock"
                  title="Select Dealer"
                  withFormControl={false}
                  options={(dealers || []).map(dealer => ({
                    value: dealer.id,
                    label: `${dealer.full_name} ${dealer.is_pickmycar ? '(Our Stock)' : ''}`
                  }))}
                />
                <FormDescription>
                  Choose <strong>PickMyCar</strong> for website's own inventory, or select a specific dealer
                </FormDescription>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seller Type Selection - Hidden for PowerDesk and Dealers */}
        {!isPowerDesk && isDealer && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Posting as <strong>Dealer</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {!isPowerDesk && !isDealer && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Posting as <strong>Individual Seller</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Car Details */}
        <Card className="card-mobile-flat">
          <CardHeader>
            <CardTitle>Car Details</CardTitle>
            <CardDescription>Enter the basic information about the car</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-mobile-tight">
            <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-4">
              <FormField
                control={form.control}
                name="brand_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedBrand(value);
                      }}
                      placeholder="Select brand"
                      title="Select Brand"
                      options={(brands || []).map(b => ({ value: b.id, label: b.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Auto-fill body type and seats based on model defaults
                        const selectedModel = filteredModels?.find(m => m.id === value) as any;
                        if (selectedModel) {
                          // Auto-fill seats if model has default
                          if (selectedModel.default_seats) {
                            form.setValue('seats', selectedModel.default_seats);
                          }
                          // Auto-fill body type if model has default
                          if (selectedModel.default_body_type && bodyTypes) {
                            const matchingBodyType = bodyTypes.find(
                              (bt: any) => bt.name.toLowerCase() === selectedModel.default_body_type.toLowerCase()
                            );
                            if (matchingBodyType) {
                              form.setValue('body_type_id', matchingBodyType.id);
                            }
                          }
                        }
                      }}
                      placeholder="Select model"
                      title="Select Model"
                      options={(filteredModels || []).map(m => ({ value: m.id, label: m.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ZX Plus, Sportz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year_of_make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Make</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="2020"
                        maxLength={4}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          field.onChange(val ? parseInt(val) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Registration Number
                      <Badge variant="outline" className="text-xs font-normal">
                        Optional
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., KA01AB1234"
                        {...field}
                        className="uppercase"
                        maxLength={20}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Vehicle registration number for official records
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Insurance Status Field */}
              <FormField
                control={form.control}
                name="insurance_status"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Insurance Status</FormLabel>
                    <FormControl>
                      <MobileRadioCard
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          { value: 'valid', label: 'Valid', description: 'With expiry date' },
                          { value: 'expired', label: 'Expired', description: 'Insurance has lapsed' },
                          { value: 'not_applicable', label: 'Not Applicable', description: 'No insurance needed' }
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Insurance Validity Date - Conditional */}
              {form.watch('insurance_status') === 'valid' && (
                <FormField
                  control={form.control}
                  name="insurance_validity"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        Insurance Valid Till
                        <Badge variant="destructive" className="text-xs font-normal">
                          Required
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Insurance expiry date (must be valid)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="kms_driven"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometers Driven</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    {field.value > 0 && (
                      <FormDescription className="text-sm font-medium text-primary">
                        {numberToWords(field.value)}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="fuel_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select fuel type"
                      title="Select Fuel Type"
                      options={(fuelTypes as any || []).map((f: any) => ({ value: f.id, label: f.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transmission_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select transmission"
                      title="Select Transmission"
                      options={(transmissions as any || []).map((t: any) => ({ value: t.id, label: t.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Type</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select body type"
                      title="Select Body Type"
                      options={(bodyTypes as any || []).map((b: any) => ({ value: b.id, label: b.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seats</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={(val) => field.onChange(parseInt(val))}
                      placeholder="Select seats"
                      title="Select Seats"
                      options={(seatOptions as any || []).map((s: any) => ({ value: s.seats, label: `${s.seats} Seater` }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Type</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select owner type"
                      title="Select Owner Type"
                      options={(ownerTypes as any || []).map((o: any) => ({ value: o.id, label: o.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year_of_purchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Purchase (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2021"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="car_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select condition"
                      title="Select Condition"
                      options={[
                        { value: 'excellent', label: 'Excellent' },
                        { value: 'good', label: 'Good' },
                        { value: 'fair', label: 'Fair' },
                        { value: 'needs_work', label: 'Needs Work' }
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city_id"
                render={({ field }) => {
                  // Determine if city is auto-loaded and locked
                  const isPowerDesk = hasRole('powerdesk');
                  const isDealer = hasRole('dealer');
                  // For PowerDesk: locked if dealer selected has city
                  // For Dealer: locked if their profile has city
                  const dealerProfile = isPowerDesk ? selectedDealerProfile : currentDealerProfile;
                  const isAutoLoaded = !!(isDealer && dealerProfile?.city_id);

                  return (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <ResponsiveSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isAutoLoaded}
                        placeholder="Select city"
                        title="Select City"
                        className={isAutoLoaded ? "cursor-not-allowed opacity-75 bg-muted" : ""}
                        options={(cities || []).map(city => ({ value: city.id, label: city.name }))}
                      />
                      {isAutoLoaded && dealerProfile?.city && (
                        <FormDescription className="text-xs text-muted-foreground">
                          {isPowerDesk
                            ? `Listing for: ${dealerProfile.city}`
                            : `Your registered city: ${dealerProfile.city}`}
                        </FormDescription>
                      )}
                      {!isAutoLoaded && (
                        <FormDescription className="text-xs">
                          Select the city where the car is located
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select category"
                      title="Select Category"
                      options={(categories || []).map(c => ({ value: c.id, label: c.name }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Picker - Full Width */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Color (Optional)</FormLabel>
                    <FormControl>
                      <ColorPicker
                        selected={field.value || ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="card-mobile-flat">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-mobile-tight">
            <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-4">
              <FormField
                control={form.control}
                name="expected_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    {field.value > 0 && (
                      <FormDescription className="text-sm font-medium text-emerald-600">
                        ₹ {formatPriceWithWords(field.value)}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Type</FormLabel>
                    <ResponsiveSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select type"
                      title="Select Price Type"
                      options={[
                        { value: 'fixed', label: 'Fixed' },
                        { value: 'negotiable', label: 'Negotiable' }
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="card-mobile-flat">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Upload at least 3 high-quality photos of the car</CardDescription>
          </CardHeader>
          <CardContent className="p-mobile-tight">
            <FormField
              control={form.control}
              name="photos"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploader
                      images={(field.value || []) as Array<{ url: string; thumbnail_url?: string; medium_url?: string; size: number; originalSize?: number }>}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Conditional: Individual Seller Fields */}
        {sellerType === 'individual' && (
          <>
            <Card className="card-mobile-flat">
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Upload required documents for verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-mobile-tight">
                <FormField
                  control={form.control}
                  name="rc_book_url"
                  render={({ field }) => (
                    <FormItem>
                      <DocumentUploader
                        label="RC Book"
                        documentUrl={field.value}
                        onChange={field.onChange}
                        required
                        description="Upload a clear copy of your Registration Certificate"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insurance_url"
                  render={({ field }) => (
                    <FormItem>
                      <DocumentUploader
                        label="Insurance"
                        documentUrl={field.value}
                        onChange={field.onChange}
                        required
                        description="Upload your current insurance papers"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_loan"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Car has an active loan?</FormLabel>
                        <FormDescription>
                          Check this if there's an outstanding loan on the vehicle
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

                {form.watch('has_loan') && (
                  <FormField
                    control={form.control}
                    name="loan_papers_url"
                    render={({ field }) => (
                      <FormItem>
                        <DocumentUploader
                          label="Loan Papers"
                          documentUrl={field.value}
                          onChange={field.onChange}
                          description="Upload loan-related documents"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="card-mobile-flat">
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-mobile-tight">
                <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-4">
                  <FormField
                    control={form.control}
                    name="primary_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" inputMode="numeric" placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alternate_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternate Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" inputMode="numeric" placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="full_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your complete address for verification"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </>
        )}


        {/* Additional Information */}
        <Card className="card-mobile-flat">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-mobile-tight">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Description</FormLabel>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => generateWithAI('description')}
                      disabled={isGenerating.description}
                      className="gap-2"
                    >
                      {isGenerating.description ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the car's features, condition, and any other important details..."
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 50 characters, maximum 2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  Highlights
                  <Badge variant="destructive" className="text-xs font-normal">
                    Required (Min 3)
                  </Badge>
                  {form.watch('highlights')?.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {form.watch('highlights')?.length} / 15 added
                    </Badge>
                  )}
                </FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => generateWithAI('highlights')}
                  disabled={isGenerating.highlights}
                  className="gap-2"
                >
                  {isGenerating.highlights ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Suggesting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Suggest with AI
                    </>
                  )}
                </Button>
              </div>

              {/* Importance Alert */}
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Important:</strong> Highlights help buyers make faster buying decisions and
                  improve your listing's visibility. Add at least 3 highlights manually or use AI suggestions.
                </AlertDescription>
              </Alert>

              {suggestedHighlights.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">AI Suggested Highlights (Click to add):</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSuggestedHighlights([])}
                      className="h-6 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedHighlights.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          const highlights = form.watch('highlights') || [];
                          if (highlights.length < 15 && !highlights.includes(suggestion)) {
                            form.setValue('highlights', [...highlights, suggestion]);
                            setSuggestedHighlights(suggestedHighlights.filter((_, i) => i !== index));
                          }
                        }}
                      >
                        + {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Well maintained, Single owner"
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const highlights = form.watch('highlights') || [];
                      if (highlightInput.trim() && highlights.length < 15) {
                        form.setValue('highlights', [...highlights, highlightInput.trim()]);
                        setHighlightInput('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const highlights = form.watch('highlights') || [];
                    if (highlightInput.trim() && highlights.length < 15) {
                      form.setValue('highlights', [...highlights, highlightInput.trim()]);
                      setHighlightInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(form.watch('highlights') || []).map((highlight, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {highlight}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        const highlights = form.watch('highlights') || [];
                        form.setValue('highlights', highlights.filter((_, i) => i !== index));
                      }}
                    />
                  </Badge>
                ))}
              </div>
              <FormDescription className="flex items-center gap-1">
                <span className="text-destructive font-medium">*Required:</span>
                Add 3 to 15 highlights about the car (press Enter or click Add)
              </FormDescription>
              <FormField
                control={form.control}
                name="highlights"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Car Features */}
        <Card className="card-mobile-flat">
          <CardHeader>
            <CardTitle>Car Features <span className="text-sm font-normal text-muted-foreground ml-1">(Optional)</span></CardTitle>
            <CardDescription>Select all features that apply to this car</CardDescription>
          </CardHeader>
          <CardContent className="p-mobile-tight">
            <FormField
              control={form.control}
              name="feature_ids"
              render={() => (
                <FormItem>
                  {features && features.length > 0 ? (
                    <>
                      {/* Group features by category */}
                      {Object.entries(
                        features.reduce((acc, feature) => {
                          const category = feature.category || 'Other';
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(feature);
                          return acc;
                        }, {} as Record<string, typeof features>)
                      ).map(([category, categoryFeatures]) => (
                        <div key={category} className="mb-6 last:mb-0">
                          <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                            {category}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {categoryFeatures.map((feature) => (
                              <FormField
                                key={feature.id}
                                control={form.control}
                                name="feature_ids"
                                render={({ field }) => {
                                  const isSelected = field.value?.includes(feature.id);
                                  return (
                                    <FormItem
                                      key={feature.id}
                                      className="space-y-0"
                                    >
                                      <FormControl>
                                        <div
                                          onClick={() => {
                                            const newValue = isSelected
                                              ? field.value?.filter((val) => val !== feature.id)
                                              : [...(field.value || []), feature.id];
                                            field.onChange(newValue);
                                          }}
                                          className={cn(
                                            "cursor-pointer flex items-center justify-between p-3 rounded-lg border text-sm transition-all touch-manipulation",
                                            isSelected
                                              ? "border-primary bg-primary/5 text-primary font-medium shadow-sm"
                                              : "border-muted bg-background text-muted-foreground hover:bg-muted/30"
                                          )}
                                        >
                                          <span className="truncate mr-2">{feature.name}</span>
                                          {isSelected && (
                                            <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center shrink-0">
                                              <Check className="h-3 w-3 text-primary-foreground" />
                                            </div>
                                          )}
                                          {!isSelected && (
                                            <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                          )}
                                        </div>
                                      </FormControl>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No features available. Please add features in Master Setup.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Featured Listing */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Mark as Featured Listing
                    </FormLabel>
                    <FormDescription>
                      Get premium placement and increased visibility
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
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-4 pt-4 pb-8">
          <Button
            type="submit"
            size="lg"
            disabled={createListing.isPending || updateListing.isPending || loadingExisting}
            className="w-full md:flex-1 h-14 md:h-11 text-base font-semibold"
            onClick={async () => {
              await form.trigger();
              const errors = form.formState.errors;
              if (!form.formState.isValid && Object.keys(errors).length > 0) {
                const errorFields = Object.keys(errors).join(', ');
                toast.error('Form has errors', {
                  description: `Please fix: ${errorFields}`,
                  duration: 5000,
                });
              }
            }}
          >
            {(createListing.isPending || updateListing.isPending) && (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            )}
            {isEditMode ? 'Update Listing' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
