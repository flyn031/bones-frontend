import React, { useState, useEffect } from 'react';
import { User, LogOut, Info, X, Settings, Activity, Shield, Building, Upload, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient as api } from '../../utils/api';
import SystemFlowDiagram from '../dashboard/SystemFlowDiagram';
import { Button, Input, Alert } from '../ui';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSystemOverview, setShowSystemOverview] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [logoPreview, setLogoPreview] = useState(user?.companyLogo || '');
  
  // Company details state
  const [companyDetails, setCompanyDetails] = useState({
    companyName: user?.companyName || '',
    companyAddress: user?.companyAddress || '',
    companyPhone: user?.companyPhone || '',
    companyEmail: user?.companyEmail || '',
    companyWebsite: user?.companyWebsite || '',
    companyVatNumber: user?.companyVatNumber || '',
    companyLogo: user?.companyLogo || '',
    useCompanyDetailsOnQuotes: user?.useCompanyDetailsOnQuotes || false
  });

  // Update company details state when user data changes
  useEffect(() => {
    if (user) {
      setCompanyDetails({
        companyName: user.companyName || '',
        companyAddress: user.companyAddress || '',
        companyPhone: user.companyPhone || '',
        companyEmail: user.companyEmail || '',
        companyWebsite: user.companyWebsite || '',
        companyVatNumber: user.companyVatNumber || '',
        companyLogo: user.companyLogo || '',
        useCompanyDetailsOnQuotes: user.useCompanyDetailsOnQuotes || false
      });
      setLogoPreview(user.companyLogo || '');
    }
  }, [user]);

  // Recent activity simulation - in a real app, fetch from backend
  const recentActivity = [
    { id: 1, action: 'Logged in', timestamp: '2025-03-10 09:45 AM' },
    { id: 2, action: 'Updated job #JB-1234', timestamp: '2025-03-09 03:22 PM' },
    { id: 3, action: 'Created new customer', timestamp: '2025-03-09 11:05 AM' },
    { id: 4, action: 'Generated quote #Q-5678', timestamp: '2025-03-08 02:17 PM' },
    { id: 5, action: 'Viewed inventory report', timestamp: '2025-03-07 10:33 AM' }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'New passwords do not match' 
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters' 
      });
      return;
    }
    
    // In a real app, call API endpoint to change password
    console.log('Password change request', passwordData);
    
    // Show success message
    setPasswordMessage({ 
      type: 'success', 
      text: 'Password updated successfully' 
    });
    
    // Reset form
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // Clear message after delay
    setTimeout(() => {
      setPasswordMessage({ type: '', text: '' });
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle company details form input changes
  const handleCompanyDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompanyDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.match('image.*')) {
      setProfileMessage({
        type: 'error',
        text: 'Please select an image file (PNG, JPG, JPEG, etc.)'
      });
      return;
    }
    
    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      setProfileMessage({
        type: 'error',
        text: 'Logo image must be smaller than 500KB'
      });
      return;
    }
    
    // Read and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setLogoPreview(base64String);
      setCompanyDetails(prev => ({
        ...prev,
        companyLogo: base64String
      }));
      
      // Add success message
      setProfileMessage({
        type: 'success',
        text: 'Logo uploaded successfully!'
      });
      
      // Clear message after delay
      setTimeout(() => {
        setProfileMessage({ type: '', text: '' });
      }, 3000);
    };
    reader.readAsDataURL(file);
  };
  
  // Clear logo
  const handleClearLogo = () => {
    setLogoPreview('');
    setCompanyDetails(prev => ({
      ...prev,
      companyLogo: ''
    }));
  };
  
  // Save company details to API
  const handleSaveCompanyDetails = async (e) => {
    e.preventDefault();
    
    try {
      // Send updated profile data to API
      const response = await api.put('/auth/profile', companyDetails);
      
      // Update local user state with new data
      updateUser(response.data);
      
      // Show success message
      setProfileMessage({
        type: 'success',
        text: 'Company details updated successfully'
      });
      
      // Clear message after delay
      setTimeout(() => {
        setProfileMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error updating company details:', error);
      setProfileMessage({
        type: 'error',
        text: 'Failed to update company details. Please try again.'
      });
    }
  };

  // Enhanced dropdown menu
  return (
    <div className="relative">
      {/* Profile Button */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 rounded-full bg-white p-2 hover:bg-gray-100"
      >
        <User className="h-5 w-5 text-gray-700" />
        <span className="hidden md:inline text-sm text-gray-700">Profile</span>
      </button>
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={() => {
                setShowProfileModal(true);
                setIsMenuOpen(false);
                setActiveTab('info');
              }}
            >
              <User className="h-4 w-4 mr-2" />
              My Profile
            </button>
            
            <button
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={() => {
                setShowSystemOverview(true);
                setIsMenuOpen(false);
              }}
            >
              <Info className="h-4 w-4 mr-2" />
              System Overview
            </button>
            
            <button
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Profile</h2>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Profile header */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h1>
                  <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
                  <p className="text-gray-500">{user?.role || 'Administrator'}</p>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'info' 
                      ? 'border-b-2 border-blue-500 text-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  Account Information
                </button>
                <button 
                  onClick={() => setActiveTab('company')}
                  className={`flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'company' 
                      ? 'border-b-2 border-blue-500 text-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Company Details
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'security' 
                      ? 'border-b-2 border-blue-500 text-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </button>
                <button 
                  onClick={() => setActiveTab('preferences')}
                  className={`flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'preferences' 
                      ? 'border-b-2 border-blue-500 text-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Preferences
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center px-4 py-3 text-sm font-medium ${
                    activeTab === 'activity' 
                      ? 'border-b-2 border-blue-500 text-blue-500' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Recent Activity
                </button>
              </div>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              {/* Account Information Tab */}
              {activeTab === 'info' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Account Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{user?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{user?.email || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <p className="text-gray-900">{user?.role || 'Administrator'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                      <p className="text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'March 2025'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Company Details Tab */}
              {activeTab === 'company' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Company Details</h2>
                  
                  {profileMessage.text && (
                    <Alert 
                      type={profileMessage.type} 
                      message={profileMessage.text} 
                      className="mb-4"
                    />
                  )}
                  
                  <p className="text-sm text-gray-600 mb-4">
                    These details will be used on quotes and other documents when enabled.
                  </p>
                  
                  <form onSubmit={handleSaveCompanyDetails} className="space-y-4 max-w-lg">
                    {/* Company Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Logo
                      </label>
                      <div className="border rounded-lg p-4 space-y-3">
                        {logoPreview ? (
                          <div className="flex flex-col items-center space-y-2">
                            <img 
                              src={logoPreview} 
                              alt="Company Logo" 
                              className="max-h-32 max-w-full object-contain border rounded p-2"
                            />
                            <button
                              type="button"
                              onClick={handleClearLogo}
                              className="text-red-500 hover:text-red-700 text-sm flex items-center space-x-1"
                            >
                              <X className="h-4 w-4" />
                              <span>Remove Logo</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                            <div className="text-center space-y-1">
                              <Image className="h-8 w-8 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-500">No logo uploaded</p>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label htmlFor="logo-upload" className="cursor-pointer flex items-center justify-center space-x-2 p-2 bg-gray-50 hover:bg-gray-100 rounded text-sm text-gray-700">
                            <Upload className="h-4 w-4" />
                            <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                            <input 
                              id="logo-upload" 
                              type="file" 
                              accept="image/*" 
                              onChange={handleLogoUpload} 
                              className="sr-only"
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">Max size: 500KB. Recommended size: 200x100 pixels. Formats: PNG, JPG, JPEG.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <Input
                        type="text"
                        name="companyName"
                        value={companyDetails.companyName}
                        onChange={handleCompanyDetailsChange}
                        className="w-full"
                        placeholder="Your Company Ltd"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Address
                      </label>
                      <Input
                        type="text"
                        name="companyAddress"
                        value={companyDetails.companyAddress}
                        onChange={handleCompanyDetailsChange}
                        className="w-full"
                        placeholder="123 Business Street, City, Postcode"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <Input
                          type="text"
                          name="companyPhone"
                          value={companyDetails.companyPhone}
                          onChange={handleCompanyDetailsChange}
                          className="w-full"
                          placeholder="020 1234 5678"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <Input
                          type="email"
                          name="companyEmail"
                          value={companyDetails.companyEmail}
                          onChange={handleCompanyDetailsChange}
                          className="w-full"
                          placeholder="info@yourcompany.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <Input
                          type="text"
                          name="companyWebsite"
                          value={companyDetails.companyWebsite}
                          onChange={handleCompanyDetailsChange}
                          className="w-full"
                          placeholder="www.yourcompany.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          VAT Number
                        </label>
                        <Input
                          type="text"
                          name="companyVatNumber"
                          value={companyDetails.companyVatNumber}
                          onChange={handleCompanyDetailsChange}
                          className="w-full"
                          placeholder="GB123456789"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="useCompanyDetailsOnQuotes"
                        name="useCompanyDetailsOnQuotes"
                        checked={companyDetails.useCompanyDetailsOnQuotes}
                        onChange={handleCompanyDetailsChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="useCompanyDetailsOnQuotes" className="ml-2 block text-sm text-gray-900">
                        Use my company details on quotes
                      </label>
                    </div>
                    
                    <Button type="submit" className="mt-6">
                      Save Company Details
                    </Button>
                  </form>
                </div>
              )}
              
              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Security Settings</h2>
                  
                  {passwordMessage.text && (
                    <Alert 
                      type={passwordMessage.type} 
                      message={passwordMessage.text} 
                      className="mb-4"
                    />
                  )}
                  
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <Input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                      />
                    </div>
                    <Button type="submit" className="mt-4">
                      Update Password
                    </Button>
                  </form>
                </div>
              )}
              
              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Dark Mode</h3>
                        <p className="text-sm text-gray-500">
                          Switch between light and dark theme
                        </p>
                      </div>
                      <div className="flex items-center">
                        <label className="inline-flex relative items-center cursor-pointer">
                          <input
                            type="checkbox"
                            value=""
                            className="sr-only peer"
                            checked={isDarkMode}
                            onChange={handleThemeToggle}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Notifications</h3>
                        <p className="text-sm text-gray-500">
                          Enable or disable system notifications
                        </p>
                      </div>
                      <div className="flex items-center">
                        <label className="inline-flex relative items-center cursor-pointer">
                          <input
                            type="checkbox"
                            value=""
                            className="sr-only peer"
                            checked={notificationsEnabled}
                            onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recent Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Activity</h2>
                  
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentActivity.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.action}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.timestamp}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Overview Modal */}
      {showSystemOverview && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">System Overview</h2>
              <button 
                onClick={() => setShowSystemOverview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <SystemFlowDiagram />
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2 text-gray-900">System Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-500">Connected</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">User Role</span>
                    <span className="font-medium text-gray-900">{user?.role || 'Administrator'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;