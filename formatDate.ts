// src/utils/formatDate.ts

export const formatDate = (dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateString) return 'N/A';
  
    try {
      // Basic check for common invalid date strings that Date.parse might accept or new Date() might misinterpret
      if (typeof dateString === 'string') {
        const lowerDateString = dateString.toLowerCase();
        if (lowerDateString === 'invalid date' || lowerDateString === 'nan') {
          console.warn('formatDate received explicitly invalid date string:', dateString);
          return 'Invalid Date';
        }
      }
      
      const date = new Date(dateString);
  
      // Check if the date object is valid
      if (isNaN(date.getTime())) {
        console.warn('formatDate could not parse date string:', dateString, 'Resulting date object:', date);
        return 'Invalid Date';
      }
  
      const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        // hour: '2-digit', // Optionally add time
        // minute: '2-digit',
        // hour12: true 
      };
  
      return date.toLocaleDateString('en-GB', { ...defaultOptions, ...options });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return String(dateString); // Fallback to original string on error
    }
  };