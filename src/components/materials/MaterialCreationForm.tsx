import React, { useState } from 'react';
import axios from 'axios';

interface MaterialCreationFormProps {
  customerId: string;
  onMaterialCreated: () => void;
}

const MaterialCreationForm: React.FC<MaterialCreationFormProps> = ({ customerId, onMaterialCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'RAW_MATERIAL',
    unitPrice: 0,
    unit: '',
    minStockLevel: 0,
    currentStockLevel: 0,
    reorderPoint: 0,
    leadTimeInDays: 0,
    manufacturer: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/materials', {
        ...formData,
        customerId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Material created:', response.data);
      onMaterialCreated();
      // Reset form or show success message
    } catch (error) {
      console.error('Error creating material:', error);
      // Show error message to user
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Material Name"
        required
      />
      <input
        type="text"
        name="code"
        value={formData.code}
        onChange={handleChange}
        placeholder="Material Code"
        required
      />
      {/* Add more input fields for other material properties */}
      <button type="submit">Create Material</button>
    </form>
  );
};

export default MaterialCreationForm;