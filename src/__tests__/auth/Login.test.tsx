import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock UI components
jest.mock('../../components/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: ({ ...props }: any) => <input {...props} />,
  Alert: ({ message, ...props }: any) => <div role="alert" {...props}>{message}</div>
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />
}));

// Mock the API module
jest.mock('../../utils/api', () => ({
  apiClient: {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  },
  authApi: {
    login: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false
  })
}));

// Import the Login component after mocking its dependencies
const Login = require('../../components/Login').default;

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock image import
jest.mock('../../assets/images/login-background copy.jpeg', () => 'mocked-image-url');

describe('Login Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Check for key elements
    expect(screen.getByText(/sign in to bones crm/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    // Mock successful login response
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com', role: 'ADMIN' };
    const mockResponse = { data: { token: 'fake-token', user: mockUser } };
    mockedAxios.post.mockResolvedValueOnce(mockResponse);
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify the form submission and API call
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/login',
        { email: 'test@example.com', password: 'password123' }
      );
    });
  });

  test('handles failed login', async () => {
    // Mock failed login response
    const errorMessage = 'Invalid credentials';
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: errorMessage } },
    });
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Fill in the form with invalid credentials
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify the error message is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('toggles between login and register views', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Initially in login view
    expect(screen.getByText(/sign in to bones crm/i)).toBeInTheDocument();
    
    // Click the toggle button
    fireEvent.click(screen.getByText(/don't have an account\? register/i));
    
    // Now in register view
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
    
    // Toggle back to login
    fireEvent.click(screen.getByText(/already have an account\? sign in/i));
    
    // Back to login view
    expect(screen.getByText(/sign in to bones crm/i)).toBeInTheDocument();
  });
});