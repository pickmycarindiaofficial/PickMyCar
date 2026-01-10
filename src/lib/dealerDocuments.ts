import { supabase } from '@/integrations/supabase/client';

export type DocumentType = 'gst_certificate' | 'shop_registration' | 'pan_card' | 'owner_aadhar' | 'dealer_agreement';

export async function uploadDealerDocument(
  file: File,
  type: DocumentType,
  applicationId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${applicationId}/${type}_${Date.now()}.${fileExt}`;

  const { error: uploadError, data } = await supabase.storage
    .from('dealer-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  return data.path;
}

export async function deleteDealerDocument(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('dealer-documents')
    .remove([path]);

  if (error) {
    throw error;
  }
}

export async function getDealerDocumentUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from('dealer-documents')
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  return data.signedUrl;
}

export function validateGSTNumber(gst: string): boolean {
  const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
  return gstRegex.test(gst);
}

export function validatePANNumber(pan: string): boolean {
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function validatePincode(pincode: string): boolean {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
}
