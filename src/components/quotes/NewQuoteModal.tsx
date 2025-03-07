import React, { useState, useEffect } from "react";
import { X, User, Search, UserPlus, Plus, Trash } from "lucide-react";
import axios from "axios";

// Customer data
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  contactPerson?: string;
}

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

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteData {
  id?: string;
  title: string;
  customer: string;
  customerId?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  jobId: string;
  date?: string;
  validUntil?: string;
  validityDays: number;
  terms: string;
  notes: string;
  items: QuoteItem[];
  value?: number;
  status?: string;
}

interface NewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuoteData) => void;
  editQuote?: QuoteData | null;
  customers?: Customer[];
}

// Comprehensive catalog of inventory items
const inventoryCatalog: Item[] = [
  // Belt Conveyors
  {
    id: "BC001",
    name: "Flat Belt Conveyor - Light Duty",
    code: "FBC-LD",
    unitPrice: 950.0,
    unit: "meter",
    category: "belt_conveyor",
    description: "Light duty flat belt conveyor for packages up to 15kg",
  },
  {
    id: "BC002",
    name: "Flat Belt Conveyor - Medium Duty",
    code: "FBC-MD",
    unitPrice: 1450.0,
    unit: "meter",
    category: "belt_conveyor",
    description: "Medium duty flat belt conveyor for packages up to 35kg",
  },
  {
    id: "BC003",
    name: "Flat Belt Conveyor - Heavy Duty",
    code: "FBC-HD",
    unitPrice: 2200.0,
    unit: "meter",
    category: "belt_conveyor",
    description: "Heavy duty flat belt conveyor for packages up to 75kg",
  },
  {
    id: "BC004",
    name: "Incline Belt Conveyor - 15° Angle",
    code: "IBC-15",
    unitPrice: 1850.0,
    unit: "meter",
    category: "belt_conveyor",
    description: "Inclined belt conveyor with cleats, 15° angle",
  },
  {
    id: "BC005",
    name: "Incline Belt Conveyor - 30° Angle",
    code: "IBC-30",
    unitPrice: 2100.0,
    unit: "meter",
    category: "belt_conveyor",
    description: "Inclined belt conveyor with cleats, 30° angle",
  },

  // Roller Conveyors
  {
    id: "RC001",
    name: "Gravity Roller Conveyor",
    code: "GRC-STD",
    unitPrice: 650.0,
    unit: "meter",
    category: "roller_conveyor",
    description: "Standard gravity roller conveyor, no power required",
  },
  {
    id: "RC002",
    name: "Powered Roller Conveyor - Light Duty",
    code: "PRC-LD",
    unitPrice: 1200.0,
    unit: "meter",
    category: "roller_conveyor",
    description: "Motorized roller conveyor for packages up to 20kg",
  },
  {
    id: "RC003",
    name: "Powered Roller Conveyor - Heavy Duty",
    code: "PRC-HD",
    unitPrice: 1750.0,
    unit: "meter",
    category: "roller_conveyor",
    description: "Motorized roller conveyor for packages up to 50kg",
  },
  {
    id: "RC004",
    name: "Accumulation Roller Conveyor",
    code: "ARC-STD",
    unitPrice: 1950.0,
    unit: "meter",
    category: "roller_conveyor",
    description: "Zero pressure accumulation roller conveyor",
  },

  // Chain Conveyors
  {
    id: "CC001",
    name: "Chain Conveyor - Standard",
    code: "CHC-STD",
    unitPrice: 2400.0,
    unit: "meter",
    category: "chain_conveyor",
    description: "Single strand chain conveyor for pallets and heavy loads",
  },
  {
    id: "CC002",
    name: "Dual Strand Chain Conveyor",
    code: "CHC-DS",
    unitPrice: 3200.0,
    unit: "meter",
    category: "chain_conveyor",
    description: "Dual strand chain conveyor for heavy pallets",
  },

  // Modular Conveyors
  {
    id: "MC001",
    name: "Modular Belt Conveyor - Straight",
    code: "MBC-ST",
    unitPrice: 1650.0,
    unit: "meter",
    category: "modular_conveyor",
    description: "Modular plastic belt conveyor for food processing",
  },
  {
    id: "MC002",
    name: "Modular Belt Conveyor - Curved",
    code: "MBC-CV",
    unitPrice: 2850.0,
    unit: "meter",
    category: "modular_conveyor",
    description: "90° curved modular plastic belt conveyor",
  },

  // Specialty Conveyors
  {
    id: "SC001",
    name: "Magnetic Belt Conveyor",
    code: "MAG-BC",
    unitPrice: 3500.0,
    unit: "meter",
    category: "specialty_conveyor",
    description: "Conveyor with magnetic belt for metal parts transport",
  },
  {
    id: "SC002",
    name: "Vacuum Belt Conveyor",
    code: "VAC-BC",
    unitPrice: 4200.0,
    unit: "meter",
    category: "specialty_conveyor",
    description: "Conveyor with vacuum suction for sheet materials",
  },

  // Control Systems
  {
    id: "CNT001",
    name: "Basic Conveyor Control System",
    code: "CCS-BAS",
    unitPrice: 1500.0,
    unit: "unit",
    category: "control_system",
    description: "Start/stop controls with emergency stop",
  },
  {
    id: "CNT002",
    name: "Advanced Conveyor Control System",
    code: "CCS-ADV",
    unitPrice: 3200.0,
    unit: "unit",
    category: "control_system",
    description: "PLC-based control system with HMI interface",
  },

  // Installation Services
  {
    id: "SRV001",
    name: "Basic Installation Service",
    code: "SRV-BAS",
    unitPrice: 2500.0,
    unit: "job",
    category: "service",
    description: "Basic installation of conveyor systems",
  },
  {
    id: "SRV002",
    name: "Premium Installation Service",
    code: "SRV-PRE",
    unitPrice: 4500.0,
    unit: "job",
    category: "service",
    description: "Comprehensive installation with testing and training",
  },
  {
    id: "SRV003",
    name: "Maintenance Contract - 1 Year",
    code: "SRV-MNT-1Y",
    unitPrice: 1800.0,
    unit: "year",
    category: "service",
    description: "Annual maintenance contract with quarterly inspections",
  },
];

// Mock data for jobs
const mockJobs = [
  { id: "J2024-001", title: "Acme Factory Installation" },
  { id: "J2024-002", title: "BuildCo Maintenance" },
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
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Initialize form when editing a quote
  useEffect(() => {
    if (editQuote) {
      setQuoteData({
        title: editQuote.title,
        customer: editQuote.customer,
        customerId: editQuote.customerId,
        contactPerson: editQuote.contactPerson,
        contactEmail: editQuote.contactEmail,
        contactPhone: editQuote.contactPhone,
        jobId: editQuote.jobId || "",
        validityDays: editQuote.validityDays,
        terms: editQuote.terms,
        notes: editQuote.notes,
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

      // Set selected items
      const itemsWithDetails: SelectedItem[] = editQuote.items.map((item) => {
        const catalogItem = inventoryCatalog.find((i) => i.id === item.id);
        return {
          ...(catalogItem || {
            id: item.id,
            name: item.description,
            code: "",
            unit: "unit",
            category: "other",
          }),
          quantity: item.quantity,
          total: item.total,
          unitPrice: item.unitPrice,
          description: item.description,
        };
      });

      setSelectedItems(itemsWithDetails);
    }
  }, [editQuote, customers]);

  // Debug customers data
  useEffect(() => {
    console.log("Customers data in modal:", customers);
    console.log("Is Array:", Array.isArray(customers));
    if (Array.isArray(customers) && customers.length > 0) {
      console.log("First customer:", customers[0]);
    }
  }, [customers]);

  if (!isOpen) return null;

  // Filter items by search term and category
  const filteredItems = inventoryCatalog.filter(
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

  // Add an item to the quote
  const addItem = (item: Item) => {
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
          total: item.unitPrice,
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

  // Create a new customer
  const handleCreateCustomer = async () => {
    if (!newCustomer.name) return;

    try {
      // In a real app, you would send this to your API
      const token = localStorage.getItem("token");
      // Send actual API request to create customer
      const response = await axios.post(
        "http://localhost:4000/api/customers",
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

      // Use the returned customer or create a fallback if API response is unexpected
      const createdCustomer: Customer =
        response.data && typeof response.data === "object"
          ? {
              id: response.data.id || `cust${Date.now()}`,
              name: response.data.name || newCustomer.name || "",
              email: response.data.email || newCustomer.email || "",
              phone: response.data.phone || newCustomer.phone || "",
              address: response.data.address || newCustomer.address || "",
              contactPerson:
                response.data.contactPerson || newCustomer.contactPerson || "",
            }
          : {
              id: `cust${Date.now()}`,
              name: newCustomer.name || "",
              email: newCustomer.email || "",
              phone: newCustomer.phone || "",
              address: newCustomer.address || "",
              contactPerson: newCustomer.contactPerson || "",
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
    } catch (error) {
      console.error("Error creating customer:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Status code:", error.response.status);
      }

      // Even on error, create a temporary customer for the quote
      // This allows the user to continue without losing their work
      const tempCustomer: Customer = {
        id: `temp_${Date.now()}`,
        name: newCustomer.name || "",
        email: newCustomer.email || "",
        phone: newCustomer.phone || "",
        address: newCustomer.address || "",
        contactPerson: newCustomer.contactPerson || "",
      };

      handleSelectCustomer(tempCustomer);
      setShowNewCustomerForm(false);

      // Inform the user
      alert(
        "There was an error saving the customer to the database, but you can continue creating the quote with this customer information."
      );
    }
  };

  // Submit the quote
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalValue = calculateTotal();

    // Format items for submission
    const formattedItems = selectedItems.map((item) => ({
      id: item.id,
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    // Create complete quote data
    const completeQuoteData: QuoteData = {
      ...(quoteData as QuoteData),
      items: formattedItems,
      value: totalValue,
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(
        Date.now() + (quoteData.validityDays || 30) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
    };

    onSubmit(completeQuoteData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {editQuote ? "Edit Quote" : "Create New Quote"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
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
                            value={newCustomer.name}
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
                              value={newCustomer.phone}
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
                            value={newCustomer.address}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                address: e.target.value,
                              })
                            }
                            rows={2}
                            className="w-full p-2 border rounded-lg text-sm"
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

          {/* Job Linking and Terms */}
          <div className="grid grid-cols-3 gap-4">
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
                {mockJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
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
              <label className="block text-sm font-medium text-gray-700">
                Items
              </label>
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
                  <option value="belt_conveyor">Belt Conveyors</option>
                  <option value="roller_conveyor">Roller Conveyors</option>
                  <option value="chain_conveyor">Chain Conveyors</option>
                  <option value="modular_conveyor">Modular Conveyors</option>
                  <option value="specialty_conveyor">
                    Specialty Conveyors
                  </option>
                  <option value="control_system">Control Systems</option>
                  <option value="service">Services</option>
                </select>
              </div>
            </div>

            {/* Available Items */}
            <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 hover:bg-gray-50 flex justify-between items-center border-b"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.code}</div>
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
                  No items match your search criteria
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
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.code}
                          </div>
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
          </div>

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
      </div>
    </div>
  );
}
