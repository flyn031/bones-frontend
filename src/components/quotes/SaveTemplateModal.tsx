import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import axios from 'axios';

interface TemplateItem {
  description: string;
  quantity: number;
  unitPrice: number;
  materialId?: string;
}

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  items: TemplateItem[];
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  items
}) => {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [addToFrequentItems, setAddToFrequentItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  if (!isOpen) return null;
  
  const handleSaveTemplate = async () => {
    if (templateName.trim() === '') {
      setErrorMessage('Template name is required');
      return;
    }
    
    if (items.length === 0) {
      setErrorMessage('Cannot save an empty template');
      return;
    }
    
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:4000/api/quote-templates',
        {
          name: templateName,
          description: templateDescription,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            materialId: item.materialId,
            isFrequentlyUsed: addToFrequentItems
          }))
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 201) {
        // Template saved successfully
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        setErrorMessage(
          axiosError.response?.data?.message || 
          'Failed to save template. Please try again.'
        );
      } else {
        setErrorMessage('Failed to save template. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Save as Template</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name*
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="E.g., Standard Conveyor Setup"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Brief description of this template"
              rows={3}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="addToFrequentItems"
              checked={addToFrequentItems}
              onChange={(e) => setAddToFrequentItems(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="addToFrequentItems" className="ml-2 text-sm text-gray-700">
              Add items to frequently used items list
            </label>
          </div>
          
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Items to save ({items.length})</h4>
            <div className="max-h-40 overflow-y-auto border rounded-lg divide-y text-sm">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <div key={index} className="p-2 flex justify-between">
                    <div>{item.description}</div>
                    <div className="text-gray-500">
                      {item.quantity} × £{item.unitPrice.toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">
                  No items to save
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={isSaving || templateName.trim() === '' || items.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="mr-2">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                <span>Save Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateModal;