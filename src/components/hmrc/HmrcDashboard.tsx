// src/components/hmrc/HmrcDashboard.tsx

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock, 
  PoundSterling,
  AlertCircle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

interface RdSummary {
  totalHours: number;
  rdHours: number;
  rdPercentage: number;
  totalEntries: number;
  rdEntries: number;
  uniqueEmployees: number;
  uniqueJobs: number;
}

interface HmrcReport {
  reportMetadata: {
    generatedAt: string;
    reportPeriod: {
      startDate: string;
      endDate: string;
    };
  };
  executiveSummary: {
    totalQualifyingExpenditure: number;
    totalRdHours: number;
    totalProjects: number;
    totalEmployees: number;
    averageHourlyRate: number;
    rdIntensity: number;
  };
  staffCosts: {
    rdStaffCosts: number;
    employeeSummary: Array<{
      employeeName: string;
      jobTitle: string;
      rdHours: number;
      rdCost: number;
      rdPercentage: number;
    }>;
  };
  projectDetails: Array<{
    jobTitle: string;
    customerName: string;
    totalRdHours: number;
    totalRdCost: number;
    technologicalUncertainties: string[];
  }>;
}

export const HmrcDashboard: React.FC = () => {
  const [summary, setSummary] = useState<RdSummary | null>(null);
  const [generatedReport, setGeneratedReport] = useState<HmrcReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadSummary();
  }, [dateRange]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`/api/time-entries/rd-summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error loading R&D summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHmrcReport = async () => {
    setReportLoading(true);
    try {
      const response = await fetch('/api/hmrc/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });

      if (response.ok) {
        const report = await response.json();
        setGeneratedReport(report);
      } else {
        alert('Failed to generate HMRC report');
      }
    } catch (error) {
      console.error('Error generating HMRC report:', error);
      alert('Error generating HMRC report');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = async (format: 'json' | 'csv') => {
    if (!generatedReport) return;

    try {
      const response = await fetch(`/api/hmrc/export-report?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hmrc-rd-report-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Failed to download ${format.toUpperCase()} report`);
      }
    } catch (error) {
      console.error(`Error downloading ${format} report:`, error);
      alert(`Error downloading ${format} report`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HMRC R&D Tax Credits</h1>
            <p className="text-gray-600">Generate reports for Research & Development tax credit claims</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              onClick={generateHmrcReport}
              disabled={reportLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {reportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate HMRC Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.rdHours}</p>
                <p className="text-sm text-gray-600">R&D Hours</p>
                <p className="text-xs text-blue-600">{formatPercentage(summary.rdPercentage)} of total</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.uniqueEmployees}</p>
                <p className="text-sm text-gray-600">R&D Employees</p>
                <p className="text-xs text-green-600">{summary.rdEntries} activities</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.uniqueJobs}</p>
                <p className="text-sm text-gray-600">R&D Projects</p>
                <p className="text-xs text-purple-600">Active this period</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(summary.rdPercentage)}</p>
                <p className="text-sm text-gray-600">R&D Intensity</p>
                <p className="text-xs text-orange-600">Total time allocation</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Report */}
      {generatedReport && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">HMRC R&D Report Generated</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadReport('csv')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
                <button
                  onClick={() => downloadReport('json')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Executive Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PoundSterling className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Qualifying Expenditure</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(generatedReport.executiveSummary.totalQualifyingExpenditure)}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">R&D Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {generatedReport.executiveSummary.totalRdHours.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">R&D Intensity</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatPercentage(generatedReport.executiveSummary.rdIntensity)}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Breakdown */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">R&D Projects</h3>
              <div className="space-y-4">
                {generatedReport.projectDetails.map((project, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{project.jobTitle}</h4>
                        <p className="text-sm text-gray-600">Client: {project.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(project.totalRdCost)}</p>
                        <p className="text-sm text-gray-600">{project.totalRdHours}h</p>
                      </div>
                    </div>
                    
                    {project.technologicalUncertainties.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Technological Uncertainties:</p>
                        <ul className="space-y-1">
                          {project.technologicalUncertainties.slice(0, 3).map((uncertainty, idx) => (
                            <li key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-orange-200">
                              {uncertainty}
                            </li>
                          ))}
                          {project.technologicalUncertainties.length > 3 && (
                            <li className="text-sm text-gray-500 pl-4">
                              +{project.technologicalUncertainties.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top R&D Contributors */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top R&D Contributors</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        R&D Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        R&D Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        R&D %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedReport.staffCosts.employeeSummary
                      .sort((a, b) => b.rdCost - a.rdCost)
                      .slice(0, 10)
                      .map((employee, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.employeeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.jobTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.rdHours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(employee.rdCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPercentage(employee.rdPercentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HMRC Compliance Notes */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-orange-900 mb-2">HMRC Compliance Notes</h3>
            <div className="space-y-2 text-sm text-orange-800">
              <p>• This report includes staff costs only. Add subcontractor fees, consumables, and EPW costs separately if applicable.</p>
              <p>• All R&D activities have been identified and described according to HMRC guidelines for technological advancement.</p>
              <p>• Time entries are recorded contemporaneously with detailed descriptions of technological uncertainties.</p>
              <p>• Hourly rates are based on market-standard compensation for respective job titles and experience levels.</p>
              <p>• Retain all supporting documentation including timesheets, project plans, and technical specifications for HMRC review.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HmrcDashboard;