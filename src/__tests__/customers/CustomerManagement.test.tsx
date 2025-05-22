import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  User: () => <div data-testid="user-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Building: () => <div data-testid="building-icon" />,
  MapPin: () => <div data-testid="location-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  MoreVertical: () => <div data-testid="more-icon" />
}));

// Mock UI components
jest.mock('../../components/ui', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Alert: ({ message, ...props }) => <div role="alert" {...props}>{message}</div>,
  Input: ({ ...props }) => <input {...props} />,
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  Modal: ({ children, isOpen, onClose, ...props }) => (
    isOpen ? <div role="dialog" {...props}>{children}</div> : null
  )
}));

// Instead of mocking a specific component, let's mock any potential dialog content
// This avoids the need to know the exact structure of your form components
jest.mock('../../components/customers/CustomerManagement', () => {
  // Store the original module
  const originalModule = jest.requireActual('../../components/customers/CustomerManagement');
  
  // Create a mock component that exposes the same interface but has testable behavior
  const MockCustomerManagement = (props) => {
    // Render the real component
    const result = originalModule.default(props);
    
    // Intercept and mock any Modal or Dialog components
    // This approach means we don't need to know the exact structure of your form components
    const interceptedResult = React.cloneElement(result, {}, 
      React.Children.map(result.props.children, child => {
        // If this is a modal/dialog with form elements, add test IDs
        if (child?.type?.displayName === 'Modal' || child?.props?.role === 'dialog') {
          return React.cloneElement(child, { 'data-testid': 'customer-modal' });
        }
        return child;
      })
    );
    
    return interceptedResult;
  };
  
  return MockCustomerManagement;
});

// Create a separate mock for apiClient
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

// Mock the API module
jest.mock('../../utils/api', () => ({
  apiClient: mockApiClient,
  customerApi: {
    getCustomers: jest.fn().mockImplementation(params => mockApiClient.get('/customers', { params })),
    getCustomerById: jest.fn().mockImplementation(id => mockApiClient.get(`/customers/${id}`)),
    createCustomer: jest.fn().mockImplementation(data => mockApiClient.post('/customers', data)),
    updateCustomer: jest.fn().mockImplementation((id, data) => mockApiClient.put(`/customers/${id}`, data)),
    deleteCustomer: jest.fn().mockImplementation(id => mockApiClient.delete(`/customers/${id}`))
  }
}));

// Mock the navigation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' })
}));

// Import CustomerManagement component after mocking dependencies
import CustomerManagement from '../../components/customers/CustomerManagement';

describe('CustomerManagement Component', () => {
  const mockCustomers = [
    {
      id: 'cust1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, CA 94321',
      company: 'ABC Construction',
      notes: 'Prefers email communication',
      createdAt: '2025-01-15T10:30:00Z'
    },
    {
      id: 'cust2',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '(555) 987-6543',
      address: '456 Oak Ave, Somewhere, CA 94322',
      company: 'XYZ Properties',
      notes: 'Looking for kitchen remodel in summer',
      createdAt: '2025-02-20T14:45:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <CustomerManagement />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/loading customers/i)).toBeInTheDocument();
  });

  test('shows error message when fetch fails', async () => {
    // Make the API call fail
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <CustomerManagement />
      </BrowserRouter>
    );
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch customers/i)).toBeInTheDocument();
    });
  });

  test('displays customers when fetch succeeds', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers });
    
    render(
      <BrowserRouter>
        <CustomerManagement />
      </BrowserRouter>
    );
    
    // Wait for the data to load and render
    await waitFor(() => {
      // Check for customer names
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      // Check for customer emails
      expect(screen.getByText('john.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
    });
  });

  test('filters customers when search term is entered', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers });
    
    render(
      <BrowserRouter>
        <CustomerManagement />
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Type a search query
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Verify filtering occurred (this will depend on how your component handles filtering)
    // If it's client-side filtering:
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });
  });

  test('deletes a customer when delete button is clicked', async () => {
    // Mock successful API responses
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers });
    mockApiClient.delete.mockResolvedValueOnce({ success: true });
    mockApiClient.get.mockResolvedValueOnce({ data: [mockCustomers[1]] });
    
    render(
      <BrowserRouter>
        <CustomerManagement />
      </BrowserRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Find and click delete button for first customer (implementation may vary)
    const deleteButtons = screen.getAllByTestId('trash-icon');
    const firstDeleteButton = deleteButtons[0].closest('button');
    fireEvent.click(firstDeleteButton);
    
    // Handle confirmation if your component uses it
    const confirmButton = await screen.findByRole('button', { name: /confirm|delete|yes/i });
    fireEvent.click(confirmButton);
    
    // Verify delete API call was made
    await waitFor(() => {
      expect(mockApiClient.delete).toHaveBeenCalledWith(expect.stringContaining('/customers/'));
    });
    
    // Verify refresh occurred
    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });
});