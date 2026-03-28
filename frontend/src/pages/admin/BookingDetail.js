import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { 
  ArrowLeftIcon,
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon,
  EnvelopeIcon,
  GlobeAltIcon
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

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const { data } = await bookingsAPI.getOne(id);
      setBooking(data);
    } catch (error) {
      toast.error('Failed to load booking');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Cancellation reason (optional):');
    if (reason === null) return;

    try {
      await bookingsAPI.cancel(id, reason);
      fetchBooking();
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleConfirm = async () => {
    try {
      await bookingsAPI.confirm(id);
      fetchBooking();
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

  if (!booking) return null;

  return (
    <div className="max-w-3xl">
      <Link
        to="/bookings"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Bookings
      </Link>

      <div className="card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-2 h-12 rounded-full mr-4"
                style={{ backgroundColor: booking.eventType?.color || '#3B82F6' }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{booking.title}</h1>
                <span className={clsx(
                  "inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full",
                  STATUS_STYLES[booking.status]
                )}>
                  {booking.status}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {booking.status === 'PENDING' && (
                <button onClick={handleConfirm} className="btn-primary">
                  Confirm
                </button>
              )}
              {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                <button onClick={handleCancel} className="btn-danger">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Date & Time</h2>
            <div className="space-y-2">
              <div className="flex items-center text-gray-900">
                <CalendarDaysIcon className="h-5 w-5 mr-3 text-gray-400" />
                {format(parseISO(booking.startTime), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="flex items-center text-gray-900">
                <ClockIcon className="h-5 w-5 mr-3 text-gray-400" />
                {format(parseISO(booking.startTime), 'h:mm a')} - {' '}
                {format(parseISO(booking.endTime), 'h:mm a')}
              </div>
            </div>
          </div>

          {/* Attendee */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Attendee</h2>
            <div className="space-y-2">
              <div className="flex items-center text-gray-900">
                <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                {booking.bookerName}
              </div>
              <div className="flex items-center text-gray-900">
                <EnvelopeIcon className="h-5 w-5 mr-3 text-gray-400" />
                <a href={`mailto:${booking.bookerEmail}`} className="text-blue-600 hover:underline">
                  {booking.bookerEmail}
                </a>
              </div>
              <div className="flex items-center text-gray-900">
                <GlobeAltIcon className="h-5 w-5 mr-3 text-gray-400" />
                {booking.bookerTimezone}
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Notes</h2>
              <p className="text-gray-900">{booking.notes}</p>
            </div>
          )}

          {/* Custom Responses */}
          {booking.responses?.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h2>
              <div className="space-y-3">
                {booking.responses.map((response) => (
                  <div key={response.id}>
                    <p className="text-sm font-medium text-gray-700">
                      {response.question.question}
                    </p>
                    <p className="text-gray-900">{response.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          {booking.cancellationReason && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Cancellation Reason</h2>
              <p className="text-gray-900">{booking.cancellationReason}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-sm text-gray-500">
            <p>Booking ID: {booking.uid}</p>
            <p>Created: {format(parseISO(booking.createdAt), 'PPP p')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
