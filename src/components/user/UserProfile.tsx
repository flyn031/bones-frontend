import React, { useState, useEffect } from 'react';
import { User, LogOut, Info, X, Settings, Activity, Shield, Building, Upload, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient as api } from '../../utils/api';
import SystemFlowDiagram from '../dashboard/SystemFlowDiagram'; // Assuming this component exists
import { Button, Input, Alert } from '../ui'; // Assuming these UI components exist

/*
This component handles the user profile dropdown menu, profile settings modal,
and the system overview modal. It includes features for updating company details,
changing passwords, managing preferences (like dark mode), and viewing recent activity.
The quote lifecycle documentation has also been added to the System Overview modal for user reference.
*/

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

  // Update company details state when user data changes from context
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
      setLogoPreview(user.companyLogo || ''); // Update preview as well
    }
  }, [user]);

  // Recent activity simulation - Replace with actual API call in a real application
  const recentActivity = [
    { id: 1, action: 'Logged in', timestamp: '2025-03-10 09:45 AM' },
    { id: 2, action: 'Updated job #JB-1234', timestamp: '2025-03-09 03:22 PM' },
    { id: 3, action: 'Created new customer "Example Corp"', timestamp: '2025-03-09 11:05 AM' },
    { id: 4, action: 'Generated quote #Q-5678 for "Example Corp"', timestamp: '2025-03-08 02:17 PM' },
    { id: 5, action: 'Viewed inventory report', timestamp: '2025-03-07 10:33 AM' }
  ];

  // Handle user logout
  const handleLogout = () => {
    logout();
    // Navigation to login page is typically handled inside the logout function
    // or via context state change redirecting in App.tsx/Routes.tsx
  };

  // Toggle dark/light theme
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle password change submission
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' }); // Clear previous messages

    // Frontend validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    // API Call (Replace with your actual API endpoint)
    try {
      console.log('Attempting password change...');
      // Example API call structure:
      // await api.post('/auth/change-password', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // });
      await new Promise(resolve => setTimeout(resolve, 750)); // Simulate API delay
      console.log('Password changed successfully (simulated).');


      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form

      // Auto-clear message after a few seconds
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);

    } catch (error: any) {
      console.error('Password change API error:', error);
      setPasswordMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to update password. Please check your current password and try again.'
      });
    }
  };

  // Handle input changes for the password form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Handle input changes for the company details form
  const handleCompanyDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompanyDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle company logo file selection
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    setProfileMessage({ type: '', text: '' }); // Clear previous messages
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Please select an image file (PNG, JPG, GIF etc.)' });
      return;
    }
    if (file.size > 500 * 1024) { // Max 500KB
      setProfileMessage({ type: 'error', text: 'Logo image must be smaller than 500KB' });
      return;
    }

    // Read file as Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String); // Show preview
      setCompanyDetails(prev => ({ ...prev, companyLogo: base64String })); // Store base64 in state
      setProfileMessage({ type: 'info', text: 'New logo selected. Remember to save changes.' }); // Inform user
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setProfileMessage({ type: 'error', text: 'Error reading the logo file.' });
    };
    reader.readAsDataURL(file);
  };

  // Handle removing the company logo
  const handleClearLogo = () => {
    setLogoPreview('');
    setCompanyDetails(prev => ({ ...prev, companyLogo: '' }));
    setProfileMessage({ type: 'info', text: 'Logo removed. Remember to save changes.' });
    setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
  };

  // Handle saving company details to the backend
  const handleSaveCompanyDetails = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' }); // Clear previous messages

    try {
      console.log('Saving company details:', companyDetails);
      const response = await api.put('/auth/profile', companyDetails); // Send entire companyDetails object
      updateUser(response.data); // Update context with potentially merged/updated data from backend
      setProfileMessage({ type: 'success', text: 'Company details updated successfully!' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      console.error('Error updating company details:', error);
      setProfileMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to update company details. Please try again.'
      });
    }
  };

  // JSX for the component rendering
  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 rounded-full bg-white dark:bg-gray-700 p-1 sm:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        aria-label="User profile menu"
      >
        <User className="h-5 w-5" />
        <span className="hidden md:inline text-sm font-medium">{user?.name?.split(' ')[0] || 'Profile'}</span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button" // Assume the button above has id="user-menu-button" or adjust accordingly
        >
          <div className="py-1 divide-y divide-gray-100 dark:divide-gray-700">
            {/* Profile Info Section */}
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white" role="none">
                {user?.name || 'Current User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate" role="none">
                {user?.email || 'No email provided'}
              </p>
            </div>

            {/* Actions Section */}
            <div className="py-1" role="none">
                <button
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => { setShowProfileModal(true); setIsMenuOpen(false); setActiveTab('info'); }}
                  role="menuitem"
                >
                  <User className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  My Profile & Settings
                </button>

                <button
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => { setShowSystemOverview(true); setIsMenuOpen(false); }}
                  role="menuitem"
                >
                  <Info className="h-4 w-4 mr-3 text-gray-400 dark:text-gray-500" aria-hidden="true"/>
                  System Overview
                </button>
            </div>

            {/* Logout Section */}
            <div className="py-1" role="none">
                <button
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={handleLogout}
                role="menuitem"
                >
                    <LogOut className="h-4 w-4 mr-3" aria-hidden="true"/>
                    Logout
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center p-4">
          {/* Increased bg opacity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-modal-title">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0 sticky top-0 bg-white dark:bg-gray-800 z-20">
              <h2 id="profile-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">My Profile & Settings</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close profile settings"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Profile User Header */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center">
                 {logoPreview ? (
                   <img src={logoPreview} alt="Company Logo Preview" className="h-16 w-16 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0"/>
                 ) : (
                   <div className="bg-indigo-500 text-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold shadow-sm flex-shrink-0">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                 )}
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name || 'User Name'}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
                  <p className="mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {user?.role || 'Default Role'}
                  </p>
                </div>
              </div>
            </div>

             {/* Main Modal Content Area - Scrollable */}
             <div className="flex-grow overflow-y-auto">
                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                  <nav className="-mb-px flex space-x-4 sm:space-x-6 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
                     {[
                      { key: 'info', label: 'Account', icon: User },
                      { key: 'company', label: 'Company', icon: Building },
                      { key: 'security', label: 'Security', icon: Shield },
                      { key: 'preferences', label: 'Preferences', icon: Settings },
                      { key: 'activity', label: 'Activity', icon: Activity },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap focus:outline-none focus:ring-indigo-500 focus:text-indigo-600 focus:border-indigo-500 ${
                          activeTab === tab.key
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                        }`}
                        aria-current={activeTab === tab.key ? 'page' : undefined}
                        role="tab"
                        aria-controls={`tab-panel-${tab.key}`} // Link button to panel for accessibility
                      >
                        <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.key ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`} aria-hidden="true" />
                        <span>{tab.label}</span>
                      </button>
                     ))}
                   </nav>
                </div>

                {/* Tab Panels */}
                <div className="p-6">
                    {/* Panel for Account Information */}
                    <div id="tab-panel-info" role="tabpanel" tabIndex={0} hidden={activeTab !== 'info'}>
                         <h2 className="sr-only">Account Information</h2> {/* Screen reader heading */}
                        <div className="space-y-5">
                            {/* Using simple definition list for key-value pairs */}
                            <dl>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.name || 'N/A'}</dd>
                                </div>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-t dark:border-gray-700">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.email || 'N/A'}</dd>
                                </div>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-t dark:border-gray-700">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User Role</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.role || 'N/A'}</dd>
                                </div>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-t dark:border-gray-700">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                    </dd>
                                </div>
                             </dl>
                         </div>
                    </div>

                   {/* Panel for Company Details */}
                    <div id="tab-panel-company" role="tabpanel" tabIndex={0} hidden={activeTab !== 'company'}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Company Details</h2>
                        {profileMessage.text && (
                            <Alert type={profileMessage.type} message={profileMessage.text} className="mb-4" onDismiss={() => setProfileMessage({ type: '', text: '' })} />
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Manage your company information used for branding documents like quotes.
                         </p>
                        <form onSubmit={handleSaveCompanyDetails} className="space-y-6 max-w-2xl">
                            {/* Company Logo Upload Section */}
                           <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                             <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="flex-shrink-0 w-32 h-32 border border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-white dark:bg-gray-700 overflow-hidden">
                                     {logoPreview ? (<img src={logoPreview} alt="Company Logo Preview" className="max-h-full max-w-full object-contain p-1"/>)
                                                : (<Image className="h-10 w-10 text-gray-400 dark:text-gray-500" />)}
                               </div>
                                <div className="flex-grow space-y-2">
                                   <p className="text-xs text-gray-500 dark:text-gray-400">Max 500KB. Appears on PDFs if enabled below.</p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor="logo-upload-input" className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                       <Upload className="h-4 w-4 mr-2" />
                                        <span>{logoPreview ? 'Change' : 'Upload'}</span>
                                     </label>
                                      {logoPreview && (<button type="button" onClick={handleClearLogo} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"><X className="h-4 w-4 mr-1" /> Remove</button>)}
                                   </div>
                                   <input id="logo-upload-input" name="logo-upload-input" type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only"/>
                                 </div>
                             </div>
                           </div>
                            {/* Text fields */}
                           <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label><Input type="text" name="companyName" value={companyDetails.companyName} onChange={handleCompanyDetailsChange} placeholder="Your Registered Company Name"/></div>
                           <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Address</label><Input type="text" name="companyAddress" value={companyDetails.companyAddress} onChange={handleCompanyDetailsChange} placeholder="Full registered address"/></div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Phone</label><Input type="tel" name="companyPhone" value={companyDetails.companyPhone} onChange={handleCompanyDetailsChange} placeholder="Primary contact number"/></div>
                              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Email</label><Input type="email" name="companyEmail" value={companyDetails.companyEmail} onChange={handleCompanyDetailsChange} placeholder="info@yourcompany.com"/></div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Website</label><Input type="url" name="companyWebsite" value={companyDetails.companyWebsite} onChange={handleCompanyDetailsChange} placeholder="https://www.yourcompany.com"/></div>
                              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VAT Number</label><Input type="text" name="companyVatNumber" value={companyDetails.companyVatNumber} onChange={handleCompanyDetailsChange} placeholder="e.g., GB123456789"/></div>
                            </div>
                           {/* Toggle */}
                           <div className="flex items-start pt-2">
                             <div className="flex items-center h-5"><input id="useCompanyDetailsOnQuotes" name="useCompanyDetailsOnQuotes" type="checkbox" checked={companyDetails.useCompanyDetailsOnQuotes} onChange={handleCompanyDetailsChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-indigo-500 rounded"/></div>
                              <div className="ml-3 text-sm"><label htmlFor="useCompanyDetailsOnQuotes" className="font-medium text-gray-700 dark:text-gray-300">Enable Company Branding on Quotes</label><p className="text-gray-500 dark:text-gray-400 text-xs">Adds logo, name, and address to generated PDF quotes.</p></div>
                            </div>
                           {/* Save Button */}
                           <div className="pt-4"><Button type="submit" disabled={profileMessage.type === 'info' /* Disable while only logo change message shows? */}>Save Company Details</Button></div>
                         </form>
                     </div>

                     {/* Panel for Security */}
                    <div id="tab-panel-security" role="tabpanel" tabIndex={0} hidden={activeTab !== 'security'}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Security Settings</h2>
                         {passwordMessage.text && ( <Alert type={passwordMessage.type} message={passwordMessage.text} className="mb-6" onDismiss={() => setPasswordMessage({ type: '', text: '' })} />)}
                         <h3 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Change Your Password</h3>
                         <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                             <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label><Input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handleInputChange} required autoComplete="current-password"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password (min 8 chars)</label><Input type="password" name="newPassword" value={passwordData.newPassword} onChange={handleInputChange} required autoComplete="new-password"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label><Input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handleInputChange} required autoComplete="new-password"/></div>
                            <Button type="submit" className="mt-4">Update Password</Button>
                         </form>
                         {/* Add 2FA settings here later if needed */}
                     </div>

                     {/* Panel for Preferences */}
                    <div id="tab-panel-preferences" role="tabpanel" tabIndex={0} hidden={activeTab !== 'preferences'}>
                        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Interface Preferences</h2>
                       <div className="space-y-8 max-w-lg">
                           {/* Theme Toggle */}
                            <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                               <div><h3 className="text-base font-medium text-gray-900 dark:text-gray-200">Dark Mode</h3><p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes.</p></div>
                                <label className="ml-4 inline-flex relative items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={handleThemeToggle}/><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                             </div>
                            {/* Notifications Toggle */}
                             <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                               <div><h3 className="text-base font-medium text-gray-900 dark:text-gray-200">System Notifications</h3><p className="text-sm text-gray-500 dark:text-gray-400">Enable/disable non-critical system alerts.</p></div>
                               <label className="ml-4 inline-flex relative items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)}/><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                            </div>
                           {/* Add more preference toggles here */}
                       </div>
                     </div>

                    {/* Panel for Recent Activity */}
                    <div id="tab-panel-activity" role="tabpanel" tabIndex={0} hidden={activeTab !== 'activity'}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Account Activity</h2>
                         <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Shows the last few actions performed by your account (simulation).</p>
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                               <thead className="bg-gray-50 dark:bg-gray-700/50"><tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"><th scope="col" className="px-6 py-3">Action</th><th scope="col" className="px-6 py-3">Timestamp</th></tr></thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {recentActivity.map((item) => (<tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{item.action}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.timestamp}</td></tr>))}
                                  {recentActivity.length === 0 && (<tr><td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400 italic">No recent activity to display.</td></tr>)}
                                </tbody>
                            </table>
                         </div>
                     </div>

                 </div> {/* End Tab Panels */}
             </div> {/* End Scrollable Content Area */}

          </div> {/* End Modal Card */}
        </div> // End Modal Backdrop
      )}

      {/* System Overview Modal */}
      {showSystemOverview && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center p-4">
            {/* Higher z-index */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full m-4 max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
                 role="dialog"
                aria-modal="true"
                aria-labelledby="system-overview-title">
             {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 id="system-overview-title" className="text-xl font-semibold text-gray-900 dark:text-white">System Overview & Flow</h2>
              <button
                onClick={() => setShowSystemOverview(false)}
                 className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 aria-label="Close system overview"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             {/* Scrollable Content */}
             <div className="p-6 flex-grow overflow-y-auto">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">General System Flow</h3>
                <div className="p-4 border rounded-lg dark:border-gray-700 mb-8">
                    <SystemFlowDiagram /> {/* Your general system diagram */}
                </div>

                {/* --- START: Added Quote Lifecycle Section --- */}
                <section className="pt-6 border-t dark:border-gray-700">
                   <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quote Lifecycle Management</h3>
                   <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                     The quote system follows a structured lifecycle with color-coded statuses to track progress from initial creation to final conversion or closure.
                   </p>

                   {/* Optional: Placeholder for a dedicated visual diagram component */}
                   {/* <QuoteLifecycleDiagram /> */}

                   <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                        {/* Status Flow Column */}
                        <div>
                            <h4 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Status Flow & Description</h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 mr-3 mt-0.5"></span>
                                    <span className="text-gray-700 dark:text-gray-300"><strong>Draft</strong>: Initial creation stage; editable.</span>
                                </li>
                                <li className="flex items-start">
                                     <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 mr-3 mt-0.5"></span>
                                    <span className="text-gray-700 dark:text-gray-300"><strong>Sent</strong>: Emailed/delivered to customer for review.</span>
                                </li>
                                <li className="flex items-start">
                                     <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 mr-3 mt-0.5"></span>
                                    <span className="text-gray-700 dark:text-gray-300"><strong>Pending</strong>: Customer actively considering; decision expected.</span>
                                 </li>
                                <li className="flex items-start">
                                     <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 mr-3 mt-0.5"></span>
                                     <span className="text-gray-700 dark:text-gray-300"><strong>Approved</strong>: Customer accepted; ready for conversion.</span>
                                 </li>
                                <li className="flex items-start">
                                     <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 mr-3 mt-0.5"></span>
                                    <span className="text-gray-700 dark:text-gray-300"><strong>Declined</strong>: Customer rejected; can be revised.</span>
                                </li>
                                 <li className="flex items-start">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-700 mr-3 mt-0.5"></span>
                                     <span className="text-gray-700 dark:text-gray-300"><strong>Expired</strong>: Passed validity date; inactive.</span>
                                 </li>
                                <li className="flex items-start">
                                     <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 mr-3 mt-0.5"></span>
                                    <span className="text-gray-700 dark:text-gray-300"><strong>Converted</strong>: Successfully made into an order; locked.</span>
                                </li>
                             </ul>
                       </div>

                        {/* Key Features Column */}
                        <div>
                           <h4 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Key Features</h4>
                             <ul className="list-disc list-outside pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                               <li>Visual progress bar representation.</li>
                               <li>Color-coded status tags in lists.</li>
                               <li>Status change validation logic.</li>
                               <li>Confirmation dialogues for key actions.</li>
                               <li>(Future: Detailed status history logs).</li>
                            </ul>
                       </div>

                       {/* Status Permissions Column */}
                        <div>
                           <h4 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Status Change Permissions</h4>
                           <ul className="list-disc list-outside pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                               <li><strong>Draft</strong> → Sent, Pending, Approved, etc.</li>
                               <li><strong>Sent/Pending</strong> → Approved, Declined, Expired.</li>
                               <li><strong>Approved</strong> → Converted, Expired.</li>
                               <li><strong>Declined/Expired</strong> → Can often revert to Draft.</li>
                               <li><strong>Converted</strong> → Locked, no further changes.</li>
                            </ul>
                        </div>
                   </div>
                </section>
                {/* --- END: Added Quote Lifecycle Section --- */}


               {/* System Status & Info (optional) */}
                <div className="mt-8 pt-6 border-t dark:border-gray-700">
                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">System Status & Info</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                       {/* ... existing status blocks ... */}
                         <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                           <p className="font-medium text-green-600 dark:text-green-400">API Status: Connected</p>
                         </div>
                         <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                           <p className="text-gray-500 dark:text-gray-400">Current User Role</p>
                           <p className="font-medium text-gray-900 dark:text-white">{user?.role || 'N/A'}</p>
                        </div>
                         <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                           <p className="text-gray-500 dark:text-gray-400">System Version</p>
                           <p className="font-medium text-gray-900 dark:text-white">v1.2.0</p> {/* Example */}
                         </div>
                    </div>
                 </div>

            </div> {/* End Scrollable Content */}
           </div> {/* End Modal Card */}
        </div> /* End Modal Backdrop */
       )}
     </div> /* End Relative container */
  );
};

export default UserProfile;