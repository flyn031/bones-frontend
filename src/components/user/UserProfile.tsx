import { useState, useEffect } from 'react';
import { User, LogOut, Info, X, Settings, Activity, Shield, Building, Upload, Image } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient as api } from '../../utils/api';
import SystemFlowDiagram from '../dashboard/SystemFlowDiagram';
import { Button, Input, Alert } from '../ui';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface MessageState {
  type: AlertType | '';
  text: string;
}

interface SafeUserProfile {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyVatNumber?: string;
  companyLogo?: string;
  useCompanyDetailsOnQuotes?: boolean;
  // Company defaults for quotes
  standardWarranty?: string;
  standardDeliveryTerms?: string;
  defaultLeadTimeWeeks?: number;
  standardExclusions?: string;
}

interface CompanyDetailsState {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyVatNumber: string;
  companyLogo: string;
  useCompanyDetailsOnQuotes: boolean;
  // Company defaults for quotes
  standardWarranty: string;
  standardDeliveryTerms: string;
  defaultLeadTimeWeeks: number;
  standardExclusions: string;
}

const UserProfile = () => {
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
  const [passwordMessage, setPasswordMessage] = useState<MessageState>({ type: '', text: '' });
  const [profileMessage, setProfileMessage] = useState<MessageState>({ type: '', text: '' });
  
  const safeUser: SafeUserProfile = user ? {
    id: user.id || undefined,
    name: user.name || undefined,
    email: user.email || undefined,
    role: user.role || undefined,
    createdAt: user.createdAt || undefined,
    companyName: (user as any).companyName || undefined,
    companyAddress: (user as any).companyAddress || undefined,
    companyPhone: (user as any).companyPhone || undefined,
    companyEmail: (user as any).companyEmail || undefined,
    companyWebsite: (user as any).companyWebsite || undefined,
    companyVatNumber: (user as any).companyVatNumber || undefined,
    companyLogo: (user as any).companyLogo || undefined,
    useCompanyDetailsOnQuotes: Boolean((user as any).useCompanyDetailsOnQuotes),
    standardWarranty: (user as any).standardWarranty || undefined,
    standardDeliveryTerms: (user as any).standardDeliveryTerms || undefined,
    defaultLeadTimeWeeks: (user as any).defaultLeadTimeWeeks || undefined,
    standardExclusions: (user as any).standardExclusions || undefined,
  } : {};

  const [logoPreview, setLogoPreview] = useState(safeUser.companyLogo || '');

  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsState>({
    companyName: safeUser.companyName || '',
    companyAddress: safeUser.companyAddress || '',
    companyPhone: safeUser.companyPhone || '',
    companyEmail: safeUser.companyEmail || '',
    companyWebsite: safeUser.companyWebsite || '',
    companyVatNumber: safeUser.companyVatNumber || '',
    companyLogo: safeUser.companyLogo || '',
    useCompanyDetailsOnQuotes: Boolean(safeUser.useCompanyDetailsOnQuotes),
    standardWarranty: safeUser.standardWarranty || '',
    standardDeliveryTerms: safeUser.standardDeliveryTerms || '',
    defaultLeadTimeWeeks: safeUser.defaultLeadTimeWeeks || 4,
    standardExclusions: safeUser.standardExclusions || '',
  });

  useEffect(() => {
    if (user) {
      const updatedSafeUser: SafeUserProfile = {
        id: user.id || undefined,
        name: user.name || undefined,
        email: user.email || undefined,
        role: user.role || undefined,
        createdAt: user.createdAt || undefined,
        companyName: (user as any).companyName || undefined,
        companyAddress: (user as any).companyAddress || undefined,
        companyPhone: (user as any).companyPhone || undefined,
        companyEmail: (user as any).companyEmail || undefined,
        companyWebsite: (user as any).companyWebsite || undefined,
        companyVatNumber: (user as any).companyVatNumber || undefined,
        companyLogo: (user as any).companyLogo || undefined,
        useCompanyDetailsOnQuotes: Boolean((user as any).useCompanyDetailsOnQuotes),
        standardWarranty: (user as any).standardWarranty || undefined,
        standardDeliveryTerms: (user as any).standardDeliveryTerms || undefined,
        defaultLeadTimeWeeks: (user as any).defaultLeadTimeWeeks || undefined,
        standardExclusions: (user as any).standardExclusions || undefined,
      };

      setCompanyDetails({
        companyName: updatedSafeUser.companyName || '',
        companyAddress: updatedSafeUser.companyAddress || '',
        companyPhone: updatedSafeUser.companyPhone || '',
        companyEmail: updatedSafeUser.companyEmail || '',
        companyWebsite: updatedSafeUser.companyWebsite || '',
        companyVatNumber: updatedSafeUser.companyVatNumber || '',
        companyLogo: updatedSafeUser.companyLogo || '',
        useCompanyDetailsOnQuotes: Boolean(updatedSafeUser.useCompanyDetailsOnQuotes),
        standardWarranty: updatedSafeUser.standardWarranty || '',
        standardDeliveryTerms: updatedSafeUser.standardDeliveryTerms || '',
        defaultLeadTimeWeeks: updatedSafeUser.defaultLeadTimeWeeks || 4,
        standardExclusions: updatedSafeUser.standardExclusions || '',
      });
      setLogoPreview(updatedSafeUser.companyLogo || '');
    }
  }, [user]);

  const recentActivity = [
    { id: 1, action: 'Logged in', timestamp: '2025-03-10 09:45 AM' },
    { id: 2, action: 'Updated job #JB-1234', timestamp: '2025-03-09 03:22 PM' },
    { id: 3, action: 'Created new customer "Example Corp"', timestamp: '2025-03-09 11:05 AM' },
    { id: 4, action: 'Generated quote #Q-5678 for "Example Corp"', timestamp: '2025-03-08 02:17 PM' },
    { id: 5, action: 'Viewed inventory report', timestamp: '2025-03-07 10:33 AM' }
  ];

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    setActiveTab('info');
    setIsMenuOpen(false);
  };

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

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      console.log('Attempting password change...');
      await new Promise(resolve => setTimeout(resolve, 750));
      console.log('Password changed successfully (simulated).');

      setPasswordMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 4000);

    } catch (error: any) {
      console.error('Password change API error:', error);
      setPasswordMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to update password. Please check your current password and try again.'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setCompanyDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'defaultLeadTimeWeeks' ? Number(value) : value)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setProfileMessage({ type: '', text: '' });
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Please select an image file (PNG, JPG, GIF etc.)' });
      return;
    }
    if (file.size > 500 * 1024) {
      setProfileMessage({ type: 'error', text: 'Logo image must be smaller than 500KB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setCompanyDetails(prev => ({ ...prev, companyLogo: base64String }));
      setProfileMessage({ type: 'info', text: 'New logo selected. Remember to save changes.' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      setProfileMessage({ type: 'error', text: 'Error reading the logo file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoPreview('');
    setCompanyDetails(prev => ({ ...prev, companyLogo: '' }));
    setProfileMessage({ type: 'info', text: 'Logo removed. Remember to save changes.' });
    setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
  };

  const handleSaveCompanyDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    try {
      console.log('Saving company details:', companyDetails);
      const response = await api.put('/auth/profile', companyDetails);
      
      console.log('Server response:', response.data);
      
      interface CleanUserData {
        id?: string;
        name?: string;
        email?: string;
        role?: string;
        createdAt?: string;
        companyName?: string;
        companyAddress?: string;
        companyPhone?: string;
        companyEmail?: string;
        companyWebsite?: string;
        companyVatNumber?: string;
        companyLogo?: string;
        useCompanyDetailsOnQuotes?: boolean;
        standardWarranty?: string;
        standardDeliveryTerms?: string;
        defaultLeadTimeWeeks?: number;
        standardExclusions?: string;
        [key: string]: any;
      }
      
      const updatedUser: CleanUserData = {};
      
      if (user) {
        updatedUser.id = user.id;
        updatedUser.name = user.name;
        updatedUser.email = user.email;
        updatedUser.role = user.role;
        updatedUser.createdAt = user.createdAt;
        updatedUser.companyName = (user as any).companyName;
        updatedUser.companyAddress = (user as any).companyAddress;
        updatedUser.companyPhone = (user as any).companyPhone;
        updatedUser.companyEmail = (user as any).companyEmail;
        updatedUser.companyWebsite = (user as any).companyWebsite;
        updatedUser.companyVatNumber = (user as any).companyVatNumber;
        updatedUser.companyLogo = (user as any).companyLogo;
        updatedUser.useCompanyDetailsOnQuotes = (user as any).useCompanyDetailsOnQuotes;
        updatedUser.standardWarranty = (user as any).standardWarranty;
        updatedUser.standardDeliveryTerms = (user as any).standardDeliveryTerms;
        updatedUser.defaultLeadTimeWeeks = (user as any).defaultLeadTimeWeeks;
        updatedUser.standardExclusions = (user as any).standardExclusions;
      }
      
      if (response.data && typeof response.data === 'object') {
        const rd = response.data as any;
        
        if (rd.id !== undefined) updatedUser.id = rd.id;
        if (rd.name !== undefined) updatedUser.name = rd.name;
        if (rd.email !== undefined) updatedUser.email = rd.email;
        if (rd.role !== undefined) updatedUser.role = rd.role;
        if (rd.createdAt !== undefined) updatedUser.createdAt = rd.createdAt;
        if (rd.companyName !== undefined) updatedUser.companyName = rd.companyName;
        if (rd.companyAddress !== undefined) updatedUser.companyAddress = rd.companyAddress;
        if (rd.companyPhone !== undefined) updatedUser.companyPhone = rd.companyPhone;
        if (rd.companyEmail !== undefined) updatedUser.companyEmail = rd.companyEmail;
        if (rd.companyWebsite !== undefined) updatedUser.companyWebsite = rd.companyWebsite;
        if (rd.companyVatNumber !== undefined) updatedUser.companyVatNumber = rd.companyVatNumber;
        if (rd.companyLogo !== undefined) updatedUser.companyLogo = rd.companyLogo;
        if (rd.useCompanyDetailsOnQuotes !== undefined) updatedUser.useCompanyDetailsOnQuotes = rd.useCompanyDetailsOnQuotes;
        if (rd.standardWarranty !== undefined) updatedUser.standardWarranty = rd.standardWarranty;
        if (rd.standardDeliveryTerms !== undefined) updatedUser.standardDeliveryTerms = rd.standardDeliveryTerms;
        if (rd.defaultLeadTimeWeeks !== undefined) updatedUser.defaultLeadTimeWeeks = rd.defaultLeadTimeWeeks;
        if (rd.standardExclusions !== undefined) updatedUser.standardExclusions = rd.standardExclusions;
        
        const knownProps = ['id', 'name', 'email', 'role', 'createdAt', 'companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyWebsite', 'companyVatNumber', 'companyLogo', 'useCompanyDetailsOnQuotes', 'standardWarranty', 'standardDeliveryTerms', 'defaultLeadTimeWeeks', 'standardExclusions'];
        Object.keys(rd).forEach(key => {
          if (!knownProps.includes(key)) {
            updatedUser[key] = rd[key];
          }
        });
      }
      
      updatedUser.useCompanyDetailsOnQuotes = companyDetails.useCompanyDetailsOnQuotes;
      updatedUser.standardWarranty = companyDetails.standardWarranty;
      updatedUser.standardDeliveryTerms = companyDetails.standardDeliveryTerms;
      updatedUser.defaultLeadTimeWeeks = companyDetails.defaultLeadTimeWeeks;
      updatedUser.standardExclusions = companyDetails.standardExclusions;
      
      console.log('Clean updated user for context:', updatedUser);
      updateUser(updatedUser);
      
      setProfileMessage({ 
        type: 'success', 
        text: 'Company details updated successfully!' 
      });
      
      setTimeout(() => {
        setProfileMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating company details:', error);
      
      const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Failed to update company details. Please try again.';
      
      setProfileMessage({
        type: 'error',
        text: errorMessage
      });
    }
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <div className="flex items-center">
        <button
          onClick={handleProfileClick}
          className="hidden md:inline-block mr-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded px-2 py-1 transition-colors"
          aria-label="Open profile settings"
        >
          {safeUser?.companyName || safeUser?.name?.split(' ')[0] || 'Profile'}
        </button>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-2 rounded-full bg-white dark:bg-gray-700 p-1 sm:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-label="User profile menu"
        >
          {logoPreview ? (
            <img 
              src={logoPreview} 
              alt="Company Logo" 
              className="h-6 w-6 rounded-full object-cover border border-gray-200 dark:border-gray-600" 
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {safeUser?.companyName?.charAt(0).toUpperCase() || 
               safeUser?.name?.charAt(0).toUpperCase() || 
               <User className="h-4 w-4" />}
            </div>
          )}
          
          <span className="inline md:hidden text-sm font-medium">
            {safeUser?.companyName || safeUser?.name?.split(' ')[0] || 'Profile'}
          </span>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="py-1 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white" role="none">
                {safeUser?.companyName || safeUser?.name || 'Current User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate" role="none">
                {safeUser?.email || 'No email provided'}
              </p>
              {safeUser?.companyName && safeUser?.name && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate" role="none">
                  {safeUser.name}
                </p>
              )}
            </div>

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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-modal-title">
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

            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center">
                 {logoPreview ? (
                   <img src={logoPreview} alt="Company Logo Preview" className="h-16 w-16 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0"/>
                 ) : (
                   <div className="bg-indigo-500 text-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold shadow-sm flex-shrink-0">
                    {safeUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                 )}
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{safeUser?.name || 'User Name'}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{safeUser?.email || 'user@example.com'}</p>
                  <p className="mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {safeUser?.role || 'Default Role'}
                  </p>
                </div>
              </div>
            </div>

             <div className="flex-grow overflow-y-auto">
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
                        aria-controls={`tab-panel-${tab.key}`}
                      >
                        <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.key ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'}`} aria-hidden="true" />
                        <span>{tab.label}</span>
                      </button>
                     ))}
                   </nav>
                </div>

                <div className="p-6">
                    {/* Account Info Tab */}
                    <div id="tab-panel-info" role="tabpanel" tabIndex={0} hidden={activeTab !== 'info'}>
                         <h2 className="sr-only">Account Information</h2>
                        <div className="space-y-5">
                            <dl>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{safeUser?.name || 'N/A'}</dd>
                                </div>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-t dark:border-gray-700">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{safeUser?.email || 'N/A'}</dd>
                                </div>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-t dark:border-gray-700">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User Role</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{safeUser?.role || 'N/A'}</dd>
                                </div>
                                <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-t dark:border-gray-700">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                        {safeUser?.createdAt ? new Date(safeUser.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                    </dd>
                                </div>
                             </dl>
                         </div>
                    </div>

                   {/* Company Tab - NEW: With Default Quote Terms */}
                    <div id="tab-panel-company" role="tabpanel" tabIndex={0} hidden={activeTab !== 'company'}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Company Details</h2>
                        {profileMessage.text && profileMessage.type && (
                            <Alert 
                              type={profileMessage.type as AlertType} 
                              message={profileMessage.text} 
                              className="mb-4" 
                            />
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Manage your company information and default quote terms.
                         </p>
                        <form onSubmit={handleSaveCompanyDetails} className="space-y-6 max-w-3xl">
                           {/* Company Logo */}
                           <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                             <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="flex-shrink-0 w-32 h-32 border border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-white dark:bg-gray-700 overflow-hidden">
                                     {logoPreview ? (<img src={logoPreview} alt="Company Logo Preview" className="max-h-full max-w-full object-contain p-1"/>)
                                                : (<Image className="h-10 w-10 text-gray-400 dark:text-gray-500" />)}
                               </div>
                                <div className="flex-grow space-y-2">
                                   <p className="text-xs text-gray-500 dark:text-gray-400">Max 500KB. Appears on PDFs and in the header.</p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <label htmlFor="logo-upload-input" className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                       <Upload className="h-4 w-4 mr-2" />
                                        <span>{logoPreview ? 'Change' : 'Upload'}</span>
                                     </label>
                                      {logoPreview && (<button type="button" onClick={handleClearLogo} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"><X className="h-4 w-4 mr-1" /> Remove</button>)}
                                   </div>
                                   <input id="logo-upload-input" type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only"/>
                                 </div>
                             </div>
                           </div>
                           
                           {/* Basic Company Info */}
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
                           
                           {/* NEW: Default Quote Terms Section */}
                           <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                             <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Default Quote Terms</h3>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                               Set default terms that will be inherited by new quotes. You can customize these for each individual quote.
                             </p>
                             
                             <div className="space-y-4">
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
                                 <textarea
                                   name="standardWarranty"
                                   value={companyDetails.standardWarranty}
                                   onChange={handleCompanyDetailsChange}
                                   rows={2}
                                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                   placeholder="e.g., Net 30 days from invoice date"
                                 />
                               </div>
                               
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Terms</label>
                                 <textarea
                                   name="standardDeliveryTerms"
                                   value={companyDetails.standardDeliveryTerms}
                                   onChange={handleCompanyDetailsChange}
                                   rows={2}
                                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                   placeholder="e.g., 4-6 weeks from order confirmation"
                                 />
                               </div>
                               
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Lead Time (weeks)</label>
                                 <Input
                                   type="number"
                                   name="defaultLeadTimeWeeks"
                                   value={companyDetails.defaultLeadTimeWeeks}
                                   onChange={handleCompanyDetailsChange}
                                   min="1"
                                   max="52"
                                   placeholder="4"
                                 />
                               </div>
                               
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty</label>
                                 <textarea
                                   name="standardWarranty"
                                   value={companyDetails.standardWarranty}
                                   onChange={handleCompanyDetailsChange}
                                   rows={3}
                                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                   placeholder="e.g., 12 months warranty covering workmanship and materials"
                                 />
                               </div>
                               
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Exclusions</label>
                                 <textarea
                                   name="standardExclusions"
                                   value={companyDetails.standardExclusions}
                                   onChange={handleCompanyDetailsChange}
                                   rows={3}
                                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                   placeholder="e.g., VAT, Installation, Delivery charges"
                                 />
                                 <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">List items that are typically excluded from quotes</p>
                               </div>
                             </div>
                           </div>
                           
                           {/* Toggle */}
                           <div className="flex items-start pt-2">
                             <div className="flex items-center h-5"><input id="useCompanyDetailsOnQuotes" name="useCompanyDetailsOnQuotes" type="checkbox" checked={companyDetails.useCompanyDetailsOnQuotes} onChange={handleCompanyDetailsChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-indigo-500 rounded"/></div>
                              <div className="ml-3 text-sm"><label htmlFor="useCompanyDetailsOnQuotes" className="font-medium text-gray-700 dark:text-gray-300">Enable Company Branding on Quotes</label><p className="text-gray-500 dark:text-gray-400 text-xs">Adds logo, name, and address to generated PDF quotes.</p></div>
                            </div>
                           
                           <div className="pt-4"><Button type="submit">Save Company Details</Button></div>
                         </form>
                     </div>

                     {/* Security Tab */}
                    <div id="tab-panel-security" role="tabpanel" tabIndex={0} hidden={activeTab !== 'security'}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Security Settings</h2>
                         {passwordMessage.text && passwordMessage.type && (
                           <Alert 
                             type={passwordMessage.type as AlertType} 
                             message={passwordMessage.text} 
                             className="mb-6" 
                           />
                         )}
                         <h3 className="text-base font-medium mb-3 text-gray-800 dark:text-gray-200">Change Your Password</h3>
                         <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                             <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label><Input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handleInputChange} required autoComplete="current-password"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password (min 8 chars)</label><Input type="password" name="newPassword" value={passwordData.newPassword} onChange={handleInputChange} required autoComplete="new-password"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label><Input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handleInputChange} required autoComplete="new-password"/></div>
                            <Button type="submit" className="mt-4">Update Password</Button>
                         </form>
                     </div>

                     {/* Preferences Tab */}
                    <div id="tab-panel-preferences" role="tabpanel" tabIndex={0} hidden={activeTab !== 'preferences'}>
                        <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Interface Preferences</h2>
                       <div className="space-y-8 max-w-lg">
                            <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                               <div><h3 className="text-base font-medium text-gray-900 dark:text-gray-200">Dark Mode</h3><p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes.</p></div>
                                <label className="ml-4 inline-flex relative items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={handleThemeToggle}/><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                             </div>
                             <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                               <div><h3 className="text-base font-medium text-gray-900 dark:text-gray-200">System Notifications</h3><p className="text-sm text-gray-500 dark:text-gray-400">Enable/disable non-critical system alerts.</p></div>
                               <label className="ml-4 inline-flex relative items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)}/><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                            </div>
                       </div>
                     </div>

                    {/* Activity Tab */}
                    <div id="tab-panel-activity" role="tabpanel" tabIndex={0} hidden={activeTab !== 'activity'}>
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Account Activity</h2>
                         <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Shows the last few actions performed by your account (simulation).</p>
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                               <thead className="bg-gray-50 dark:bg-gray-700/50"><tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"><th scope="col" className="px-6 py-3">Action</th><th scope="col" className="px-6 py-3">Timestamp</th></tr></thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {recentActivity.map((item) => (<tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{item.action}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.timestamp}</td></tr>))}
                                </tbody>
                            </table>
                         </div>
                     </div>

                 </div>
             </div>

          </div>
        </div>
      )}

      {/* System Overview Modal */}
      {showSystemOverview && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full m-4 max-h-[90vh] flex flex-col"
                 role="dialog"
                aria-modal="true"
                aria-labelledby="system-overview-title">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 id="system-overview-title" className="text-xl font-semibold text-gray-900 dark:text-white">System Overview & Flow</h2>
              <button
                onClick={() => setShowSystemOverview(false)}
                 className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                 aria-label="Close system overview"
               >
                 <X className="h-6 w-6" />
               </button>
             </div>
             <div className="p-6 flex-grow overflow-y-auto">
                <SystemFlowDiagram />
            </div>
           </div>
        </div>
       )}
     </div>
  );
};

export default UserProfile;