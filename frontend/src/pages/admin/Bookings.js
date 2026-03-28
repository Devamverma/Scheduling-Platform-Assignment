import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon,
  XMarkIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../../services/api';
import clsx from 'clsx';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  RESCHEDULED: 'bg-blue-100 text-blue-800',
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('Fetching bookings with filter:', filter);
      const params = {};
      if (filter === 'upcoming') params.upcoming = 'true';
      if (filter === 'past') params.past = 'true';
      
      const response = await bookingsAPI.getAll(params);
      console.log('Bookings full response:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        fullData: response.data
      });
      
      let data = response.data;
      console.log('Response.data after API call:', data, 'Type:', Array.isArray(data) ? 'Array' : typeof data);
      
      // Check if data is still wrapped
      if (data && typeof data === 'object' && data.success !== undefined && data.data) {
        console.warn('Data still has success flag - interceptor may not be working');
        data = data.data;
      }
      
      console.log('Final extracted data:', data, 'Type:', Array.isArray(data) ? 'Array' : typeof data);
      
      if (!Array.isArray(data)) {
        console.warn('Data is not an array, data received:', data);
        throw new Error('Invalid data format - expected array');
      }
      
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Cancellation reason (optional):');
    if (reason === null) return;

    try {
      await bookingsAPI.cancel(id, reason);
      fetchBookings();
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleConfirm = async (id) => {
    try {
      await bookingsAPI.confirm(id);
      fetchBookings();
      toast.success('Booking confirmed');
    } catch (error) {
      toast.error('Failed to confirm booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your scheduled meetings.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['upcoming', 'past', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No bookings</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'upcoming' 
              ? "You don't have any upcoming bookings."
              : filter === 'past'
              ? "You don't have any past bookings."
              : "You don't have any bookings yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div
                    className="w-1 h-20 rounded-full mr-4"
                    style={{ backgroundColor: booking.eventType?.color || '#3B82F6' }}
                  />
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.title}
                      </h3>
                      <span className={clsx(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        STATUS_STYLES[booking.status]
                      )}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        {format(parseISO(booking.startTime), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {format(parseISO(booking.startTime), 'h:mm a')} - {' '}
                        {format(parseISO(booking.endTime), 'h:mm a')}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <UserIcon className="h-4 w-4 mr-2" />
                        {booking.bookerName} ({booking.bookerEmail})
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => handleConfirm(booking.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Confirm"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  )}
                  {['PENDING', 'CONFIRMED'].includes(booking.status) && !isPast(parseISO(booking.startTime)) && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Cancel"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                  <Link
                    to={`/bookings/${booking.id}`}
                    className="btn-secondary text-sm"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
