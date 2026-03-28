import { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';

/**
 * Custom hook to access AdminContext
 * Use this in admin panel components for state management
 * 
 * @returns {Object} Admin state and action creators
 * 
 * @example
 * const { eventTypes, bookings, setFilters } = useAdmin();
 */
export function useAdmin() {
  const context = useContext(AdminContext);
  
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  
  return context;
}
