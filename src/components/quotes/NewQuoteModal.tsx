import React, { useState, useEffect, useCallback } from "react";
import { X, Search, UserPlus, Plus, History, Clock, Save, RefreshCw, Check, Clock3, X as XIcon, AlertTriangle } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config/constants";
import FrequentItemSelector from "./FrequentItemSelector";
import BundleSelector from "./BundleSelector";
import PriceHistoryDisplay from "./PriceHistoryDisplay";
import SaveTemplateModal from "./SaveTemplateModal";
import { JobsResponse, MaterialPriceResponse, CreateCustomerResponse, ApiErrorResponse } from "../../types/api";
import { Customer, QuoteData, QuoteItem, QuoteStatus } from "../../types/quote";

// Define conveyors and materials
interface Item {
  id: string;
  name: string;
  code: string;
  unitPrice: number;
  unit: string;
  category: string;
  description?: string;
}

interface SelectedItem extends Item {
  quantity: number;
  total: number;
}

interface NewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuoteData) => void;
  editQuote?: QuoteData | null;
  customers?: Customer[];
}

// ✅ FIXED - Job interface with proper typing
interface Job {
  id: string;
  title: string;
  projectTitle: string; // Always string, never undefined
}

// Available quote statuses - FIXED to match backend enum exactly
const QUOTE_STATUSES: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent to Customer",
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CONVERTED: "Converted to Order"
};

// Status descriptions for tooltips
const STATUS_DESCRIPTIONS: Record<QuoteStatus, string> = {
  DRAFT: "Initial creation stage, still being worked on",
  SENT: "Quote has been sent to the customer",
  PENDING: "Awaiting customer's decision",
  APPROVED: "Customer has accepted the quote",
  DECLINED: "Customer has declined the quote",
  EXPIRED: "Quote has passed its validity date",
  CONVERTED: "Quote has been converted to an order"
};

// Status colors for visual representation
const STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string; border: string; icon: JSX.Element }> = {
  DRAFT: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    icon: <Clock className="h-4 w-4 mr-1" />
  },
  SENT: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-200",
    icon: <Clock3 className="h-4 w-4 mr-1" />
  },
  PENDING: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
    icon: <Clock3 className="h-4 w-4 mr-1" />
  },
  APPROVED: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    icon: <Check className="h-4 w-4 mr-1" />
  },
  DECLINED: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    icon: <XIcon className="h-4 w-4 mr-1" />
  },
  EXPIRED: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
    icon: <AlertTriangle className="h-4 w-4 mr-1" />
  },
  CONVERTED: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: <Check className="h-4 w-4 mr-1" />
  }
};

// ✅ FIXED - Enhanced mock data for jobs with proper typing
const mockJobs: Job[] = [
  { id: "J2024-001", title: "Acme Factory Installation", projectTitle: "Acme Factory Installation" },
  { id: "J2024-002", title: "BuildCo Maintenance", projectTitle: "BuildCo Maintenance" },
  { id: "J2024-003", title: "Steel Supply Project", projectTitle: "Steel Supply Project" },
  { id: "J2024-004", title: "Conveyor Belt Replacement", projectTitle: "Conveyor Belt Replacement" },
  { id: "J2024-005", title: "Warehouse Automation", projectTitle: "Warehouse Automation" },
  { id: "J2024-006", title: "Machine Servicing", projectTitle: "Machine Servicing" }
];

export default function NewQuoteModal({
  isOpen,
  onClose,
  onSubmit,
  editQuote,
  customers = [],
}: NewQuoteModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
  });

  const [quoteData, setQuoteData] = useState<Partial<QuoteData>>({
    title: "",
    customer: "",
    customerId: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    jobId: "",
    validityDays: 30,
    terms: "Net 30",
    notes: "",
    items: [],
    customerReference: "", // Initialize customer reference field
    status: "DRAFT" // Default status for new quotes - FIXED: Use valid QuoteStatus
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // State for materials inventory from API
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsRefreshKey, setMaterialsRefreshKey] = useState(0);
  
  // State for price history functionality
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  
  // State for save template functionality
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  
  // State for status changes
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<QuoteStatus | null>(null);
  
  // ✅ FIXED - State for jobs with proper typing
  const [jobs, setJobs] = useState<Job[]>(mockJobs);

  // Get status styling based on current status - FIXED: Use QuoteStatus type
  const getStatusStyles = (status: QuoteStatus) => {
    return STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
  };

  // Create a memoized function to fetch materials
  const fetchMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/materials`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Materials API response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Map the API response to the Item interface format
        const materials = response.data.map((material: any) => ({
          id: material.id,
          name: material.name,
          code: material.code || `MAT-${material.id.substring(0, 4)}`,
          unitPrice: material.unitPrice,
          unit: material.unit || 'unit',
          category: material.category || 'OTHER',
          description: material.description,
          currentStockLevel: material.currentStockLevel,
          inventoryPurpose: material.inventoryPurpose,
          isQuotable: material.isQuotable
        }));
        
        console.log(`Loaded ${materials.length} materials from API`);
        setInventoryItems(materials);
      } else {
        console.warn('Material API returned unexpected format, setting empty array');
        setInventoryItems([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      // Set empty array instead of fallback catalog
      setInventoryItems([]);
    } finally {
      setMaterialsLoading(false);
    }
  }, []);
  
  // Trigger materials refresh when modal opens or refresh key changes
  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
    }
  }, [isOpen, materialsRefreshKey, fetchMaterials]);

  // Function to manually refresh materials
  const handleRefreshMaterials = () => {
    setMaterialsRefreshKey(prev => prev + 1);
  };

  // ✅ FIXED - Helper function to ensure job has proper projectTitle
  const normalizeJob = (job: any): Job => ({
    id: job.id,
    title: job.title || `Job ${job.id}`,
    projectTitle: job.projectTitle || job.title || `Job ${job.id}` || 'Untitled Job'
  });

  // ✅ FIXED - Fetch jobs from API with proper type handling
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching jobs with token:", token ? "Token exists" : "No token");
        
        // Try fetching from the jobs endpoint
        const response = await axios.get(
          `${API_URL}/jobs`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        console.log("Raw jobs API response:", response.data);
        
        // Type assertion for jobs response
        const jobsData = response.data as JobsResponse;
        
        // Check if we got an array of jobs directly
        if (Array.isArray(response.data)) {
          console.log("Found jobs array in response:", response.data.length);
          setJobs(response.data.map(normalizeJob));
          return;
        }
        
        // If not an array, check for nested jobs
        if (jobsData && typeof jobsData === 'object') {
          // Try common nested structures
          if (jobsData.jobs && Array.isArray(jobsData.jobs)) {
            setJobs(jobsData.jobs.map(normalizeJob));
            return;
          }
          
          if (jobsData.data && Array.isArray(jobsData.data)) {
            setJobs(jobsData.data.map(normalizeJob));
            return;
          }
          
          // Look for the first array property
          for (const key in jobsData) {
            if (Array.isArray((jobsData as any)[key])) {
              setJobs((jobsData as any)[key].map(normalizeJob));
              return;
            }
          }
        }
        
        // Try fetching from a different endpoint
        console.log("Trying alternate endpoint...");
        try {
          const alt1Response = await axios.get(
            `${API_URL}/jobs/all`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          if (Array.isArray(alt1Response.data)) {
            setJobs(alt1Response.data.map(normalizeJob));
            return;
          }
        } catch (err) {
          console.log("Alternate endpoint failed");
        }
        
        // As a last resort, use the enhanced mock data
        console.warn('All attempts failed, using enhanced mock data');
        setJobs(mockJobs);
        
      } catch (error) {
        console.error("Error fetching jobs:", error);
        // Fallback to the enhanced mock jobs if API fails
        setJobs(mockJobs);
      }
    };
    
    fetchJobs();
  }, []);

  // Initialize form when editing a quote
  useEffect(() => {
    if (editQuote) {
      console.log("Initializing edit quote data:", editQuote);
      
      // Check for items in different possible locations
      const quoteItems = editQuote.items || editQuote.lineItems || [];
      console.log("Quote line items for editing:", quoteItems);
      
      setQuoteData({
        title: editQuote.title,
        customer: editQuote.customer,
        customerId: editQuote.customerId,
        contactPerson: editQuote.contactPerson || "",
        contactEmail: editQuote.contactEmail || "",
        contactPhone: editQuote.contactPhone || "",
        jobId: editQuote.jobId || "",
        validityDays: editQuote.validityDays || 30,
        terms: editQuote.terms || "Net 30",
        notes: editQuote.notes || "",
        quoteNumber: editQuote.quoteNumber || "", // Set quote number if available
        customerReference: editQuote.customerReference || "", // Set customer reference if available
        status: editQuote.status || "DRAFT" // Set status if available - FIXED: Use valid QuoteStatus
      });

      // Set selected customer if available
      if (editQuote.customerId) {
        const customer = Array.isArray(customers)
          ? customers.find((c) => c.id === editQuote.customerId)
          : null;
        if (customer) {
          setSelectedCustomer(customer);
        }
      }

      // Process items from the quote
      if (quoteItems && quoteItems.length > 0) {
        const processedItems: SelectedItem[] = [];
        
        quoteItems.forEach(item => {
          // Try to find matching inventory item
          const inventoryMatch = inventoryItems.find(inv => inv.id === item.id);
          
          // Create the selected item with available data
          const selectedItem: SelectedItem = {
            id: item.id,
            name: item.description || (inventoryMatch ? inventoryMatch.name : "Unknown Item"),
            description: inventoryMatch?.description || item.description,
            code: inventoryMatch?.code || "INV-" + item.id.substring(0, 4),
            unitPrice: item.unitPrice || (inventoryMatch ? inventoryMatch.unitPrice : 0),
            quantity: item.quantity || 1,
            unit: inventoryMatch?.unit || "unit",
            category: inventoryMatch?.category || "OTHER",
            total: (item.quantity || 1) * (item.unitPrice || 0)
          };
          
          processedItems.push(selectedItem);
        });
        
        setSelectedItems(processedItems);
      } else {
        setSelectedItems([]);
      }
    }
  }, [editQuote, customers, inventoryItems]);

  // Debug customers data
  useEffect(() => {
    console.log("Customers data in modal:", customers);
    console.log("Is Array:", Array.isArray(customers));
    if (Array.isArray(customers) && customers.length > 0) {
      console.log("First customer:", customers[0]);
    }
  }, [customers]);

  // Debug jobs data
  useEffect(() => {
    console.log("Jobs available for dropdown:", jobs);
    console.log("Number of jobs available:", jobs.length);
  }, [jobs]);

  // Function to fetch customer-specific pricing
  const fetchCustomerSpecificPrice = async (materialId: string, customerId: string) => {
    if (!customerId || !materialId) return null;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/customer-pricing`,
        {
          params: {
            materialId,
            customerId,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Type assertion for material price response
      const priceData = response.data as MaterialPriceResponse;
      
      if (priceData && priceData.unitPrice) {
        return priceData.unitPrice;
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching customer-specific price:", error);
      return null;
    }
  };

  // Add an item to the quote
  const addItem = async (item: Item) => {
    // Check for customer-specific pricing if a customer is selected
    let unitPrice = item.unitPrice;
    
    if (selectedCustomer && selectedCustomer.id) {
      const customerPrice = await fetchCustomerSpecificPrice(item.id, selectedCustomer.id);
      if (customerPrice !== null) {
        unitPrice = customerPrice;
      }
    }
    
    const alreadyExists = selectedItems.findIndex((i) => i.id === item.id);

    if (alreadyExists >= 0) {
      // Increment quantity if already added
      const updatedItems = [...selectedItems];
      updatedItems[alreadyExists].quantity += 1;
      updatedItems[alreadyExists].total =
        updatedItems[alreadyExists].quantity *
        updatedItems[alreadyExists].unitPrice;
      setSelectedItems(updatedItems);
    } else {
      // Add new item
      setSelectedItems([
        ...selectedItems,
        {
          ...item,
          quantity: 1,
          total: unitPrice,
          unitPrice: unitPrice, // Use customer-specific price if available
        },
      ]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;

    const newItems = [...selectedItems];
    newItems[index].quantity = quantity;
    newItems[index].total = quantity * newItems[index].unitPrice;
    setSelectedItems(newItems);
  };

  // Remove item from quote
  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Calculate total quote value
  const calculateTotal = (): number =>
    selectedItems.reduce((sum, item) => sum + item.total, 0);

  // Select a customer
  const handleSelectCustomer = (customer: Customer) => {
    console.log("Selected customer:", customer);
    setSelectedCustomer(customer);
    setQuoteData({
      ...quoteData,
      customer: customer.name || "",
      customerId: customer.id || "",
      contactPerson: customer.contactPerson || "",
      contactEmail: customer.email || "",
      contactPhone: customer.phone || "",
    });
    setShowCustomerDropdown(false);
  };

  // Toggle price history for a material
  const handleTogglePriceHistory = (materialId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (selectedMaterialId === materialId && showPriceHistory) {
      // If clicking on the same material and price history is shown, hide it
      setShowPriceHistory(false);
    } else {
      // Otherwise show price history for the selected material
      setSelectedMaterialId(materialId);
      setShowPriceHistory(true);
    }
  };
  
  // Handle adding items from FrequentItemSelector
  const handleAddFrequentItems = (items: any[]) => {
    const newItems = items.map(item => ({
      ...item,
      id: item.materialId || item.id,
      name: item.description,
      code: item.code || "FREQ",
      unit: item.unit || "unit",
      category: item.category || "frequent",
      total: item.quantity * item.unitPrice,
    }));
    
    // Check if the item already exists, if so increment the quantity
    const updatedItems = [...selectedItems];
    
    newItems.forEach(newItem => {
      const existingIndex = updatedItems.findIndex(i => i.id === newItem.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        updatedItems[existingIndex].quantity += newItem.quantity;
        updatedItems[existingIndex].total = 
          updatedItems[existingIndex].quantity * updatedItems[existingIndex].unitPrice;
      } else {
        // Add new item
        updatedItems.push(newItem);
      }
    });
    
    setSelectedItems(updatedItems);
  };

  // Handle adding a bundle
  const handleAddBundle = (bundle: any) => {
    // Calculate discounted price for each item
    const discountMultiplier = 1 - (bundle.discount / 100);
    
    const bundleItems = bundle.items.map((item: any) => ({
      id: item.materialId,
      name: item.materialName,
      description: item.description || item.materialName,
      quantity: item.quantity,
      unitPrice: item.unitPrice * discountMultiplier,
      unit: item.unit || "unit",
      category: item.category || "bundle",
      code: item.code || "BDL",
      total: item.quantity * (item.unitPrice * discountMultiplier),
    }));
    
    // Add all bundle items to the selected items
    setSelectedItems([...selectedItems, ...bundleItems]);
  };

  // Validate if status change is allowed - FIXED: Use QuoteStatus type
  const isValidStatusChange = (currentStatus: QuoteStatus, newStatus: QuoteStatus): boolean => {
    // Define valid status transitions
    const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      'DRAFT': ['SENT', 'PENDING', 'APPROVED', 'DECLINED', 'EXPIRED'],
      'SENT': ['PENDING', 'APPROVED', 'DECLINED', 'EXPIRED'],
      'PENDING': ['APPROVED', 'DECLINED', 'EXPIRED'],
      'APPROVED': ['CONVERTED', 'EXPIRED'],
      'DECLINED': ['DRAFT'], // Can revert to draft to try again
      'EXPIRED': ['DRAFT'], // Can revert to draft to try again
      'CONVERTED': [] // Cannot change status once converted
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  // Handle status change with confirmation - FIXED: Use QuoteStatus type
  const handleStatusChange = (newStatus: QuoteStatus) => {
    // If status is the same, do nothing
    if (quoteData.status === newStatus) return;
    
    // Check if this is a valid status change
    if (!isValidStatusChange(quoteData.status as QuoteStatus || 'DRAFT', newStatus)) {
      alert(`Cannot change status from ${QUOTE_STATUSES[quoteData.status as QuoteStatus]} to ${QUOTE_STATUSES[newStatus]}`);
      return;
    }
    
    // If changing from DRAFT to PENDING or APPROVED, confirm first
    if ((quoteData.status === 'DRAFT' && (newStatus === 'PENDING' || newStatus === 'APPROVED')) ||
        (newStatus === 'CONVERTED')) {
      setPendingStatusChange(newStatus);
      setShowStatusConfirmation(true);
    } else {
      // For other status changes, apply immediately
      setQuoteData({
        ...quoteData,
        status: newStatus
      });
    }
  };

  // Confirm status change
  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      setQuoteData({
        ...quoteData,
        status: pendingStatusChange
      });
      setPendingStatusChange(null);
      setShowStatusConfirmation(false);
    }
  };

  // Create a new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;

    try {
      // In a real app, you would send this to your API
      const token = localStorage.getItem("token");
      // Send actual API request to create customer
      const response = await axios.post(
        `${API_URL}/customers`,
        {
          name: newCustomer.name,
          email: newCustomer.email || "",
          phone: newCustomer.phone || "",
          address: newCustomer.address || "",
          contactPerson: newCustomer.contactPerson || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Customer creation response:", response.data);

      // Type assertion for customer creation response
      const customerData = response.data as CreateCustomerResponse;

      // Use the returned customer or create a fallback if API response is unexpected
      const createdCustomer: Customer =
        customerData && typeof customerData === "object"
          ? {
              id: customerData.id || `cust${Date.now()}`,
              name: customerData.name || newCustomer.name || "",
              email: customerData.email || newCustomer.email || "",
              phone: customerData.phone || newCustomer.phone || undefined,
              address: customerData.address || newCustomer.address || undefined,
              contactPerson:
                customerData.contactPerson || newCustomer.contactPerson || undefined,
            }
          : {
              id: `cust${Date.now()}`,
              name: newCustomer.name || "",
              email: newCustomer.email || "",
              phone: newCustomer.phone || undefined,
              address: newCustomer.address || undefined,
              contactPerson: newCustomer.contactPerson || undefined,
            };

      // Select the new customer
      handleSelectCustomer(createdCustomer);

      // Reset form and hide it
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        contactPerson: "",
      });
      setShowNewCustomerForm(false);
    } catch (error: any) {
      console.error("Error creating customer:", error);
      
      // Type assertion for error handling
      const errorData = error as { response?: { data?: ApiErrorResponse; status?: number } };
      if (errorData.response) {
        console.error("Error response:", errorData.response.data);
        console.error("Status code:", errorData.response.status);
      }

      // Even on error, create a temporary customer for the quote
      // This allows the user to continue without losing their work
      const tempCustomer: Customer = {
        id: `temp_${Date.now()}`,
        name: newCustomer.name || "",
        email: newCustomer.email || "",
        phone: newCustomer.phone || undefined,
        address: newCustomer.address || undefined,
        contactPerson: newCustomer.contactPerson || undefined,
      };

      handleSelectCustomer(tempCustomer);
      setShowNewCustomerForm(false);

      // Inform the user
      alert(
        "There was an error saving the customer to the database, but you can continue creating the quote with this customer information."
      );
    }
  };

  // Handle customer reference change
  const handleCustomerReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuoteData({
      ...quoteData,
      customerReference: e.target.value
    });
  };

  // Submit the quote
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("NewQuoteModal: handleSubmit triggered!"); // ADDED LOG

    const totalValue = calculateTotal();

    // Format items for submission
    const formattedItems: QuoteItem[] = selectedItems.map((item) => ({
      id: item.id,
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      materialId: item.id, // Use item.id as materialId since items are materials
    }));

    // Create complete quote data
    const completeQuoteData: QuoteData = {
      ...(quoteData as QuoteData),
      items: formattedItems,
      totalAmount: totalValue, // Fixed: Use totalAmount instead of value
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(
        Date.now() + (quoteData.validityDays || 30) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
    };

    onSubmit(completeQuoteData);
    console.log("NewQuoteModal: onSubmit (prop) called with data:", completeQuoteData); // ADDED LOG
  };

  if (!isOpen) return null;

  // Filter items by search term and category
  const filteredItems = inventoryItems.filter(
    (item) =>
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (categoryFilter === "all" || item.category === categoryFilter)
  );

  // Filter customers by search term
  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(
        (customer) =>
          (customer.name &&
            customer.name
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase())) ||
          (customer.email &&
            customer.email
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase())) ||
          (customer.contactPerson &&
            customer.contactPerson
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase()))
      )
    : [];

  // Get current status style - FIXED: Use QuoteStatus type
  const currentStatusStyle = getStatusStyles(quoteData.status as QuoteStatus || 'DRAFT');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {editQuote ? "Edit Quote" : "Create New Quote"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enhanced Status Section */}
          <div className={`p-4 rounded-lg border ${currentStatusStyle.border}`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-800">Quote Status</h3>
                <p className="text-sm text-gray-500">
                  {STATUS_DESCRIPTIONS[quoteData.status as QuoteStatus] || 
                   "Current status of this quote"}
                </p>
            </div>

          {/* Basic Information */}<div className="flex items-center">
                <div className="mr-2 text-gray-700">Current Status:</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${currentStatusStyle.bg} ${currentStatusStyle.text}`}>
                  {currentStatusStyle.icon}
                  {QUOTE_STATUSES[quoteData.status as QuoteStatus] || quoteData.status}
                </span>
              </div>
            </div>

            {/* Visual Status Progress Bar */}
            <div className="mt-4">
              <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                {/* DRAFT - Red */}
                <div 
                  className={`h-full bg-red-500 ${
                    ['DRAFT'].includes(quoteData.status || '') ? 'flex-grow' : 'w-1/6'
                  }`}
                ></div>
                
                {/* SENT/PENDING - Amber */}
                <div 
                  className={`h-full bg-yellow-500 ${
                    ['SENT', 'PENDING'].includes(quoteData.status || '') ? 'flex-grow' : 
                    quoteData.status === 'DRAFT' ? 'w-0' : 'w-1/6'
                  }`}
                ></div>
                
                {/* APPROVED - Green */}
                <div 
                  className={`h-full bg-green-500 ${
                    ['APPROVED'].includes(quoteData.status || '') ? 'flex-grow' : 
                    ['DRAFT', 'SENT', 'PENDING'].includes(quoteData.status || '') ? 'w-0' : 'w-1/6'
                  }`}
                ></div>
                
                {/* CONVERTED - Blue */}
                <div 
                  className={`h-full bg-blue-500 ${
                    ['CONVERTED'].includes(quoteData.status || '') ? 'flex-grow' : 
                    ['DRAFT', 'SENT', 'PENDING', 'APPROVED'].includes(quoteData.status || '') ? 'w-0' : 'w-1/6'
                  }`}
                ></div>
              </div>
              
              {/* Status Labels */}
              <div className="flex justify-between text-xs mt-1">
                <div className="text-red-600 font-medium">Draft</div>
                <div className="text-yellow-600 font-medium">Pending</div>
                <div className="text-green-600 font-medium">Approved</div>
                <div className="text-blue-600 font-medium">Converted</div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(QUOTE_STATUSES) as [QuoteStatus, string][]).map(([status, label]) => {
                  // Don't show CONVERTED option in dropdown as it's only set by the system
                  if (status === 'CONVERTED' && quoteData.status !== 'CONVERTED') return null;
                  
                  const statusStyle = getStatusStyles(status);
                  const isDisabled = quoteData.status === status || 
                                    (quoteData.status === 'CONVERTED') || 
                                    !isValidStatusChange(quoteData.status as QuoteStatus || 'DRAFT', status);
                  
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      disabled={isDisabled}
                      className={`px-3 py-1 text-sm rounded-lg border flex items-center
                        ${quoteData.status === status 
                          ? `${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}` 
                          : isDisabled
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500'
                            : `hover:${statusStyle.bg} border-gray-300 hover:${statusStyle.text}`
                        }
                      `}
                      title={STATUS_DESCRIPTIONS[status]}
                    >
                      {statusStyle.icon}
                      {label}
                    </button>
                  );
                })}
              </div>
              {quoteData.status === 'CONVERTED' && (
                <p className="text-sm text-blue-600 mt-2">
                  This quote has been converted to an order and can no longer be edited.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Title*
              </label>
              <input
                type="text"
                required
                value={quoteData.title}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, title: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer*
              </label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between border p-2 rounded-lg">
                  <div>
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-gray-500">
                      {selectedCustomer.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-gray-100"
                    title="Change Customer"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {!showNewCustomerForm ? (
                    <>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search customers..."
                            value={customerSearchTerm}
                            onChange={(e) => {
                              setCustomerSearchTerm(e.target.value);
                              setShowCustomerDropdown(true);
                            }}
                            onClick={() => setShowCustomerDropdown(true)}
                            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewCustomerForm(true)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          <span>New</span>
                        </button>
                      </div>
                      {showCustomerDropdown && (
                        <div className="max-h-40 overflow-y-auto border rounded-lg">
                          {Array.isArray(filteredCustomers) &&
                          filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id || Math.random().toString()}
                                className="p-2 hover:bg-gray-50 cursor-pointer border-b"
                                onClick={() => handleSelectCustomer(customer)}
                              >
                                <div className="font-medium">
                                  {customer.name || "Unnamed Customer"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customer.contactPerson
                                    ? `Contact: ${customer.contactPerson} • `
                                    : ""}
                                  {customer.email || "No email"}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-center text-gray-500">
                              No customers found
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 border rounded-lg p-3">
                        <h3 className="font-medium">New Customer</h3>
                        <div>
                          <label className="block text-xs text-gray-500">
                            Name*
                          </label>
                          <input
                            type="text"
                            required
                            value={newCustomer.name || ""}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                name: e.target.value,
                              })
                            }
                            className="w-full p-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            Contact Person
                          </label>
                          <input
                            type="text"
                            value={newCustomer.contactPerson || ""}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                contactPerson: e.target.value,
                              })
                            }
                            className="w-full p-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500">
                              Email
                            </label>
                            <input
                              type="email"
                              value={newCustomer.email}
                              onChange={(e) =>
                                setNewCustomer({
                                  ...newCustomer,
                                  email: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={newCustomer.phone || ""}
                              onChange={(e) =>
                                setNewCustomer({
                                  ...newCustomer,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full p-2 border rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            Address
                          </label>
                          <textarea
                            value={newCustomer.address || ""}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                address: e.target.value,
                              })
                            }
                            rows={2}
                            className="w-full p-2 border
                            rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowNewCustomerForm(false)}
                            className="px-2 py-1 text-sm border rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateCustomer}
                            className="px-2 py-1 text-sm bg-green-600 text-white rounded-lg"
                          >
                            Create Customer
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={quoteData.contactPerson || ""}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, contactPerson: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={quoteData.contactEmail || ""}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, contactEmail: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={quoteData.contactPhone || ""}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, contactPhone: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* References, Job Linking and Terms */}
          <div className="grid grid-cols-4 gap-4">
            {/* New field for customer reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Reference
              </label>
              <input
                type="text"
                value={quoteData.customerReference || ""}
                onChange={handleCustomerReferenceChange}
                placeholder="Customer's PO# or reference"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Job
              </label>
              <select
                value={quoteData.jobId || ""}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, jobId: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.projectTitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid For (Days)
              </label>
              <input
                type="number"
                value={quoteData.validityDays || 30}
                onChange={(e) =>
                  setQuoteData({
                    ...quoteData,
                    validityDays: parseInt(e.target.value),
                  })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                value={quoteData.terms || "Net 30"}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, terms: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="50% Deposit">50% Deposit</option>
                <option value="100% Advance">100% Advance</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-2">
                  Items
                </label>
                {/* New refresh button for materials */}
                <button
                  type="button"
                  onClick={handleRefreshMaterials}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-full flex items-center"
                  title="Refresh materials list"
                  disabled={materialsLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${materialsLoading ? 'animate-spin' : ''}`} />
                </button>
                {materialsLoading && <span className="ml-1 text-xs text-gray-500">Loading...</span>}
              </div>
              <div className="flex space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="all">All Categories</option>
                  <option value="CONVEYOR_COMPONENT">Conveyor Components</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="MECHANICAL">Mechanical</option>
                  <option value="STRUCTURAL">Structural</option>
                  <option value="CONSUMABLE">Consumables</option>
                  <option value="TOOL">Tools</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Component Integration */}
          <div className="flex space-x-2 mb-4">
            <FrequentItemSelector 
              onSelectItems={handleAddFrequentItems}
              customerId={selectedCustomer?.id}
            />
            
            <BundleSelector 
              onSelectBundle={handleAddBundle}
            />
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowSaveTemplateModal(true);
              }}
              className="flex items-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Save className="h-4 w-4 mr-1" />
              <span>Save as Template</span>
            </button>
          </div>

          {/* Materials Status */}
          <div className="text-sm text-gray-500 mb-2">
            {inventoryItems.length} items available. {materialsLoading ? 'Refreshing materials...' : 'Click the refresh button to load latest items.'}
          </div>

          {/* Available Items */}
          <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg">
            {materialsLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading materials...
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2 hover:bg-gray-50 flex justify-between items-center border-b"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.code}</div>
                    <div className="text-xs text-blue-600">Category: {item.category}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div>
                        £
                        {item.unitPrice.toLocaleString("en-GB", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        per {item.unit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(item)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {inventoryItems.length === 0 
                  ? "No materials available. Try refreshing the materials list."
                  : "No items match your search criteria"}
              </div>
            )}
          </div>

          {/* Selected Items */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Unit Price
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.length > 0 ? (
                selectedItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.code}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleTogglePriceHistory(item.id, e)}
                          className="text-blue-600 hover:text-blue-800 ml-2"
                          title="View price history"
                        >
                          <History className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemQuantity(index, parseInt(e.target.value))
                        }
                        className="w-20 p-1 border rounded"
                      />
                      {item.unit}
                    </td>
                    <td className="px-4 py-2">
                      £
                      {item.unitPrice.toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2">
                      £
                      {item.total.toLocaleString("en-GB", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No items added to the quote yet. Use the panel above to
                    add items.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium">
                  Subtotal:
                </td>
                <td className="px-4 py-2 font-medium">
                  £
                  {calculateTotal().toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium">
                  VAT (20%):
                </td>
                <td className="px-4 py-2 font-medium">
                  £
                  {(calculateTotal() * 0.2).toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right font-medium">
                  Total:
                </td>
                <td className="px-4 py-2 font-medium">
                  £
                  {(calculateTotal() * 1.2).toLocaleString("en-GB", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Price History Display */}
          {showPriceHistory && selectedMaterialId && (
            <PriceHistoryDisplay 
              materialId={selectedMaterialId}
              customerId={selectedCustomer?.id}
            />
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={quoteData.notes || ""}
              onChange={(e) =>
                setQuoteData({ ...quoteData, notes: e.target.value })
              }
              rows={3}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editQuote ? "Update Quote" : "Create Quote"}
            </button>
          </div>
        </form>

        {/* Save Template Modal */}
        {showSaveTemplateModal && (
          <SaveTemplateModal
            isOpen={showSaveTemplateModal}
            onClose={() => setShowSaveTemplateModal(false)}
            onSuccess={() => {
              setShowSaveTemplateModal(false);
              alert("Template saved successfully!");
            }}
            items={selectedItems.map(item => ({
              description: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              materialId: item.id
            }))}
          />
        )}

        {/* Status Confirmation Modal */}
        {showStatusConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-medium mb-4">Confirm Status Change</h3>
              <p className="mb-4">
                Are you sure you want to change the quote status from 
                <span className="font-medium"> {QUOTE_STATUSES[quoteData.status as QuoteStatus]} </span> 
                to 
                <span className="font-medium"> {QUOTE_STATUSES[pendingStatusChange as QuoteStatus]}?</span>
              </p>
              
              {pendingStatusChange === 'PENDING' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <Clock3 className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-700">
                      This will mark the quote as sent to the customer and awaiting their decision.
                    </p>
                  </div>
                </div>
              )}
              
              {pendingStatusChange === 'APPROVED' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                  <div className="flex">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-700">
                      This will mark the quote as approved by the customer and ready to be converted to an order.
                    </p>
                  </div>
                </div>
              )}
              
              {pendingStatusChange === 'CONVERTED' && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <Check className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-700">
                      This will convert the quote to an order. This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusConfirmation(false);
                    setPendingStatusChange(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmStatusChange}
                  className={`px-4 py-2 text-white rounded-lg ${
                    pendingStatusChange === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' :
                    pendingStatusChange === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    pendingStatusChange === 'CONVERTED' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}