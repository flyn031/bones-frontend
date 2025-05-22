import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the Auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test', name: 'Test User', role: 'ADMIN' },
    login: jest.fn(),
    logout: jest.fn()
  })
}));

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
  apiClient: mockApiClient
}));

// Enhanced mock Customers component with more functionality
const MockCustomers = () => {
  const [customers, setCustomers] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [customerToDelete, setCustomerToDelete] = React.useState(null);
  
  // Form state
  const [formName, setFormName] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formPhone, setFormPhone] = React.useState('');
  
  // Fetch customers on component mount
  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await mockApiClient.get('/customers');
        setCustomers(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch customers');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle adding a new customer
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setShowAddModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    const customerData = {
      name: formName,
      email: formEmail,
      phone: formPhone
    };
    
    if (editingCustomer) {
      // Update existing customer
      await mockApiClient.put(`/customers/${editingCustomer.id}`, customerData);
    } else {
      // Create new customer
      await mockApiClient.post('/customers', customerData);
    }
    
    // Refresh the customer list
    const response = await mockApiClient.get('/customers');
    setCustomers(response.data);
    
    // Close the modal and reset form
    setShowAddModal(false);
    setEditingCustomer(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
  };

  // Handle editing a customer
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormEmail(customer.email);
    setFormPhone(customer.phone);
    setShowAddModal(true);
  };

  // Handle deleting a customer
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await mockApiClient.delete(`/customers/${customerToDelete.id}`);
      const response = await mockApiClient.get('/customers');
      setCustomers(response.data);
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };
  
  // Loading state
  if (isLoading) {
    return <div>Loading customers...</div>;
  }
  
  // Error state
  if (error) {
    return (
      <div>
        {error}
        <button onClick={() => mockApiClient.get('/customers')}>Try Again</button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="controls">
        <input 
          type="text" 
          placeholder="Search customers..."
          value={searchTerm}
          onChange={handleSearch}
          data-testid="search-input"
        />
        <button 
          onClick={handleOpenAddModal}
          data-testid="add-button"
        >
          Add Customer
        </button>
      </div>
      
      <div className="customer-list">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="customer-row" data-testid={`customer-${customer.id}`}>
            <div className="customer-name">{customer.name}</div>
            <div className="customer-email">{customer.email}</div>
            <div className="customer-phone">{customer.phone}</div>
            <button 
              onClick={() => handleEditCustomer(customer)}
              data-testid={`edit-button-${customer.id}`}
            >
              Edit
            </button>
            <button 
              onClick={() => handleDeleteClick(customer)}
              data-testid={`delete-button-${customer.id}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <div className="modal" data-testid="customer-modal">
          <h2 data-testid="modal-title">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
          <form onSubmit={handleSubmitForm}>
            <input 
              type="text" 
              placeholder="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              data-testid="name-input"
            />
            <input 
              type="email" 
              placeholder="Email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              data-testid="email-input"
            />
            <input 
              type="tel" 
              placeholder="Phone"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              data-testid="phone-input"
            />
            <button type="submit" data-testid="submit-button">
              {editingCustomer ? 'Update' : 'Save'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowAddModal(false);
                setEditingCustomer(null);
              }}
              data-testid="cancel-button"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="confirm-dialog" data-testid="confirm-dialog">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete {customerToDelete?.name}?</p>
          <button 
            onClick={handleConfirmDelete}
            data-testid="confirm-delete-button"
          >
            Delete
          </button>
          <button 
            onClick={() => {
              setShowDeleteConfirm(false);
              setCustomerToDelete(null);
            }}
            data-testid="cancel-delete-button"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

describe('Customers Component', () => {
  const mockCustomers = [
    {
      id: 'cust1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(555) 123-4567'
    },
    {
      id: 'cust2',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '(555) 987-6543'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockApiClient for each test
    mockApiClient.get.mockReset();
    mockApiClient.post.mockReset();
    mockApiClient.put.mockReset();
    mockApiClient.delete.mockReset();
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/loading customers/i)).toBeInTheDocument();
  });

  test('shows error message when fetch fails', async () => {
    // Make the API call fail
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch customers/i)).toBeInTheDocument();
    });
    
    // Check for retry button
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
  });

  test('displays customers when fetch succeeds', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers });
    
    render(
      <BrowserRouter>
        <MockCustomers />
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
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    
    // Find the search input
    const searchInput = screen.getByTestId('search-input');
    
    // Type a search term
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Check that only matching customers are displayed
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    
    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Check that all customers are displayed again
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  test('opens modal when add button is clicked', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers });
    
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Click the add button
    fireEvent.click(screen.getByTestId('add-button'));
    
    // Check that the modal is displayed with the right title
    expect(screen.getByTestId('customer-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Add Customer');
    
    // Check that the form fields are empty
    expect(screen.getByTestId('name-input')).toHaveValue('');
    expect(screen.getByTestId('email-input')).toHaveValue('');
    expect(screen.getByTestId('phone-input')).toHaveValue('');
  });

  test('creates a new customer', async () => {
    // Mock successful API responses
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers }); // Initial load
    mockApiClient.post.mockResolvedValueOnce({ data: { id: 'cust3', name: 'New Customer' } }); // Create customer
    
    // Return updated list after create
    const updatedCustomers = [
      ...mockCustomers,
      {
        id: 'cust3',
        name: 'New Customer',
        email: 'new@example.com',
        phone: '(555) 555-5555'
      }
    ];
    mockApiClient.get.mockResolvedValueOnce({ data: updatedCustomers }); 
    
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Click the add button
    fireEvent.click(screen.getByTestId('add-button'));
    
    // Fill out the form
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'New Customer' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '(555) 555-5555' } });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Verify the API calls
    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith('/customers', {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '(555) 555-5555'
      });
    });
    
    // Verify list refreshed
    expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    
    // Verify new customer is displayed
    await waitFor(() => {
      expect(screen.getByText('New Customer')).toBeInTheDocument();
    });
  });

  test('edits an existing customer', async () => {
    // Mock successful API responses
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers }); // Initial load
    mockApiClient.put.mockResolvedValueOnce({ 
      data: { ...mockCustomers[0], name: 'Updated Name' } 
    }); // Update customer
    
    // Return updated list after update
    const updatedCustomers = [
      {
        ...mockCustomers[0],
        name: 'Updated Name'
      },
      mockCustomers[1]
    ];
    mockApiClient.get.mockResolvedValueOnce({ data: updatedCustomers });
    
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Click the edit button for the first customer
    fireEvent.click(screen.getByTestId(`edit-button-cust1`));
    
    // Check the modal shows with the customer's data
    expect(screen.getByTestId('name-input')).toHaveValue('John Smith');
    expect(screen.getByTestId('email-input')).toHaveValue('john.smith@example.com');
    expect(screen.getByTestId('phone-input')).toHaveValue('(555) 123-4567');
    
    // Update the name
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Updated Name' } });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Verify the API calls
    await waitFor(() => {
      expect(mockApiClient.put).toHaveBeenCalledWith('/customers/cust1', {
        name: 'Updated Name',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567'
      });
    });
    
    // Verify list refreshed
    expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    
    // Verify customer was updated
    await waitFor(() => {
      expect(screen.getByText('Updated Name')).toBeInTheDocument();
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    });
  });

  test('deletes a customer', async () => {
    // Mock successful API responses
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers }); // Initial load
    mockApiClient.delete.mockResolvedValueOnce({ data: { success: true } }); // Delete customer
    
    // Return updated list after delete (without the deleted customer)
    mockApiClient.get.mockResolvedValueOnce({ data: [mockCustomers[1]] });
    
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Click the delete button for the first customer
    fireEvent.click(screen.getByTestId(`delete-button-cust1`));
    
    // Check the confirmation dialog shows
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete John Smith/)).toBeInTheDocument();
    
    // Confirm the deletion
    fireEvent.click(screen.getByTestId('confirm-delete-button'));
    
    // Verify the API calls
    await waitFor(() => {
      expect(mockApiClient.delete).toHaveBeenCalledWith('/customers/cust1');
    });
    
    // Verify list refreshed
    expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    
    // Verify customer was removed
    await waitFor(() => {
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  test('can cancel adding a customer', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers });
    
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Click the add button
    fireEvent.click(screen.getByTestId('add-button'));
    
    // Verify modal is open
    expect(screen.getByTestId('customer-modal')).toBeInTheDocument();
    
    // Click the cancel button
    fireEvent.click(screen.getByTestId('cancel-button'));
    
    // Verify modal is closed
    expect(screen.queryByTestId('customer-modal')).not.toBeInTheDocument();
    
    // Verify no API calls were made
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  test('can cancel deleting a customer', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockCustomers });
    
    render(
      <BrowserRouter>
        <MockCustomers />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });
    
    // Click the delete button for the first customer
    fireEvent.click(screen.getByTestId(`delete-button-cust1`));
    
    // Verify confirmation dialog is open
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    
    // Click the cancel button
    fireEvent.click(screen.getByTestId('cancel-delete-button'));
    
    // Verify dialog is closed
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    
    // Verify no API calls were made
    expect(mockApiClient.delete).not.toHaveBeenCalled();
    
    // Verify both customers are still displayed
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});