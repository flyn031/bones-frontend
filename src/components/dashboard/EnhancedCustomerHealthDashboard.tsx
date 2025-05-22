import React, { useState, useEffect } from 'react';
import { CustomerHealthDashboard } from './CustomerHealthDashboard';
import { Button } from '@/components/ui';
import { BrainCircuit, Users } from 'lucide-react';

/**
 * Enhanced Customer Health Dashboard component that combines the
 * original dashboard with AI-powered predictive analytics
 */
const EnhancedCustomerHealthDashboard: React.FC = () => {
  console.log("EnhancedCustomerHealthDashboard is rendering");
  const [activeTab, setActiveTab] = useState<'current' | 'predictive'>('current');

  useEffect(() => {
    console.log("EnhancedCustomerHealthDashboard mounted, active tab:", activeTab);
  }, [activeTab]);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg">
      {/* Debug header */}
      <div className="bg-blue-600 text-white p-4 font-bold text-xl rounded-t-lg">
        Customer Health Analytics
      </div>
      
      {/* Tab navigation - with extra visible styling */}
      <div className="flex border-b border-gray-200 bg-white" style={{zIndex: 50, position: 'relative'}}>
        <button
          className={`px-6 py-4 flex items-center gap-2 border-b-2 font-medium ${
            activeTab === 'current'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => {
            console.log("Current tab clicked");
            setActiveTab('current');
          }}
        >
          <Users size={20} />
          <span className="text-base">Current Health</span>
        </button>
        
        <button
          className={`px-6 py-4 flex items-center gap-2 border-b-2 font-medium ${
            activeTab === 'predictive'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => {
            console.log("Predictive tab clicked");
            setActiveTab('predictive');
          }}
        >
          <BrainCircuit size={20} />
          <span className="text-base">AI Predictions</span>
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
            NEW
          </span>
        </button>
      </div>

      {/* Active content */}
      <div className="p-4">
        {activeTab === 'current' ? (
          <div>
            <CustomerHealthDashboard />
            <div className="mt-8 text-center">
              <div className="bg-blue-50 rounded-lg p-6 max-w-3xl mx-auto">
                <h3 className="text-xl font-medium text-blue-800 mb-2 flex items-center justify-center">
                  <BrainCircuit size={24} className="mr-2" />
                  Try Our New AI-Powered Predictions
                </h3>
                <p className="text-blue-700 mb-4">
                  Go beyond current customer health data with AI-powered predictions. 
                  Identify at-risk customers before they churn and discover hidden upsell opportunities.
                </p>
                <Button onClick={() => {
                  console.log("Switch to AI Predictions button clicked");
                  setActiveTab('predictive');
                }}>
                  Switch to AI Predictions
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 p-6 rounded-lg border-2 border-yellow-400">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">AI Predictions Tab Content</h2>
            <p className="text-yellow-700 mb-4">This is where the PredictiveCustomerHealth component would be displayed.</p>
            <p className="text-yellow-700">When you implement the PredictiveCustomerHealth component, you'll need to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-yellow-700">
              <li>Create the PredictiveCustomerHealth.tsx file</li>
              <li>Uncomment the import in EnhancedCustomerHealthDashboard.tsx</li>
              <li>Replace this placeholder content with the actual component</li>
            </ul>
            <div className="mt-6 p-4 bg-white rounded shadow-md">
              <h3 className="font-bold text-gray-800 mb-2">What would appear here:</h3>
              <p className="text-gray-700">
                Charts and analytics showing predicted customer behavior, churn risk forecasts, 
                and recommended actions to improve customer retention and identify growth opportunities.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCustomerHealthDashboard;