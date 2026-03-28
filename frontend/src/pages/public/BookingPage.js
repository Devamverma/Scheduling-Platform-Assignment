import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfToday
} from 'date-fns';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  GlobeAltIcon,
  UserCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { publicAPI } from '../../services/api';
import { useBooking } from '../../hooks/useBooking';
import { validateBookingForm } from '../../utils/validation';
import clsx from 'clsx';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export default function BookingPage() {
  const { username, eventSlug } = useParams();
  const navigate = useNavigate();
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  
  // Use BookingContext for state management
  const {
    eventType,
    loading,
    currentMonth,
    selectedDate,
    selectedTime,
    slots,
    slotsLoading,
    timezone,
    showForm,
    formData,
    submitting,
    setEventType,
    setLoading,
    setCurrentMonth,
    setSelectedDate,
    setSelectedTime,
    setSlots,
    setSlotsLoading,
    setTimezone,
    setShowForm,
    setFormData,
    setSubmitting,
  } = useBooking();

  useEffect(() => {
    fetchEventType();
  }, [username, eventSlug]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, timezone]);

  const fetchEventType = async () => {
    try {
      const { data } = await publicAPI.getEventType(username, eventSlug);
      setEventType(data);
    } catch (error) {
      toast.error('Event type not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data } = await publicAPI.getSlots(username, eventSlug, dateStr, timezone);
      setSlots(data.slots);
    } catch (error) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setShowForm(false);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setShowForm(true);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
    
    // Clear error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFieldBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateBookingForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await publicAPI.createBooking(username, eventSlug, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime.time,
        timezone,
        notes: formData.notes.trim()
      });

      navigate(`/booking/${data.uid}/confirmed`);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create booking';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(calendarDays);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Event not found</h1>
          <p className="mt-2 text-gray-600">This event type doesn't exist.</p>
          <Link to={`/${username}`} className="mt-4 inline-block text-blue-600 hover:underline">
            View all events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-3">
            {/* Left Panel - Event Info */}
            <div className="p-6 border-b md:border-b-0 md:border-r bg-gray-50">
              <Link
                to={`/${username}`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Link>

              <div className="flex items-center mb-4">
                <UserCircleIcon className="h-12 w-12 text-gray-400" />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{eventType.user.name}</p>
                </div>
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {eventType.title}
              </h1>

              <div className="flex items-center text-gray-500 mb-2">
                <ClockIcon className="h-4 w-4 mr-2" />
                {eventType.duration} min
              </div>

              {eventType.description && (
                <p className="text-sm text-gray-600 mt-4">
                  {eventType.description}
                </p>
              )}

              {/* Timezone Selector */}
              <div className="mt-6">
                <label className="flex items-center text-sm text-gray-500">
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 p-0 pr-6"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Middle Panel - Calendar */}
            <div className="p-6 border-b md:border-b-0 md:border-r">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                    disabled={isBefore(subMonths(currentMonth, 1), startOfToday())}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="py-2 text-gray-500 font-medium">
                    {day}
                  </div>
                ))}
                {paddedDays.map((day, index) => {
                  if (!day) {
                    return <div key={`pad-${index}`} />;
                  }

                  const isDisabled = isBefore(day, startOfToday());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      className={clsx(
                        "py-2 rounded-full text-sm transition-colors",
                        isSelected && "bg-gray-900 text-white",
                        !isSelected && isTodayDate && "border border-gray-900",
                        !isSelected && !isDisabled && "hover:bg-gray-100",
                        isDisabled && "text-gray-300 cursor-not-allowed"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Time Slots / Form */}
            <div className="p-6">
              {!selectedDate ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a date to see available times
                </div>
              ) : showForm && selectedTime ? (
                /* Booking Form */
                <div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to times
                  </button>

                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">{selectedTime.time}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="label">Your Name *</label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFieldChange}
                        onBlur={handleFieldBlur}
                        className={clsx(
                          "input",
                          touchedFields.name && validationErrors.name && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="e.g., John Doe"
                        required
                      />
                      {touchedFields.name && validationErrors.name && (
                        <div className="mt-1 flex items-center text-sm text-red-600">
                          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                          {validationErrors.name}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="label">Email Address *</label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFieldChange}
                        onBlur={handleFieldBlur}
                        className={clsx(
                          "input",
                          touchedFields.email && validationErrors.email && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="e.g., john@example.com"
                        required
                      />
                      {touchedFields.email && validationErrors.email && (
                        <div className="mt-1 flex items-center text-sm text-red-600">
                          <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                          {validationErrors.email}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="notes" className="label">Additional Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleFieldChange}
                        onBlur={handleFieldBlur}
                        rows={3}
                        className={clsx(
                          "input",
                          touchedFields.notes && validationErrors.notes && "border-red-500 focus:ring-red-500"
                        )}
                        placeholder="Share anything that will help prepare for our meeting..."
                        maxLength={1000}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <div>
                          {touchedFields.notes && validationErrors.notes && (
                            <div className="flex items-center text-sm text-red-600">
                              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                              {validationErrors.notes}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formData.notes.length}/1000
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-primary"
                    >
                      {submitting ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                  </form>
                </div>
              ) : (
                /* Time Slots */
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </h3>

                  {slotsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No available times on this day
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => handleTimeSelect(slot)}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:border-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
