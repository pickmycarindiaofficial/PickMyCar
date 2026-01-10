import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const documentTypes = [
  { id: 'aadhaar', label: 'Aadhaar Card', required: true },
  { id: 'pan', label: 'PAN Card', required: true },
  { id: 'salary_proof', label: 'Salary Proof / Bank Statement', required: true },
  { id: 'bank_statement', label: 'Additional Bank Statement', required: false },
];

export default function LoanDocumentUpload() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplication();
  }, [token]);

  const fetchApplication = async () => {
    if (!token) return;

    try {
      const { data, error } = await (supabase as any)
        .from('loan_applications')
        .select('*, loan_documents(*)')
        .eq('upload_token', token)
        .maybeSingle();

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }

      if (!data) {
        setError('Invalid or expired link');
        return;
      }

      // Check if token is expired
      const expiresAt = (data as any).upload_token_expires_at;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        setError('This upload link has expired. Please contact our finance team.');
        return;
      }

      setApplication(data);

      // Map uploaded documents
      const uploaded: Record<string, boolean> = {};
      const docs = (data as any).loan_documents;
      if (Array.isArray(docs)) {
        docs.forEach((doc: any) => {
          uploaded[doc.document_type] = true;
        });
      }
      setUploadedDocs(uploaded);
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setUploading(documentType);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('token', token!);
      formData.append('documentType', documentType);
      formData.append('file', file);

      const response = await fetch(
        `https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/upload-loan-document`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadedDocs(prev => ({ ...prev, [documentType]: true }));
      toast.success('Document uploaded successfully!');

      if (result.data.allDocsUploaded) {
        toast.success('All required documents uploaded! Our team will review shortly.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center">Upload Link Invalid</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredDocs = documentTypes.filter(d => d.required);
  const uploadedRequired = requiredDocs.filter(d => uploadedDocs[d.id]).length;
  const allRequiredUploaded = uploadedRequired === requiredDocs.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Upload KYC Documents</h1>
          <p className="text-muted-foreground">
            Application #{application.application_number}
          </p>
        </div>

        {/* Application Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Applicant Name</p>
              <p className="font-medium">{application.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Car Details</p>
              <p className="font-medium">
                {application.car_brand} {application.car_model}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Car Price</p>
              <p className="font-medium">₹{application.car_price.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{application.status.replace('_', ' ')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span>Upload Progress</span>
              <span className="font-medium">
                {uploadedRequired} / {requiredDocs.length} required documents
              </span>
            </div>
            <Progress value={(uploadedRequired / requiredDocs.length) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Success Message */}
        {allRequiredUploaded && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              All required documents uploaded! Our finance team will review your application within 24-48 hours.
            </AlertDescription>
          </Alert>
        )}

        {/* Document Upload Cards */}
        <div className="space-y-4">
          {documentTypes.map(doc => {
            const isUploaded = uploadedDocs[doc.id];
            const isUploading = uploading === doc.id;

            return (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isUploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base">{doc.label}</CardTitle>
                        <CardDescription>
                          {doc.required ? 'Required' : 'Optional'} • PDF, JPG, or PNG (Max 5MB)
                        </CardDescription>
                      </div>
                    </div>
                    {isUploaded && (
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Uploaded
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isUploading ? (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div>
                      <Label
                        htmlFor={`file-${doc.id}`}
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploaded ? 'Replace File' : 'Choose File'}
                      </Label>
                      <input
                        id={`file-${doc.id}`}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(doc.id, file);
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Important Information:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>✓ Documents must be clear and readable</li>
              <li>✓ All corners of the document should be visible</li>
              <li>✓ Personal details should match across all documents</li>
              <li>✓ This link expires in 7 days from generation</li>
              <li>✓ You can upload or replace documents multiple times</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
