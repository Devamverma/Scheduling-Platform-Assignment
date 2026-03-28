import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { publicAPI } from '../../services/api';
import clsx from 'clsx';

export default function ManageBooking() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [uid]);

  useEffect(() => {
    if (selectedDate && booking) {
      fetchSlots();
    }
  }, [selectedDate]);

  const fetchBooking = async () => {
    try {
      const { data } = await publicAPI.getBookingConfirmation(uid);
      setBooking(data);
    } catch (error) {
      toast.error('Booking not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data } = await publicAPI.getSlots(
        booking.eventType.user.username,
        booking.eventType.slug,
        dateStr,
        booking.bookerTimezone
      );
      setSlots(data.slots);
    } catch (error) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await publicAPI.cancelBooking(uid, cancelReason);
      toast.success('Booking cancelled');
      fetchBooking();
      setShowCancel(false);
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setRescheduling(true);
    try {
      await publicAPI.rescheduleBooking(uid, {
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime.time,
        timezone: booking.bookerTimezone
      });
      toast.success('Booking rescheduled');
      setShowReschedule(false);
      fetchBooking();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to reschedule';
      toast.error(message);
    } finally {
      setRescheduling(false);
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

  const isPastBooking = isBefore(parseISO(booking.startTime), new Date());
  const isCancelled = booking.status === 'CANCELLED';

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(calendarDays);

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          {/* Header */}
          <div className={clsx(
            "p-6 border-b",
            isCancelled && "bg-red-50"
          )}>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                {booking.eventType.title}
              </h1>
              {isCancelled && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  Cancelled
                </span>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                <span>With {booking.eventType.user.name}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CalendarDaysIcon className="h-5 w-5 mr-3 text-gray-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-5 w-5 mr-3 text-gray-400" />
                <span>{formattedStartTime} - {formattedEndTime} ({booking.bookerTimezone})</span>
              </div>
            </div>

            {booking.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Your notes:</span> {booking.notes}
                </p>
              </div>
            )}

            {isCancelled && booking.cancellationReason && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">
                  <span className="font-medium">Cancellation reason:</span> {booking.cancellationReason}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isCancelled && !isPastBooking && (
            <div className="p-6 border-t bg-gray-50">
              {!showReschedule && !showCancel && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="btn-secondary flex-1"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setShowCancel(true)}
                    className="btn-danger flex-1"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}

              {/* Cancel Confirmation */}
              {showCancel && (
                <div className="space-y-4">
                  <div className="flex items-center text-amber-600">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">Are you sure you want to cancel?</span>
                  </div>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    rows={2}
                    className="input"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCancel(false)}
                      className="btn-secondary flex-1"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn-danger flex-1"
                    >
                      {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {/* Reschedule Flow */}
              {showReschedule && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Select a new time</h3>
                    <button
                      onClick={() => {
                        setShowReschedule(false);
                        setSelectedDate(null);
                        setSelectedTime(null);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Mini Calendar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} className="py-1 text-gray-500">{day}</div>
                        ))}
                        {paddedDays.map((day, index) => {
                          if (!day) return <div key={`pad-${index}`} />;
                          const isDisabled = isBefore(day, startOfToday());
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          return (
                            <button
                              key={day.toISOString()}
                              onClick={() => !isDisabled && setSelectedDate(day)}
                              disabled={isDisabled}
                              className={clsx(
                                "py-1 rounded text-sm",
                                isSelected && "bg-gray-900 text-white",
                                !isSelected && isToday(day) && "border border-gray-900",
                                !isSelected && !isDisabled && "hover:bg-gray-100",
                                isDisabled && "text-gray-300"
                              )}
                            >
                              {format(day, 'd')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      {selectedDate ? (
                        slotsLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                          </div>
                        ) : slots.length === 0 ? (
                          <p className="text-gray-500 text-center py-8 text-sm">
                            No available times
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                            {slots.map((slot) => (
                              <button
                                key={slot.time}
                                onClick={() => setSelectedTime(slot)}
                                className={clsx(
                                  "px-2 py-1 text-xs border rounded transition-colors",
                                  selectedTime?.time === slot.time
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-200 hover:border-gray-400"
                                )}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )
                      ) : (
                        <p className="text-gray-500 text-center py-8 text-sm">
                          Select a date
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedDate && selectedTime && (
                    <button
                      onClick={handleReschedule}
                      disabled={rescheduling}
                      className="w-full btn-primary"
                    >
                      {rescheduling ? 'Rescheduling...' : 'Confirm New Time'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
