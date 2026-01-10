import { useState } from 'react';
import { FileText, Upload, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface DocumentUploaderProps {
  label: string;
  documentUrl?: string;
  onChange: (url: string) => void;
  required?: boolean;
  description?: string;
}

export function DocumentUploader({ 
  label, 
  documentUrl, 
  onChange, 
  required = false,
  description 
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to upload documents');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/documents/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('car-listings')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('car-listings')
        .getPublicUrl(data.path);

      onChange(publicUrl);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    toast.success('Document removed');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {documentUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {label}
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Document uploaded
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(documentUrl, '_blank')}
                >
                  View
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleRemove}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id={`document-${label}`}
            className="hidden"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          <label 
            htmlFor={`document-${label}`} 
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Upload Document'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF or Image, max 5MB
              </p>
            </div>
            
            {!uploading && (
              <Button type="button" size="sm" variant="outline">
                Select File
              </Button>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
