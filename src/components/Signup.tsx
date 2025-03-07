import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Input, Alert } from '../components/ui';
import { Mail, Lock, User, Building2 } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post('http://localhost:4000/api/auth/signup', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('companyName', formData.companyName); // Store company name
      navigate('/dashboard'); // Redirect after signup
    } catch (err) {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-medium p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-neutral-900">
          Create Your Account
        </h2>

        {error && (
          <Alert 
            type="error" 
            message={error} 
            className="mb-4" 
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            leftIcon={User}
            required
          />

          <Input
            label="Company Name"
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Your company name"
            leftIcon={Building2}
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            leftIcon={Mail}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            leftIcon={Lock}
            required
          />

          <Button 
            type="submit" 
            fullWidth 
            className="mt-6"
          >
            Sign Up
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button 
            variant="ghost"
            onClick={() => navigate('/login')}
          >
            Already have an account? Log in
          </Button>
        </div>
      </div>
    </div>
  );
}