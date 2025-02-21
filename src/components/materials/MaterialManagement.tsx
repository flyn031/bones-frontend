import React, { useState } from 'react';
import MaterialCreationForm from './MaterialCreationForm';
import MaterialList from './MaterialList';

interface MaterialManagementProps {
  customerId?: string;  // Make customerId optional
}

const MaterialManagement: React.FC<MaterialManagementProps> = ({ customerId }) => {
  const [refreshList, setRefreshList] = useState(false);

  const handleMaterialCreated = () => {
    setRefreshList(prev => !prev);
  };

  // If no customerId is provided, show a message
  if (!customerId) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Material Management</h2>
        <p className="text-gray-500">Please select a customer to manage materials.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Material Management</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Add New Material</h3>
          <MaterialCreationForm 
            customerId={customerId} 
            onMaterialCreated={handleMaterialCreated} 
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <MaterialList 
            customerId={customerId} 
            key={refreshList.toString()} 
          />
        </div>
      </div>
    </div>
  );
};

export default MaterialManagement;