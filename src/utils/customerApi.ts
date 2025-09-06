import axios from 'axios';
import { API_URL } from '../config/constants';

export interface CustomerContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  isPrimary?: boolean;
  customerId: string;
}

export interface CustomerWithContacts {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string | null;
  contactPerson?: string | null;
  contacts?: CustomerContact[];
}

// Get customers with their contacts
export const getCustomersWithContacts = async (): Promise<CustomerWithContacts[]> => {
  try {
    const token = localStorage.getItem("token");
    
    // First get all customers
    const customersResponse = await axios.get(
      `${API_URL}/customers`,
      { headers: { Authorization: `Bearer ${token}` }}
    );
    
    // FIX: Extract customers array from response object
    const customers = customersResponse.data.customers || customersResponse.data;
    
    // Then get contacts for each customer
    const customersWithContacts = await Promise.all(
      customers.map(async (customer: any) => {
        try {
          const contactsResponse = await axios.get(
            `${API_URL}/customers/${customer.id}/contacts`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          return {
            ...customer,
            contacts: contactsResponse.data || []
          };
        } catch (error) {
          console.warn(`Failed to fetch contacts for customer ${customer.id}:`, error);
          return {
            ...customer,
            contacts: []
          };
        }
      })
    );
    
    return customersWithContacts;
  } catch (error) {
    console.error('Error fetching customers with contacts:', error);
    throw error;
  }
};

// Create a new contact for a customer
export const createCustomerContact = async (customerId: string, contactData: Omit<CustomerContact, 'id' | 'customerId'>): Promise<CustomerContact> => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/customers/${customerId}/contacts`,
      contactData,
      { headers: { Authorization: `Bearer ${token}` }}
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating customer contact:', error);
    throw error;
  }
};

// Set primary contact for a customer
export const setPrimaryContact = async (customerId: string, contactId: string): Promise<void> => {
  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `${API_URL}/customers/${customerId}/contacts/${contactId}/set-primary`,
      {},
      { headers: { Authorization: `Bearer ${token}` }}
    );
  } catch (error) {
    console.error('Error setting primary contact:', error);
    throw error;
  }
};