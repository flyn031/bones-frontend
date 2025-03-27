import React, { useState, useEffect } from 'react';
import { Package, Search, Loader, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface BundleItem {
  id: string;
  materialId: string;
  materialName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

interface Bundle {
  id: string;
  name: string;
  description?: string;
  discount: number;
  items: BundleItem[];
}

interface BundleSelectorProps {
  onSelectBundle: (bundle: Bundle) => void;
}

const BundleSelector: React.FC<BundleSelectorProps> = ({ onSelectBundle }) => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  
  useEffect(() => {
    const fetchBundles = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:4000/api/bundles', 
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
        
        // Set the data (fallback to empty array if the response is unexpected)
        setBundles(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching bundles:', error);
        // Use mock data if the API is not available
        setBundles([
          {
            id: 'bundle1',
            name: 'Basic Conveyor Package',
            description: 'Standard conveyor system with installation',
            discount: 10,
            items: [
              {
                id: 'bi1',
                materialId: 'BC001',
                materialName: 'Flat Belt Conveyor - Light Duty',
                quantity: 5,
                unitPrice: 950.0
              },
              {
                id: 'bi2',
                materialId: 'SRV001',
                materialName: 'Basic Installation Service',
                quantity: 1,
                unitPrice: 2500.0
              },
              {
                id: 'bi3',
                materialId: 'CNT001',
                materialName: 'Basic Conveyor Control System',
                quantity: 1,
                unitPrice: 1500.0
              }
            ]
          },
          {
            id: 'bundle2',
            name: 'Premium Conveyor System',
            description: 'Heavy duty conveyor with advanced controls',
            discount: 15,
            items: [
              {
                id: 'bi4',
                materialId: 'BC003',
                materialName: 'Flat Belt Conveyor - Heavy Duty',
                quantity: 5,
                unitPrice: 2200.0
              },
              {
                id: 'bi5',
                materialId: 'SRV002',
                materialName: 'Premium Installation Service',
                quantity: 1,
                unitPrice: 4500.0
              },
              {
                id: 'bi6',
                materialId: 'CNT002',
                materialName: 'Advanced Conveyor Control System',
                quantity: 1,
                unitPrice: 3200.0
              }
            ]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch when dropdown is opened
    if (isDropdownOpen) {
      fetchBundles();
    }
  }, [isDropdownOpen]);
  
  const handleSelectBundle = (bundle: Bundle, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    setSelectedBundle(bundle);
  };
  
  const handleAddBundle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (selectedBundle) {
      onSelectBundle(selectedBundle);
      setIsDropdownOpen(false);
      setSelectedBundle(null);
    }
  };
  
  // Filter bundles by search term
  const filteredBundles = bundles.filter(bundle =>
    bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bundle.description && bundle.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Calculate bundle totals
  const calculateBundleTotal = (bundle: Bundle): { original: number; discounted: number } => {
    const originalTotal = bundle.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountedTotal = originalTotal * (1 - bundle.discount / 100);
    return { original: originalTotal, discounted: discountedTotal };
  };
  
  return (
    <div className="relative">
      <button
        type="button" // Added type="button"
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="flex items-center space-x-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
      >
        <Package className="h-4 w-4 mr-1" />
        <span>Bundles</span>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute z-10 mt-2 w-96 bg-white rounded-lg shadow-lg border">
          <div className="p-3 border-b">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Item Bundles</h3>
              <button 
                type="button" // Added type="button"
                onClick={(e) => {
                  e.preventDefault(); // Prevent form submission
                  setIsDropdownOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg"
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {filteredBundles.length > 0 ? (
                <div className="divide-y">
                  {filteredBundles.map(bundle => {
                    const totals = calculateBundleTotal(bundle);
                    const isSelected = selectedBundle?.id === bundle.id;
                    
                    return (
                      <div 
                        key={bundle.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={(e) => handleSelectBundle(bundle, e)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{bundle.name}</h4>
                            {bundle.description && (
                              <p className="text-sm text-gray-500">{bundle.description}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {bundle.items.length} items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-medium">
                              -{bundle.discount}%
                            </div>
                            <div className="text-sm line-through text-gray-400">
                              £{totals.original.toFixed(2)}
                            </div>
                            <div className="text-sm font-medium">
                              £{totals.discounted.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="mt-3 space-y-1">
                            <h5 className="text-xs font-medium text-gray-500">Bundle Contents:</h5>
                            {bundle.items.map(item => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.quantity} × {item.materialName}</span>
                                <span>£{(item.quantity * item.unitPrice).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-2 mt-2 flex justify-end">
                              <button
                                type="button" // Added type="button"
                                onClick={handleAddBundle}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                              >
                                Add Bundle to Quote
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No matches found' : 'No bundles available'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BundleSelector;