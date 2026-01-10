import { useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadDealerDocument, DocumentType } from '@/lib/dealerDocuments';
import { toast } from '@/hooks/use-toast';

interface DocumentUploadFieldProps {
  label: string;
  documentType: DocumentType;
  applicationId: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  accept?: string;
}

export function DocumentUploadField({
  label,
  documentType,
  applicationId,
  value,
  onChange,
  required = false,
  accept = 'application/pdf,image/jpeg,image/png,image/webp',
}: DocumentUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const path = await uploadDealerDocument(file, documentType, applicationId);
      onChange(path);
      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setFileName('');
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        {value ? (
          <div className="flex items-center gap-2 flex-1 p-3 border rounded-md bg-muted/50">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm flex-1 truncate">{fileName || 'Document uploaded'}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex-1">
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id={`upload-${documentType}`}
            />
            <label htmlFor={`upload-${documentType}`}>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Choose file
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Accepted formats: PDF, JPG, PNG, WEBP (Max 10MB)
      </p>
    </div>
  );
}
