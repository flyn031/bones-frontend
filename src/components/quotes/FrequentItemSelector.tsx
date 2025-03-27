import React, { useState, useEffect } from 'react';
import { Check, Loader, Search } from 'lucide-react';
import axios from 'axios';

interface FrequentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  materialId?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  items: FrequentItem[];
}

interface FrequentItemSelectorProps {
  onSelectItems: (items: FrequentItem[]) => void;
  customerId?: string;
}

const FrequentItemSelector: React.FC<FrequentItemSelectorProps> = ({ 
  onSelectItems,
  customerId 
}) => {
  const [frequentItems, setFrequentItems] = useState<FrequentItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    const fetchFrequentItems = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = customerId ? `?customerId=${customerId}` : '';
        
        // Fetch frequent items
        const itemsResponse = await axios.get(
          `http://localhost:4000/api/quotes/frequent-items${params}`, 
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
        
        // Fetch quote templates
        const templatesResponse = await axios.get(
          `http://localhost:4000/api/quote-templates${params}`,
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
        
        // Set the data (fallback to empty arrays if the response is unexpected)
        setFrequentItems(Array.isArray(itemsResponse.data) ? itemsResponse.data : []);
        setTemplates(Array.isArray(templatesResponse.data) ? templatesResponse.data : []);
      } catch (error) {
        console.error('Error fetching frequent items:', error);
        // Use mock data if the API is not available
        setFrequentItems([
          {
            id: 'freq1',
            description: 'Belt Conveyor System 5m',
            quantity: 1,
            unitPrice: 7500.00,
            materialId: 'BC001'
          },
          {
            id: 'freq2',
            description: 'Installation Service (Standard)',
            quantity: 1,
            unitPrice: 2500.00,
            materialId: 'SRV001'
          }
        ]);
        
        setTemplates([
          {
            id: 'templ1',
            name: 'Basic Conveyor Package',
            description: 'Standard conveyor with installation',
            items: [
              {
                id: 'item1',
                description: 'Belt Conveyor System 5m',
                quantity: 1,
                unitPrice: 7500.00,
                materialId: 'BC001'
              },
              {
                id: 'item2',
                description: 'Installation Service (Standard)',
                quantity: 1,
                unitPrice: 2500.00,
                materialId: 'SRV001'
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
      fetchFrequentItems();
    }
  }, [isDropdownOpen, customerId]);
  
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };
  
  const handleAddToQuote = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    const itemsToAdd = frequentItems.filter(item => 
      selectedItems.includes(item.id)
    );
    onSelectItems(itemsToAdd);
    setIsDropdownOpen(false);
    setSelectedItems([]);
  };
  
  const handleSelectTemplate = (template: Template, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    onSelectItems(template.items);
    setIsDropdownOpen(false);
    setSelectedItems([]);
  };
  
  // Filter frequent items by search term
  const filteredItems = frequentItems.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter templates by search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
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
        <span>Frequent Items</span>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute z-10 mt-2 w-96 bg-white rounded-lg shadow-lg border">
          <div className="p-3 border-b">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Frequent Items & Templates</h3>
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
                placeholder="Search items or templates..."
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
              {filteredItems.length > 0 && (
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Frequent Items</h4>
                  <div className="space-y-2">
                    {filteredItems.map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          handleSelectItem(item.id);
                        }}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 mr-3 flex items-center justify-center border rounded ${
                            selectedItems.includes(item.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {selectedItems.includes(item.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.description}</div>
                            <div className="text-sm text-gray-500">
                              £{item.unitPrice.toFixed(2)} × {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedItems.length > 0 && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button" // Added type="button"
                        onClick={handleAddToQuote}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Add Selected ({selectedItems.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {filteredTemplates.length > 0 && (
                <div className="p-3 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Templates</h4>
                  <div className="space-y-2">
                    {filteredTemplates.map(template => (
                      <div 
                        key={template.id}
                        className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={(e) => handleSelectTemplate(template, e)}
                      >
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-gray-500">{template.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {template.items.length} items • £
                          {template.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)} total
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {filteredItems.length === 0 && filteredTemplates.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No matches found' : 'No frequent items or templates available'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FrequentItemSelector;