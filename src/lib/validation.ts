import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const signupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .trim(),
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  phone_number: z.string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number format')
    .trim(),
  role: z.enum(['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'user'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Message validation
export const messageSchema = z.object({
  message_text: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),
  conversation_id: z.string().uuid('Invalid conversation ID'),
});

export type MessageFormData = z.infer<typeof messageSchema>;

// Profile validation
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .optional(),
  phone_number: z.string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number format')
    .trim()
    .optional(),
  avatar_url: z.string()
    .url('Invalid URL format')
    .max(500, 'URL too long')
    .optional()
    .or(z.literal('')),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// City/Master data validation
export const citySchema = z.object({
  name: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(100, 'City name must be less than 100 characters')
    .trim(),
  state: z.string()
    .min(2, 'State name must be at least 2 characters')
    .max(100, 'State name must be less than 100 characters')
    .trim()
    .optional(),
});

export const brandSchema = z.object({
  name: z.string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  logo_url: z.string()
    .url('Invalid URL format')
    .max(500, 'URL too long')
    .optional()
    .or(z.literal('')),
});

export const categorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  badge_color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format (use hex: #RRGGBB)')
    .optional(),
});

export type CityFormData = z.infer<typeof citySchema>;
export type BrandFormData = z.infer<typeof brandSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;

// Notification validation
export const notificationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  message: z.string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters')
    .trim(),
  notification_type: z.enum(['info', 'warning', 'success', 'error']),
  action_url: z.string()
    .max(500, 'URL too long')
    .optional()
    .or(z.literal('')),
});

export type NotificationFormData = z.infer<typeof notificationSchema>;

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 
                  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'text/plain'].includes(file.type),
      'Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, TXT'
    ),
});

export type FileUploadData = z.infer<typeof fileUploadSchema>;

// Search/Filter validation (prevent injection)
export const searchSchema = z.object({
  query: z.string()
    .max(200, 'Search query too long')
    .trim()
    .transform(val => val.replace(/[<>\"']/g, '')), // Remove potentially dangerous characters
  filters: z.record(z.string()).optional(),
});

export type SearchFormData = z.infer<typeof searchSchema>;

// Generic ID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Car Listing validation
export const carListingSchema = z.object({
  seller_type: z.enum(['individual', 'dealer']),
  seller_name: z.string().optional(),
  
  brand_id: z.string().uuid({ message: "Please select a brand" }),
  model_id: z.string().uuid({ message: "Please select a model" }),
  variant: z.string().min(1, "Variant is required").max(100),
  year_of_make: z.number()
    .min(1990, "Year must be 1990 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in future"),
  year_of_purchase: z.number().optional(),
  
  kms_driven: z.number()
    .min(0, "Cannot be negative")
    .max(1000000, "Kilometers seems too high"),
  fuel_type_id: z.string().uuid("Please select fuel type"),
  transmission_id: z.string().uuid("Please select transmission"),
  body_type_id: z.string().uuid("Please select body type"),
  color: z.string().min(1, "Color is required"),
  seats: z.number().min(2).max(15).optional(),
  
  owner_type_id: z.string().uuid("Please select owner type"),
  car_condition: z.enum(['excellent', 'good', 'fair', 'needs_work']),
  
  expected_price: z.number()
    .min(10000, "Price must be at least ₹10,000")
    .max(100000000, "Price seems too high"),
  price_type: z.enum(['fixed', 'negotiable']),
  
  photos: z.array(z.object({
    url: z.string(),
    thumbnail_url: z.string().optional(),
    medium_url: z.string().optional(),
    size: z.number(),
    originalSize: z.number().optional(),
  }))
    .min(3, "Upload at least 3 photos")
    .max(20, "Maximum 20 photos allowed"),
  
  rc_book_url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().optional()
  ),
  insurance_url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().optional()
  ),
  loan_papers_url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().optional()
  ),
  has_loan: z.boolean(),
  
  primary_phone: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number").optional()
  ),
  alternate_phone: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number").optional()
  ),
  city_id: z.string().uuid("Please select city"),
  full_address: z.string().max(500).optional(),
  
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description too long")
    .optional(),
  highlights: z.array(z.string())
    .min(3, "At least 3 highlights are required to help buyers make faster decisions")
    .max(15, "Maximum 15 highlights allowed")
    .refine(
      (highlights) => highlights.every((h) => h.length <= 100),
      "Each highlight must be less than 100 characters"
    ),
  feature_ids: z.array(z.string().uuid()).max(20, "Maximum 20 features allowed").optional(),
  
  category_id: z.string().uuid().optional(),
  is_featured: z.boolean().optional().default(false),
  
  registration_number: z.string()
    .min(4, "Registration number must be at least 4 characters")
    .max(20, "Registration number too long")
    .regex(
      /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/i,
      "Invalid format. Use format like KA01AB1234"
    )
    .trim()
    .toUpperCase()
    .optional()
    .or(z.literal('')),

  insurance_status: z.enum(['valid', 'expired', 'not_applicable'])
    .optional()
    .default('not_applicable'),

  insurance_validity: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
}).refine((data) => {
  if (data.seller_type === 'individual') {
    return !!data.primary_phone;
  }
  return true;
}, {
  message: "Phone number is required for individual sellers",
  path: ['primary_phone'],
}).refine((data) => {
  if (data.seller_type === 'individual') {
    return !!data.rc_book_url && !!data.insurance_url;
  }
  return true;
}, {
  message: "RC Book and Insurance are required for individual sellers",
  path: ['rc_book_url'],
}).refine((data) => {
  // If insurance is valid, date must be provided and be a future date
  if (data.insurance_status === 'valid') {
    if (!data.insurance_validity || data.insurance_validity.trim() === '') {
      return false;
    }
    const inputDate = new Date(data.insurance_validity);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }
  return true;
}, {
  message: "Valid insurance requires a future expiry date",
  path: ['insurance_validity'],
});

export type CarListingFormData = z.infer<typeof carListingSchema>;

// Sanitization helper
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

// URL encoding helper for external APIs
export const encodeForUrl = (input: string): string => {
  return encodeURIComponent(input.trim());
};

// Validation helper for forms
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string[]> 
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!formattedErrors[path]) {
          formattedErrors[path] = [];
        }
        formattedErrors[path].push(err.message);
      });
      return { success: false, errors: formattedErrors };
    }
    return { success: false, errors: { _form: ['Validation failed'] } };
  }
};
