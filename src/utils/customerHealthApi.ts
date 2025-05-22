import axios from 'axios';

// Function to fetch regular customer health data
export const fetchCustomerHealth = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await axios.get('/api/dashboard/customer-health', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching customer health data:', error);
    throw error;
  }
};

// Function to fetch predictive customer health data
export const fetchPredictiveHealth = async (timeframe: '30' | '60' | '90' = '90') => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // In a real implementation, this would hit your backend endpoint
    // For now, we'll simulate with mock data to show the UI working
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return generateMockPredictiveData(timeframe);
  } catch (error) {
    console.error('Error fetching predictive health data:', error);
    throw error;
  }
};

// Mock data generator - in a real implementation this would be replaced by actual API call
const generateMockPredictiveData = (timeframe: string) => {
  // Scale factors based on timeframe to make the data realistic
  const timeFactor = parseInt(timeframe) / 90;
  
  // Mock customer data
  const customers = [
    {
      id: 'c1',
      name: 'Acme Corporation',
      company: 'Acme Corp',
      currentScore: 82,
      predictedScore: 75 - (timeFactor * 8),
      churnProbability: 0.65 * timeFactor,
      upsellPotential: 0.3,
      revenueImpact: 15000,
      lastOrder: '2025-02-15',
      insight: 'Declining engagement over last 3 months with slower response times to quotes. Recent industry changes may be affecting their budget allocation.',
      recommendedActions: [
        'Schedule business review meeting',
        'Offer maintenance package discount',
        'Share case study on cost savings'
      ],
      engagementTrend: 'decreasing' as const,
      orderFrequency: 45,
      lifetimeValue: 95000,
      segments: ['Enterprise', 'Manufacturing']
    },
    {
      id: 'c2',
      name: 'TechStart Solutions',
      company: 'TechStart',
      currentScore: 92,
      predictedScore: 94,
      churnProbability: 0.12,
      upsellPotential: 0.85,
      revenueImpact: 8000,
      lastOrder: '2025-03-12',
      insight: 'Rapidly growing customer with increased order frequency. Recently expanded office space suggests they may need additional services soon.',
      recommendedActions: [
        'Propose service level upgrade',
        'Introduce premium materials line',
        'Offer volume discount structure'
      ],
      engagementTrend: 'increasing' as const,
      orderFrequency: 18,
      lifetimeValue: 42000,
      segments: ['SMB', 'Tech']
    },
    {
      id: 'c3',
      name: 'Global Logistics Inc',
      company: 'Global Logistics',
      currentScore: 79,
      predictedScore: 77,
      churnProbability: 0.35,
      upsellPotential: 0.65,
      revenueImpact: 27000,
      lastOrder: '2025-03-01',
      insight: 'Consistent order patterns but showing price sensitivity. Competitor analysis indicates they may be exploring alternatives.',
      recommendedActions: [
        'Proactive price review',
        'Highlight quality differentiators',
        'Introduce loyalty program benefits'
      ],
      engagementTrend: 'stable' as const,
      orderFrequency: 30,
      lifetimeValue: 135000,
      segments: ['Enterprise', 'Logistics']
    },
    {
      id: 'c4',
      name: 'Smith Family Renovations',
      company: 'Smith Renovations',
      currentScore: 67,
      predictedScore: 55 - (timeFactor * 8),
      churnProbability: 0.78 * timeFactor,
      upsellPotential: 0.25,
      revenueImpact: 9500,
      lastOrder: '2025-01-20',
      insight: 'Significant reduction in order volume with longer decision cycles. Customer reported cash flow challenges in last interaction.',
      recommendedActions: [
        'Offer flexible payment terms',
        'Check in with personal call',
        'Provide economy options proposal'
      ],
      engagementTrend: 'decreasing' as const,
      orderFrequency: 60,
      lifetimeValue: 32000,
      segments: ['SMB', 'Construction']
    },
    {
      id: 'c5',
      name: 'Horizon Healthcare',
      company: 'Horizon Healthcare Group',
      currentScore: 88,
      predictedScore: 91,
      churnProbability: 0.15,
      upsellPotential: 0.72,
      revenueImpact: 35000,
      lastOrder: '2025-03-10',
      insight: 'Opening new facility next quarter with expanded services. Recent inquiries about bulk ordering suggest preparation for growth.',
      recommendedActions: [
        'Develop custom expansion package',
        'Schedule facility planning consultation',
        'Offer exclusive new product preview'
      ],
      engagementTrend: 'increasing' as const,
      orderFrequency: 22,
      lifetimeValue: 128000,
      segments: ['Enterprise', 'Healthcare']
    },
    {
      id: 'c6',
      name: 'FreshMart Stores',
      company: 'FreshMart Inc',
      currentScore: 75,
      predictedScore: 81,
      churnProbability: 0.22,
      upsellPotential: 0.68,
      revenueImpact: 18000,
      lastOrder: '2025-02-25',
      insight: 'Recently began expanding product range with interest in premium options. Seasonal purchasing patterns indicate opportunity for scheduled ordering program.',
      recommendedActions: [
        'Propose automatic reordering system',
        'Showcase premium product line',
        'Offer seasonal promotion package'
      ],
      engagementTrend: 'increasing' as const,
      orderFrequency: 14,
      lifetimeValue: 87000,
      segments: ['Mid-Market', 'Retail']
    },
    {
      id: 'c7',
      name: 'City Services Department',
      company: 'City of Metropolis',
      currentScore: 72,
      predictedScore: 65 - (timeFactor * 5),
      churnProbability: 0.58 * timeFactor,
      upsellPotential: 0.35,
      revenueImpact: 42000,
      lastOrder: '2025-01-05',
      insight: 'Budget constraints mentioned in recent communications. New procurement process may be causing approval delays.',
      recommendedActions: [
        'Schedule budget planning meeting',
        'Provide case studies on municipal savings',
        'Review contract terms for flexibility'
      ],
      engagementTrend: 'decreasing' as const,
      orderFrequency: 90,
      lifetimeValue: 215000,
      segments: ['Government', 'Services']
    },
    {
      id: 'c8',
      name: 'Elite Educational Institute',
      company: 'Elite Education',
      currentScore: 85,
      predictedScore: 89,
      churnProbability: 0.12,
      upsellPotential: 0.75,
      revenueImpact: 22000,
      lastOrder: '2025-03-05',
      insight: 'Planning campus renovation for summer. Recent inquiry about bulk discounts suggests preparation for larger orders.',
      recommendedActions: [
        'Develop education-specific package',
        'Schedule campus assessment',
        'Offer project management services'
      ],
      engagementTrend: 'increasing' as const,
      orderFrequency: 40,
      lifetimeValue: 105000,
      segments: ['Education', 'Mid-Market']
    }
  ];
  
  // Adjust data based on timeframe
  const adjustedCustomers = customers.map(customer => {
    // Clone the customer object to avoid modifying the original
    const adjustedCustomer = { ...customer };
    
    // Apply timeframe-specific adjustments
    if (timeframe === '30') {
      // For shorter timeframe, reduce the magnitude of changes
      adjustedCustomer.predictedScore = Math.max(
        0, 
        customer.currentScore - ((customer.currentScore - customer.predictedScore) * 0.3)
      );
      adjustedCustomer.churnProbability *= 0.7;
      adjustedCustomer.revenueImpact *= 0.4;
    } else if (timeframe === '60') {
      // For medium timeframe, make moderate adjustments
      adjustedCustomer.predictedScore = Math.max(
        0, 
        customer.currentScore - ((customer.currentScore - customer.predictedScore) * 0.6)
      );
      adjustedCustomer.churnProbability *= 0.85;
      adjustedCustomer.revenueImpact *= 0.7;
    }
    
    return adjustedCustomer;
  });
  
  // Generate retention trend based on timeframe
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const currentMonthIndex = 2; // March
  
  const retentionTrend = [];
  
  // Past months (actual data)
  for (let i = 0; i < 3; i++) {
    retentionTrend.push({
      month: months[currentMonthIndex - 2 + i],
      rate: 0.9 - (0.01 * i) // Slight decline in recent months
    });
  }
  
  // Future months (predicted)
  const futureMonths = parseInt(timeframe) / 30;
  for (let i = 1; i <= futureMonths; i++) {
    // Calculate predicted retention rate with some randomness
    let rate;
    const randomFactor = Math.random() * 0.04 - 0.02; // Between -0.02 and 0.02
    
    if (timeframe === '30') {
      rate = 0.87 + randomFactor;
    } else if (timeframe === '60') {
      rate = 0.85 + randomFactor - (0.01 * i);
    } else {
      rate = 0.83 + randomFactor - (0.015 * i);
    }
    
    retentionTrend.push({
      month: months[(currentMonthIndex + i) % months.length],
      rate: Math.max(0.7, Math.min(0.95, rate)) // Keep between 70% and 95%
    });
  }
  
  // Count high-risk and upsell customers
  const highRiskCount = adjustedCustomers.filter(c => c.churnProbability > 0.5).length;
  const upsellCount = adjustedCustomers.filter(c => c.upsellPotential > 0.6).length;
  
  // Calculate total revenue at risk
  const revenueAtRisk = adjustedCustomers
    .filter(c => c.churnProbability > 0.5)
    .reduce((sum, customer) => sum + customer.revenueImpact, 0);
  
  // Calculate total upsell potential
  const upsellPotential = adjustedCustomers
    .filter(c => c.upsellPotential > 0.6)
    .reduce((sum, customer) => sum + customer.revenueImpact, 0);
  
  // Generate customer segmentation data
  const segments = [
    { label: 'Enterprise', value: 3, growth: 5 },
    { label: 'SMB', value: 2, growth: 12 },
    { label: 'Mid-Market', value: 2, growth: 8 },
    { label: 'Government', value: 1, growth: -3 },
    { label: 'Manufacturing', value: 1, growth: 2 },
    { label: 'Healthcare', value: 1, growth: 15 },
    { label: 'Education', value: 1, growth: 10 },
    { label: 'Retail', value: 1, growth: 7 }
  ];
  
  return {
    customers: adjustedCustomers,
    metrics: {
      totalPredictedChurn: highRiskCount,
      churnRiskValue: revenueAtRisk,
      upsellOpportunities: upsellCount,
      upsellPotentialValue: upsellPotential,
      customerSegmentation: segments,
      retentionTrend: retentionTrend
    }
  };
};