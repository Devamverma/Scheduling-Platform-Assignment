import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';

/**
 * Custom hook to access BookingContext
 * Use this in any component that needs access to booking state
 * 
 * @returns {Object} Booking state and action creators
 * 
 * @example
 * const { selectedDate, setSelectedDate, slots } = useBooking();
 */
export function useBooking() {
  const context = useContext(BookingContext);
  
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  
  return context;
}
