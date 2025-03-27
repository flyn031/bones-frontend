import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Users, 
  FileText, 
  ShoppingCart, 
  Briefcase, 
  Box, 
  DollarSign, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';

const SystemFlowDiagram = () => {
  const [expandedSections, setExpandedSections] = useState({
    inventoryAlerts: false,
    customerHealth: false,
    financialOverview: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Bones CRM System Flow</h3>
      
      {/* Main Flow Diagram */}
      <div className="relative overflow-hidden rounded-lg border border-gray-200 p-4 bg-gray-50">
        <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:justify-between">
          {/* Customers */}
          <div className="flex flex-col items-center z-10">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <div className="mt-2 text-center">
              <h4 className="font-medium">Customers</h4>
              <p className="text-xs text-gray-500">Starting point</p>
            </div>
          </div>
          
          {/* Quotes */}
          <div className="flex flex-col items-center z-10">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="h-12 w-12 text-green-600" />
            </div>
            <div className="mt-2 text-center">
              <h4 className="font-medium">Quotes</h4>
              <p className="text-xs text-gray-500">Price proposals</p>
            </div>
          </div>
          
          {/* Orders */}
          <div className="flex flex-col items-center z-10">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-purple-600" />
            </div>
            <div className="mt-2 text-center">
              <h4 className="font-medium">Orders</h4>
              <p className="text-xs text-gray-500">Confirmed work</p>
            </div>
          </div>
          
          {/* Jobs */}
          <div className="flex flex-col items-center z-10">
            <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center">
              <Briefcase className="h-12 w-12 text-yellow-600" />
            </div>
            <div className="mt-2 text-center">
              <h4 className="font-medium">Jobs</h4>
              <p className="text-xs text-gray-500">Work execution</p>
            </div>
          </div>
          
          {/* Inventory */}
          <div className="flex flex-col items-center z-10">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
              <Box className="h-12 w-12 text-red-600" />
            </div>
            <div className="mt-2 text-center">
              <h4 className="font-medium">Inventory</h4>
              <p className="text-xs text-gray-500">Materials tracking</p>
            </div>
          </div>
          
          {/* Financial */}
          <div className="flex flex-col items-center z-10">
            <div className="w-24 h-24 rounded-full bg-cyan-100 flex items-center justify-center">
              <DollarSign className="h-12 w-12 text-cyan-600" />
            </div>
            <div className="mt-2 text-center">
              <h4 className="font-medium">Financial</h4>
              <p className="text-xs text-gray-500">Payment tracking</p>
            </div>
          </div>
        </div>
        
        {/* Flow Arrows */}
        <div className="hidden md:flex justify-between px-16 mt-4">
          {/* Right arrows between sections */}
          <div className="flex-1 flex justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-400">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
          <div className="flex-1 flex justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-400">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
          <div className="flex-1 flex justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-400">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
          <div className="flex-1 flex justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-400">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
          <div className="flex-1 flex justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-400">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Inventory Alert System Section */}
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('inventoryAlerts')}
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="font-medium">Inventory Alert System</h3>
          </div>
          {expandedSections.inventoryAlerts ? 
            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
            <ChevronDown className="h-5 w-5 text-gray-500" />}
        </div>
        
        {expandedSections.inventoryAlerts && (
          <div className="p-4 bg-white">
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                The Bones CRM system features a sophisticated inventory management system with multi-level alerts that help prevent stockouts and maintain optimal inventory levels.
              </p>
            </div>
            
            <h4 className="font-medium text-sm mb-2">Alert Thresholds and Triggers</h4>
            <div className="space-y-4 mb-4">
              <div className="bg-red-50 p-3 rounded-md border-l-4 border-red-500">
                <h5 className="font-medium text-red-800">Critical Alerts (High Priority)</h5>
                <p className="text-sm text-red-700 mt-1">
                  Triggered when: Stock falls to zero OR below 30% of minimum required level. Immediate action required to prevent production delays.
                </p>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-md border-l-4 border-amber-500">
                <h5 className="font-medium text-amber-800">Low Stock Alerts (Medium Priority)</h5>
                <p className="text-sm text-amber-700 mt-1">
                  Triggered when: Stock is below minimum level but above critical threshold. Place orders within the next ordering cycle.
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                <h5 className="font-medium text-blue-800">Reorder Alerts (Low Priority)</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Triggered when: Stock falls below reorder point but remains above minimum level. Early warning for planning purposes.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-sm mb-2">Inventory Management Workflow</h4>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>The system constantly monitors inventory levels against configured thresholds</li>
                <li>Alerts are displayed on the main dashboard in order of severity</li>
                <li>Detailed inventory reports show all materials that require attention</li>
                <li>Each alert includes current stock level, minimum required level, lead time for reordering, and last order date</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Integration with Other Modules</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><span className="font-medium">Job Management:</span> Alerts consider materials allocated to upcoming jobs</li>
                <li><span className="font-medium">Supplier Management:</span> Links directly to preferred suppliers for quick ordering</li>
                <li><span className="font-medium">Financial Planning:</span> Helps forecast procurement expenses</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Customer Health System Section */}
      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('customerHealth')}
        >
          <div className="flex items-center">
            <Users className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-medium">Customer Health Scoring System</h3>
          </div>
          {expandedSections.customerHealth ? 
            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
            <ChevronDown className="h-5 w-5 text-gray-500" />}
        </div>
        
        {expandedSections.customerHealth && (
          <div className="p-4 bg-white">
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                The Bones CRM's Customer Health scoring system provides a comprehensive method for evaluating customer relationships and identifying opportunities for growth and retention.
              </p>
            </div>
            
            {/* Simple Customer Health Score Diagram */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 600 400"
              className="w-full h-auto max-h-96 my-4"
            >
              {/* SVG content */}
              <rect width="600" height="400" fill="#ffffff" />
              
              {/* Title */}
              <text x="300" y="40" fontFamily="Arial, sans-serif" fontSize="20" textAnchor="middle" fontWeight="bold" fill="#000000">Customer Health Score</text>
              
              {/* Horizontal divider */}
              <line x1="50" y1="60" x2="550" y2="60" stroke="#cccccc" strokeWidth="1" />
              
              {/* Left column - Score Components */}
              <text x="150" y="90" fontFamily="Arial, sans-serif" fontSize="16" textAnchor="middle" fontWeight="bold" fill="#000000">Score Components</text>
              
              {/* Component boxes */}
              <rect x="50" y="110" width="200" height="35" rx="3" ry="3" fill="#f0f9ff" stroke="#000000" strokeWidth="1" />
              <text x="60" y="132" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Recency</text>
              <text x="240" y="132" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="end" fill="#000000">30%</text>
              
              <rect x="50" y="155" width="200" height="35" rx="3" ry="3" fill="#f0f9ff" stroke="#000000" strokeWidth="1" />
              <text x="60" y="177" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Frequency</text>
              <text x="240" y="177" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="end" fill="#000000">20%</text>
              
              <rect x="50" y="200" width="200" height="35" rx="3" ry="3" fill="#f0f9ff" stroke="#000000" strokeWidth="1" />
              <text x="60" y="222" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Monetary</text>
              <text x="240" y="222" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="end" fill="#000000">20%</text>
              
              <rect x="50" y="245" width="200" height="35" rx="3" ry="3" fill="#f0f9ff" stroke="#000000" strokeWidth="1" />
              <text x="60" y="267" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Loyalty</text>
              <text x="240" y="267" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="end" fill="#000000">15%</text>
              
              <rect x="50" y="290" width="200" height="35" rx="3" ry="3" fill="#f0f9ff" stroke="#000000" strokeWidth="1" />
              <text x="60" y="312" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Growth</text>
              <text x="240" y="312" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="end" fill="#000000">15%</text>
              
              {/* Right column - Risk Categories */}
              <text x="450" y="90" fontFamily="Arial, sans-serif" fontSize="16" textAnchor="middle" fontWeight="bold" fill="#000000">Risk Categories</text>
              
              {/* Category boxes */}
              <rect x="350" y="110" width="200" height="60" rx="3" ry="3" fill="#ffcccc" stroke="#000000" strokeWidth="1" />
              <text x="360" y="135" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#000000">High Risk</text>
              <text x="360" y="155" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Score: 0-40</text>
              
              <rect x="350" y="180" width="200" height="60" rx="3" ry="3" fill="#ffffcc" stroke="#000000" strokeWidth="1" />
              <text x="360" y="205" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#000000">Medium Risk</text>
              <text x="360" y="225" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Score: 41-70</text>
              
              <rect x="350" y="250" width="200" height="60" rx="3" ry="3" fill="#ccffcc" stroke="#000000" strokeWidth="1" />
              <text x="360" y="275" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#000000">Low Risk</text>
              <text x="360" y="295" fontFamily="Arial, sans-serif" fontSize="14" fill="#000000">Score: 71-100</text>
              
              {/* Note at bottom */}
              <text x="300" y="370" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="middle" fill="#666666">Customer health scores help identify retention opportunities and churn risks</text>
            </svg>
            
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">How We Use Customer Health Scores</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><span className="font-medium">Churn Prevention:</span> Early warning signs allow proactive engagement</li>
                <li><span className="font-medium">Growth Opportunities:</span> Identify customers ready for additional products/services</li>
                <li><span className="font-medium">Resource Allocation:</span> Focus attention where it can have the biggest impact</li>
                <li><span className="font-medium">Relationship Management:</span> Tailor communication based on customer status</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Financial Overview Section */}
      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection('financialOverview')}
        >
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-emerald-500 mr-2" />
            <h3 className="font-medium">Financial Overview System</h3>
          </div>
          {expandedSections.financialOverview ? 
            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
            <ChevronDown className="h-5 w-5 text-gray-500" />}
        </div>
        
        {expandedSections.financialOverview && (
          <div className="p-4 bg-white">
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                The Bones CRM Financial Overview system provides real-time insights into your business's financial performance, helping you track revenue, costs, and profitability.
              </p>
            </div>
            
            <h4 className="font-medium text-sm mb-2">Key Financial Metrics</h4>
            <div className="space-y-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                <h5 className="font-medium text-blue-800">Revenue Tracking</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Real-time calculation based on completed orders and invoices. Includes month-over-month comparison and trend analysis.
                </p>
              </div>
              
              <div className="bg-emerald-50 p-3 rounded-md border-l-4 border-emerald-500">
                <h5 className="font-medium text-emerald-800">Cost Analysis</h5>
                <p className="text-sm text-emerald-700 mt-1">
                  Compilation of job costs, material expenses, and operational overhead. Tracked against budgets to identify variances.
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-500">
                <h5 className="font-medium text-purple-800">Profit Margins</h5>
                <p className="text-sm text-purple-700 mt-1">
                  Real-time calculation of gross and net margins across all jobs and projects. Provides insights into profitability by customer and service type.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-sm mb-2">How Financial Data Is Generated</h4>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Job costs are tracked through material usage and time entries</li>
                <li>Revenue is calculated from completed orders and paid invoices</li>
                <li>The system periodically aggregates financial data for reporting</li>
                <li>Comparisons are made against previous periods automatically</li>
                <li>Data is visualized in charts to highlight trends and patterns</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Integration with Other Modules</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><span className="font-medium">Order System:</span> Pulls revenue data from processed orders</li>
                <li><span className="font-medium">Job Management:</span> Tracks costs associated with each project</li>
                <li><span className="font-medium">Inventory:</span> Factors in material costs and depreciation</li>
                <li><span className="font-medium">Reporting:</span> Generates detailed financial reports exportable to various formats</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemFlowDiagram;