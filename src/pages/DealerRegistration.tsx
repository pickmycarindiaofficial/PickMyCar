import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronLeft, ChevronRight, Building2, FileText, User, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploadField } from '@/components/dealer-registration/DocumentUploadField';
import { validateGSTNumber, validatePANNumber, validatePhoneNumber, validatePincode } from '@/lib/dealerDocuments';
import { useSubmitDealerApplication } from '@/hooks/useDealerApplications';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useCities } from '@/hooks/useCities';
import { DealerApplicationFormData } from '@/types/dealer';

const formSchema = z.object({
  dealership_name: z.string().min(3, 'Dealership name must be at least 3 characters'),
  business_type: z.string().optional(),
  year_established: z.number().min(1900).max(new Date().getFullYear()).optional(),
  gst_number: z.string().optional().refine((val) => !val || validateGSTNumber(val), 'Invalid GST number'),
  gst_certificate_url: z.string().optional(),
  shop_registration_url: z.string().optional(),
  pan_number: z.string().optional().refine((val) => !val || validatePANNumber(val), 'Invalid PAN number'),
  pan_card_url: z.string().optional(),
  owner_name: z.string().min(3, 'Owner name is required'),
  owner_aadhar_number: z.string().optional(),
  owner_aadhar_url: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().refine(validatePhoneNumber, 'Invalid phone number'),
  alternate_phone: z.string().optional(),
  address: z.string().min(10, 'Please provide complete address'),
  city_id: z.string().optional(),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().refine(validatePincode, 'Invalid pincode'),
  dealer_agreement_url: z.string().optional(),
  terms_accepted: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  requested_plan_id: z.string().optional(),
});

const steps = [
  { id: 1, name: 'Business Info', icon: Building2 },
  { id: 2, name: 'Documents', icon: FileText },
  { id: 3, name: 'Owner Details', icon: User },
  { id: 4, name: 'Location', icon: MapPin },
  { id: 5, name: 'Plan Selection', icon: CreditCard },
];

export default function DealerRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId] = useState(() => `temp-${Date.now()}`);
  const navigate = useNavigate();

  const { mutate: submitApplication, isPending } = useSubmitDealerApplication();
  const { data: plans } = useSubscriptionPlans();
  const { data: cities } = useCities();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealership_name: '',
      business_type: '',
      owner_name: '',
      email: '',
      phone_number: '',
      address: '',
      state: '',
      pincode: '',
      terms_accepted: false,
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    submitApplication(data as DealerApplicationFormData, {
      onSuccess: () => {
        navigate('/auth');
      },
    });
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Become a Dealer Partner</h1>
          <p className="text-muted-foreground">Join our network of trusted car dealers</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep >= step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-xs mt-2 text-center">{step.name}</span>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-full absolute top-6 left-1/2 -z-10 transition-colors ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                    style={{ transform: 'translateX(50%)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>Step {currentStep} of {steps.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Business Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dealership_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dealership Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Motors" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="business_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="proprietorship">Proprietorship</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="llp">LLP</SelectItem>
                              <SelectItem value="private_limited">Private Limited</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year_established"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Established</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2020"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Documents */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="gst_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input placeholder="22AAAAA0000A1Z5" {...field} />
                          </FormControl>
                          <FormDescription>Format: 22AAAAA0000A1Z5</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gst_certificate_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <DocumentUploadField
                              label="GST Certificate"
                              documentType="gst_certificate"
                              applicationId={applicationId}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shop_registration_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <DocumentUploadField
                              label="Shop Registration Certificate"
                              documentType="shop_registration"
                              applicationId={applicationId}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pan_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company PAN Number</FormLabel>
                          <FormControl>
                            <Input placeholder="AAAAA0000A" {...field} />
                          </FormControl>
                          <FormDescription>Format: AAAAA0000A</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pan_card_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <DocumentUploadField
                              label="Company PAN Card"
                              documentType="pan_card"
                              applicationId={applicationId}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Owner Details */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="owner_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="owner_aadhar_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Aadhar Number</FormLabel>
                          <FormControl>
                            <Input placeholder="XXXX XXXX XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="owner_aadhar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <DocumentUploadField
                              label="Owner Aadhar Card"
                              documentType="owner_aadhar"
                              applicationId={applicationId}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Location */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="dealer@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} />
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
                          <FormLabel>Alternate Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address *</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Street, Area, Landmark" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {cities?.map((city) => (
                                  <SelectItem key={city.id} value={city.id}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <FormControl>
                              <Input placeholder="Karnataka" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode *</FormLabel>
                          <FormControl>
                            <Input placeholder="560001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 5: Plan Selection */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="requested_plan_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Subscription Plan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plans?.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.display_name} - ₹{plan.price}/{plan.billing_period}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>You can change this later</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dealer_agreement_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <DocumentUploadField
                              label="Dealer Agreement (if any)"
                              documentType="dealer_agreement"
                              applicationId={applicationId}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="terms_accepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Accept Terms & Conditions *</FormLabel>
                            <FormDescription>
                              I agree to the dealer partnership terms and conditions
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                  {currentStep < steps.length ? (
                    <Button type="button" onClick={nextStep} className="ml-auto">
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isPending} className="ml-auto">
                      {isPending ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
