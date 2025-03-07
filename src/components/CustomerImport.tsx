import React, { useState } from 'react';
import axios from 'axios';
import { Upload } from 'lucide-react';

const CustomerImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('customers', file);

    try {
      const response = await axios.post('http://localhost:4000/api/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError('Failed to import customers. Please try again.');
      setMessage('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="inline-block">
        <label 
          className="flex items-center space-x-2 
                     px-3 py-1.5 
                     bg-blue-600 text-white 
                     rounded-md 
                     text-sm 
                     hover:bg-blue-700 
                     transition-colors
                     cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <span>Import Customers</span>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
        </label>
        {file && (
          <button
            type="submit"
            className="ml-2 
                       px-3 py-1.5 
                       bg-green-600 text-white 
                       rounded-md 
                       text-sm 
                       hover:bg-green-700 
                       transition-colors"
          >
            Upload
          </button>
        )}
      </form>
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CustomerImport;