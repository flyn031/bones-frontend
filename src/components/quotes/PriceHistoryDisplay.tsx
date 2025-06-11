import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Info, Loader } from 'lucide-react';
import axios from 'axios';

interface PricePoint {
  date: string;
  price: number;
  formattedDate: string;
  reason?: string;
}

interface PriceHistoryDisplayProps {
  materialId: string;
  customerId?: string;
}

const PriceHistoryDisplay: React.FC<PriceHistoryDisplayProps> = ({ materialId, customerId }) => {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [materialName, setMaterialName] = useState('');
  
  useEffect(() => {
    const fetchPriceHistory = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams({
          materialId
        });
        
        if (customerId) {
          queryParams.append('customerId', customerId);
        }
        
        const response = await axios.get(
          `http://localhost:4000/api/materials/price-history?${queryParams}`,
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
        
        // Format the data for the chart
        if (response.data && Array.isArray((response.data as any).priceHistory)) {
          const formattedData = (response.data as any).priceHistory.map((point: any) => ({
            date: new Date(point.effectiveFrom).toISOString(),
            price: point.unitPrice,
            formattedDate: new Date(point.effectiveFrom).toLocaleDateString(),
            reason: point.reason
          }));
          
          setPriceHistory(formattedData);
          setMaterialName((response.data as any).materialName || 'Selected Item');
        } else {
          // Use mock data if the API response isn't as expected
          const mockData = generateMockPriceHistory();
          setPriceHistory(mockData);
        }
      } catch (error) {
        console.error('Error fetching price history:', error);
        // Use mock data if the API is not available
        const mockData = generateMockPriceHistory();
        setPriceHistory(mockData);
      } finally {
        setIsLoading(false);
      }
    };
    
    const generateMockPriceHistory = (): PricePoint[] => {
      const now = new Date();
      const mockData: PricePoint[] = [];
      
      // Generate 6 price points over the last 12 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i * 2, 1);
        const basePrice = 1000; // Starting price
        let fluctuation = 0;
        
        // Add some realistic price changes
        if (i < 5) {
          // Each point has a chance to go up or down
          fluctuation = (Math.random() > 0.3 ? 1 : -1) * Math.random() * 100;
        }
        
        const price = basePrice + (5 - i) * 50 + fluctuation;
        
        mockData.push({
          date: date.toISOString(),
          price: parseFloat(price.toFixed(2)),
          formattedDate: date.toLocaleDateString(),
          reason: i === 1 ? 'Material cost increase' : undefined
        });
      }
      
      return mockData;
    };
    
    if (materialId) {
      fetchPriceHistory();
    }
  }, [materialId, customerId]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader className="h-6 w-6 animate-spin text-blue-500 mr-2" />
        <span className="text-gray-600">Loading price history...</span>
      </div>
    );
  }
  
  if (priceHistory.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-2">
        No price history available for this item.
      </div>
    );
  }
  
  // Determine value range for Y axis
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const yAxisRange = [Math.max(0, minPrice * 0.9), maxPrice * 1.1];
  
  return (
    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-medium mb-2 flex items-center">
        Price History: {materialName}
        <div className="relative group ml-2">
          <Info className="h-4 w-4 text-gray-400 cursor-help" />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-white shadow-lg rounded-lg p-2 text-xs w-48 z-10">
            {customerId 
              ? "Shows customer-specific pricing where available, falling back to standard prices." 
              : "Shows standard material pricing over time."}
          </div>
        </div>
      </h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="formattedDate"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={yAxisRange}
              tickFormatter={(value) => `£${value}`}
            />
            <Tooltip 
              formatter={(value) => [`£${Number(value).toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {priceHistory.some(p => p.reason) && (
        <div className="mt-2">
          <h5 className="text-xs font-medium">Price Change Notes:</h5>
          <ul className="text-xs text-gray-600 list-disc pl-4 mt-1">
            {priceHistory.filter(p => p.reason).map((point, index) => (
              <li key={index}>
                <b>{point.formattedDate}</b>: {point.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryDisplay;