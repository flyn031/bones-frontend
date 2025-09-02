import { useState } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, AlertCircle, X, FileText, Loader2 } from 'lucide-react';

interface CustomerImportResponse {
  message: string;
  imported?: number;
  skipped?: number;
  errors?: string[];
}

const CustomerImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<CustomerImportResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setResult(null);
      setError('');
      setShowResult(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setError('');
    setShowResult(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('customers', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await axios.post<CustomerImportResponse>(
        `${apiUrl}/customers/import`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        }
      );
      
      setResult(response.data);
      setShowResult(true);
      setError('');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setShowResult(false), 5000);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to import customers. Please try again.';
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import Controls */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {/* File Selection */}
          <div className="relative">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>{file ? 'Change File' : 'Import Customers'}</span>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Upload Button - only show when file selected */}
          {file && (
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Upload</span>
                </>
              )}
            </button>
          )}
        </form>
      </div>

      {/* Selected File Display */}
      {file && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <FileText className="h-4 w-4 text-slate-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">
              {(file.size / 1024).toFixed(1)} KB • CSV file
            </p>
          </div>
          {!isUploading && (
            <button
              onClick={removeFile}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Success Result */}
      {showResult && result && !error && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-green-800">Import Completed</h4>
            <div className="mt-1 text-sm text-green-700">
              {result.imported && result.skipped ? (
                <div className="space-y-1">
                  <p>• {result.imported} new customers created</p>
                  <p>• {result.skipped} customers skipped (duplicates)</p>
                </div>
              ) : (
                <p>{result.message}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowResult(false)}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-800">Import Failed</h4>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CSV Format Help */}
      <div className="text-xs text-slate-500 space-y-1">
        <p><strong>CSV Format:</strong> name, email, phone, company, status</p>
        <p>Customers with existing email addresses will be skipped to prevent duplicates.</p>
      </div>
    </div>
  );
};

export default CustomerImport;