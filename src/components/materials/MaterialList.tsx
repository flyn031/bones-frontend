import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Material {
  id: string;
  name: string;
  code: string;
  category: string;
  currentStockLevel: number;
}

interface MaterialListProps {
  customerId: string;
}

const MaterialList: React.FC<MaterialListProps> = ({ customerId }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:4000/api/materials?customerId=${customerId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Ensure response.data is an array
        const materialsData = Array.isArray(response.data) ? response.data : [];
        setMaterials(materialsData);
      } catch (error) {
        console.error('Error fetching materials:', error);
        setError('Failed to load materials');
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchMaterials();
    }
  }, [customerId]);

  if (isLoading) {
    return <div className="p-4">Loading materials...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!materials.length) {
    return <div className="p-4">No materials found.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Your Materials</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {materials.map((material) => (
            <li key={material.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{material.name}</h3>
                  <p className="text-sm text-gray-500">Code: {material.code}</p>
                </div>
                <div className="text-sm">
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    Stock: {material.currentStockLevel}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MaterialList;