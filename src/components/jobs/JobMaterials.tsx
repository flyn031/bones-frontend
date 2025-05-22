// frontend/src/components/jobs/JobMaterials.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2 } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  code: string;
  category: string;
  currentStockLevel: number;
  minStockLevel: number;
  unit: string;
  unitPrice: number;
  supplier?: {
    id: string;
    name: string;
  };
}

interface JobMaterial {
  id: string;
  jobId: string;
  materialId: string;
  quantityNeeded: number;
  quantityAllocated: number;
  quantityUsed: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  material: Material;
  createdAt: string;
}

interface JobMaterialsProps {
  jobId: string;
}

export default function JobMaterials({ jobId }: JobMaterialsProps) {
  const [jobMaterials, setJobMaterials] = useState<JobMaterial[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state for adding material
  const [formData, setFormData] = useState({
    materialId: '',
    quantityNeeded: 0,
    unitCost: 0,
    notes: ''
  });

  // Form state for updating allocation
  const [allocationData, setAllocationData] = useState({
    materialId: '',
    quantityAllocated: 0,
    quantityUsed: 0,
    notes: ''
  });

  const [showAllocationModal, setShowAllocationModal] = useState(false);

  // Totals
  const [totals, setTotals] = useState({
    totalMaterials: 0,
    totalCost: 0,
    totalQuantityNeeded: 0,
    totalQuantityAllocated: 0,
    totalQuantityUsed: 0
  });

  useEffect(() => {
    fetchJobMaterials();
  }, [jobId]);

  const fetchJobMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/jobs/${jobId}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setJobMaterials(response.data.materials || []);
      setTotals(response.data.totals || {});
      setError(null);
    } catch (error) {
      console.error('Error fetching job materials:', error);
      setError('Failed to fetch job materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/jobs/${jobId}/materials/available`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { search: searchTerm }
      });
      setAvailableMaterials(response.data.materials || []);
    } catch (error) {
      console.error('Error fetching available materials:', error);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableMaterials();
    }
  }, [showAddModal, searchTerm, jobId]);

  const handleAddMaterial = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:4000/api/jobs/${jobId}/materials`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Reset form and close modal
      setFormData({ materialId: '', quantityNeeded: 0, unitCost: 0, notes: '' });
      setShowAddModal(false);
      setSelectedMaterial(null);
      
      // Refresh the materials list
      fetchJobMaterials();
    } catch (error) {
      console.error('Error adding material to job:', error);
      alert('Failed to add material to job');
    }
  };

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setFormData({
      ...formData,
      materialId: material.id,
      unitCost: material.unitPrice
    });
  };

  const handleUpdateAllocation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:4000/api/jobs/${jobId}/materials/${allocationData.materialId}`,
        {
          quantityAllocated: allocationData.quantityAllocated,
          quantityUsed: allocationData.quantityUsed,
          notes: allocationData.notes
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setShowAllocationModal(false);
      setAllocationData({ materialId: '', quantityAllocated: 0, quantityUsed: 0, notes: '' });
      fetchJobMaterials();
    } catch (error) {
      console.error('Error updating material allocation:', error);
      alert('Failed to update material allocation');
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to remove this material from the job?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:4000/api/jobs/${jobId}/materials/${materialId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      fetchJobMaterials();
    } catch (error) {
      console.error('Error removing material from job:', error);
      alert('Failed to remove material from job');
    }
  };

  const openAllocationModal = (jobMaterial: JobMaterial) => {
    setAllocationData({
      materialId: jobMaterial.materialId,
      quantityAllocated: jobMaterial.quantityAllocated,
      quantityUsed: jobMaterial.quantityUsed,
      notes: jobMaterial.notes || ''
    });
    setShowAllocationModal(true);
  };

  if (loading) return <div className="p-4">Loading materials...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header with totals */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Job Materials</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Material</span>
          </button>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total Materials</div>
            <div className="text-xl font-semibold">{totals.totalMaterials}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total Cost</div>
            <div className="text-xl font-semibold">£{totals.totalCost?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Quantity Needed</div>
            <div className="text-xl font-semibold">{totals.totalQuantityNeeded}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Allocated</div>
            <div className="text-xl font-semibold">{totals.totalQuantityAllocated}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Used</div>
            <div className="text-xl font-semibold">{totals.totalQuantityUsed}</div>
          </div>
        </div>

        {/* Materials List */}
        <div className="space-y-4">
          {jobMaterials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No materials added to this job yet.</p>
            </div>
          ) : (
            jobMaterials.map((jobMaterial) => (
              <div key={jobMaterial.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{jobMaterial.material.name}</h4>
                      <span className="text-sm text-gray-500">({jobMaterial.material.code})</span>
                      {jobMaterial.material.currentStockLevel < jobMaterial.quantityNeeded && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" title="Insufficient stock" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Needed:</span>
                        <span className="ml-1 font-medium">{jobMaterial.quantityNeeded} {jobMaterial.material.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Allocated:</span>
                        <span className="ml-1 font-medium">{jobMaterial.quantityAllocated} {jobMaterial.material.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Used:</span>
                        <span className="ml-1 font-medium">{jobMaterial.quantityUsed} {jobMaterial.material.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="ml-1 font-medium">£{jobMaterial.totalCost?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                      <div>
                        <span className="text-gray-600">Unit Cost:</span>
                        <span className="ml-1">£{jobMaterial.unitCost?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Stock:</span>
                        <span className={`ml-1 ${jobMaterial.material.currentStockLevel < jobMaterial.quantityNeeded ? 'text-red-600' : ''}`}>
                          {jobMaterial.material.currentStockLevel} {jobMaterial.material.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <span className="ml-1">{jobMaterial.material.supplier?.name || 'N/A'}</span>
                      </div>
                    </div>

                    {jobMaterial.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {jobMaterial.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openAllocationModal(jobMaterial)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Update allocation"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMaterial(jobMaterial.materialId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Remove material"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add Material to Job</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedMaterial(null);
                    setFormData({ materialId: '', quantityNeeded: 0, unitCost: 0, notes: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {!selectedMaterial ? (
                <div>
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search materials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Available Materials List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableMaterials.map((material) => (
                      <div
                        key={material.id}
                        onClick={() => handleSelectMaterial(material)}
                        className="p-3 border rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-gray-600">{material.code} | {material.category}</div>
                            <div className="text-sm text-gray-600">
                              Stock: {material.currentStockLevel} {material.unit} | 
                              Price: £{material.unitPrice.toFixed(2)}/{material.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {material.supplier?.name || 'No supplier'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Selected Material Details */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium">{selectedMaterial.name}</h4>
                    <p className="text-sm text-gray-600">{selectedMaterial.code} | {selectedMaterial.category}</p>
                    <p className="text-sm text-gray-600">
                      Current Stock: {selectedMaterial.currentStockLevel} {selectedMaterial.unit} | 
                      Price: £{selectedMaterial.unitPrice.toFixed(2)}/{selectedMaterial.unit}
                    </p>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity Needed <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.quantityNeeded}
                        onChange={(e) => setFormData({ ...formData, quantityNeeded: parseFloat(e.target.value) || 0 })}
                        className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Cost (£)
                      </label>
                      <input
                        type="number"
                        value={formData.unitCost}
                        onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                        className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>

                    {/* Cost calculation */}
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Total Cost</div>
                      <div className="text-lg font-semibold">
                        £{(formData.quantityNeeded * formData.unitCost).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setSelectedMaterial(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleAddMaterial}
                      disabled={!formData.quantityNeeded || formData.quantityNeeded <= 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Material
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Update Material Allocation</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Allocated
                  </label>
                  <input
                    type="number"
                    value={allocationData.quantityAllocated}
                    onChange={(e) => setAllocationData({
                      ...allocationData,
                      quantityAllocated: parseFloat(e.target.value) || 0
                    })}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Used
                  </label>
                  <input
                    type="number"
                    value={allocationData.quantityUsed}
                    onChange={(e) => setAllocationData({
                      ...allocationData,
                      quantityUsed: parseFloat(e.target.value) || 0
                    })}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={allocationData.notes}
                    onChange={(e) => setAllocationData({
                      ...allocationData,
                      notes: e.target.value
                    })}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAllocationModal(false);
                    setAllocationData({ materialId: '', quantityAllocated: 0, quantityUsed: 0, notes: '' });
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAllocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}