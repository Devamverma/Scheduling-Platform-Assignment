import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  CheckCircleIcon, 
  CalendarDaysIcon, 
  ClockIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';

export default function BookingConfirmation() {
  const { uid } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [uid]);

  const fetchBooking = async () => {
    try {
      const { data } = await publicAPI.getBookingConfirmation(uid);
      setBooking(data);
    } catch (error) {
      console.error('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Booking not found</h1>
          <p className="mt-2 text-gray-600">This booking doesn't exist or has been cancelled.</p>
        </div>
      </div>
    );
  }

  const formattedDate = formatInTimeZone(
    parseISO(booking.startTime),
    booking.bookerTimezone,
    'EEEE, MMMM d, yyyy'
  );
  const formattedStartTime = formatInTimeZone(
    parseISO(booking.startTime),
    booking.bookerTimezone,
    'h:mm a'
  );
  const formattedEndTime = formatInTimeZone(
    parseISO(booking.endTime),
    booking.bookerTimezone,
    'h:mm a'
  );

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-lg mx-auto">
        <div className="card p-8 text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {booking.status === 'CONFIRMED' ? 'Booking Confirmed!' : 'Booking Submitted'}
          </h1>
          
          <p className="mt-2 text-gray-600">
            {booking.status === 'CONFIRMED' 
              ? 'A calendar invitation has been sent to your email.'
              : 'Your booking is pending confirmation.'}
          </p>

          <div className="mt-8 text-left bg-gray-50 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">{booking.eventType.title}</h2>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                {booking.eventType.user.name}
              </div>
              <div className="flex items-center text-gray-600">
                <CalendarDaysIcon className="h-5 w-5 mr-3 text-gray-400" />
                {formattedDate}
              </div>
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-3 text-gray-400" />
                {formattedStartTime} - {formattedEndTime}
              </div>
              <div className="flex items-center text-gray-600">
                <GlobeAltIcon className="h-5 w-5 mr-3 text-gray-400" />
                {booking.bookerTimezone}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Link
              to={`/booking/${booking.uid}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Manage booking (reschedule or cancel)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
