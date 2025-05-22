import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock lucide-react icons - add all icons that your Orders component uses
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  RefreshCcw: () => <div data-testid="refresh-icon" />,
  Search: () => <div data-testid="search-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  MoreVertical: () => <div data-testid="more-icon" />,
  LayoutGrid: () => <div data-testid="layout-grid-icon" />,
  Table: () => <div data-testid="table-icon" />,
  Package: () => <div data-testid="package-icon" />,
  ArrowUpDown: () => <div data-testid="arrow-updown-icon" />
}));

// Mock UI components
jest.mock('../../components/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Alert: ({ message, ...props }: any) => <div role="alert" {...props}>{message}</div>,
  Input: ({ ...props }: any) => <input {...props} />
}));

// Mock OrderModal component
jest.mock('../../components/orders/OrderModal', () => {
  return function MockOrderModal({ isOpen, onClose, onSubmit, editOrder }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="order-modal">
        <button onClick={() => onSubmit({ projectTitle: 'Test Project' })}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

// Mock OrdersTableView component
jest.mock('../../components/orders/OrdersTableView', () => {
  return function MockOrdersTableView({ orders, onEdit, onUpdateStatus }: any) {
    return (
      <div data-testid="orders-table-view">
        {orders.map((order: any) => (
          <div key={order.id} data-testid={`order-row-${order.id}`}>
            {order.projectTitle}
            <button onClick={() => onEdit(order)}>Edit</button>
            <button onClick={() => onUpdateStatus(order)}>Update Status</button>
          </div>
        ))}
      </div>
    );
  };
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
  apiClient: mockApiClient
}));

// Mock the navigation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' })
}));

// Import Orders component after mocking dependencies
import Orders from '../../components/orders/Orders';

describe('Orders Component', () => {
  const mockOrders = [
    {
      id: 'order1',
      projectTitle: 'Kitchen Renovation',
      status: 'IN_PRODUCTION',
      customerName: 'John Smith',
      projectValue: 5000,
      leadTimeWeeks: 4,
      createdAt: '2025-03-01T10:30:00Z'
    },
    {
      id: 'order2',
      projectTitle: 'Bathroom Remodel',
      status: 'COMPLETED',
      customerName: 'Jane Doe',
      projectValue: 3500,
      leadTimeWeeks: 3,
      createdAt: '2025-02-15T14:45:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // No need to mock any API call for initial load
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/loading orders/i)).toBeInTheDocument();
  });

  test('shows error message when fetch fails', async () => {
    // Make the API call fail
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch orders/i)).toBeInTheDocument();
    });
  });

  test('shows retry button when fetch fails', async () => {
    // Make the API call fail
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the retry button
    await waitFor(() => {
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });

  test('displays orders when fetch succeeds', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the data to load and render
    await waitFor(() => {
      // Check for project titles
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
      expect(screen.getByText('Bathroom Remodel')).toBeInTheDocument();
      // Check for status values
      expect(screen.getByText('IN PRODUCTION')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });

  test('retries fetching orders when retry button is clicked', async () => {
    // First API call fails
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));
    
    // Second API call (after retry) succeeds
    mockApiClient.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the error and retry button
    await waitFor(() => {
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
    
    // Click the retry button
    fireEvent.click(screen.getByText(/try again/i));
    
    // Verify the API was called again
    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
    
    // Verify the data loaded after retry
    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
      expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument();
    });
  });

  test('filters orders locally when search input changes', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
      expect(screen.getByText('Bathroom Remodel')).toBeInTheDocument();
    });
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText(/search orders/i);
    
    // Type a search query
    fireEvent.change(searchInput, { target: { value: 'Kitchen' } });
    
    // Verify filtering happened on the client-side
    await waitFor(() => {
      // Kitchen Renovation should still be visible
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
      // Bathroom Remodel should be filtered out
      expect(screen.queryByText('Bathroom Remodel')).not.toBeInTheDocument();
    });
    
    // Verify no additional API calls were made for the search
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  test('opens filter section when filter button is clicked', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });
    
    // Filter section should not be visible initially
    expect(screen.queryByText(/All Statuses/i)).not.toBeInTheDocument();
    
    // Click the filter button
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    // Filter section should now be visible
    expect(screen.getByText(/All Statuses/i)).toBeInTheDocument();
  });

  test('toggles between grid and table view', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });
    
    // Should start with grid view (default)
    expect(screen.queryByTestId('orders-table-view')).not.toBeInTheDocument();
    
    // Click the table view button
    const tableButton = screen.getByTestId('table-icon').closest('button');
    fireEvent.click(tableButton);
    
    // Should now show table view
    expect(screen.getByTestId('orders-table-view')).toBeInTheDocument();
    
    // Click the grid view button
    const gridButton = screen.getByTestId('layout-grid-icon').closest('button');
    fireEvent.click(gridButton);
    
    // Should now hide table view
    expect(screen.queryByTestId('orders-table-view')).not.toBeInTheDocument();
  });

  test('opens order creation modal when Create Order button is clicked', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockOrders });
    mockApiClient.post.mockResolvedValueOnce({ data: { id: 'new-order', ...mockOrders[0] } });
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });
    
    // Modal should not be visible initially
    expect(screen.queryByTestId('order-modal')).not.toBeInTheDocument();
    
    // Click the "New Order" button
    const newOrderButton = screen.getByRole('button', { name: /new order/i });
    fireEvent.click(newOrderButton);
    
    // Modal should now be visible
    expect(screen.getByTestId('order-modal')).toBeInTheDocument();
    
    // Click the save button to submit form
    fireEvent.click(screen.getByText('Save'));
    
    // Verify API call was made to create order
    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith('/orders', expect.anything());
    });
  });

  test('displays order status update modal when update status button is clicked', async () => {
    // Mock successful API response
    mockApiClient.get.mockResolvedValueOnce({ data: mockOrders });
    
    render(
      <BrowserRouter>
        <Orders />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });
    
    // Status modal should not be visible initially
    expect(screen.queryByText(/Update Status for Kitchen Renovation/i)).not.toBeInTheDocument();
    
    // Click the "Update Status" button for the first order
    const updateStatusButtons = screen.getAllByText('Update Status');
    fireEvent.click(updateStatusButtons[0]);
    
    // Status modal should now be visible
    expect(screen.getByText(/Update Status for Kitchen Renovation/i)).toBeInTheDocument();
    
    // Click a status option (using text + role to be more specific)
    const statusButtons = screen.getAllByRole('button', { name: 'COMPLETED' });
    // Get the one that's inside the modal
    const modalStatusButton = Array.from(statusButtons).find(
      button => button.closest('.bg-white.p-6.rounded-lg.shadow-xl')
    );
    fireEvent.click(modalStatusButton);
    
    // Verify API call was made to update status
    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/orders/order1/status',
        { status: 'COMPLETED' }
      );
    });
  });
});