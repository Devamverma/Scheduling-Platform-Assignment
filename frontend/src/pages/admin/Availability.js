import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { availabilityAPI } from '../../services/api';
import clsx from 'clsx';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
];

export default function Availability() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleTimezone, setNewScheduleTimezone] = useState('America/New_York');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      console.log('Fetching schedules...');
      const response = await availabilityAPI.getSchedules();
      console.log('Schedules full response:', {
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
      
      setSchedules(data);
      if (data.length > 0) {
        const defaultSchedule = data.find(s => s.isDefault) || data[0];
        setSelectedSchedule(defaultSchedule);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error(error.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newScheduleName.trim()) return;

    try {
      const { data } = await availabilityAPI.createSchedule({
        name: newScheduleName,
        timezone: newScheduleTimezone
      });
      setSchedules(prev => [...prev, data]);
      setSelectedSchedule(data);
      setShowNewSchedule(false);
      setNewScheduleName('');
      toast.success('Schedule created');
    } catch (error) {
      toast.error('Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await availabilityAPI.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      if (selectedSchedule?.id === id) {
        setSelectedSchedule(schedules.find(s => s.id !== id) || null);
      }
      toast.success('Schedule deleted');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete schedule';
      toast.error(message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await availabilityAPI.setDefault(id);
      setSchedules(prev => prev.map(s => ({
        ...s,
        isDefault: s.id === id
      })));
      toast.success('Default schedule updated');
    } catch (error) {
      toast.error('Failed to update default schedule');
    }
  };

  const handleWeeklyHoursChange = (dayOfWeek, field, value) => {
    if (!selectedSchedule) return;

    setSelectedSchedule(prev => ({
      ...prev,
      weeklyHours: prev.weeklyHours.map(wh =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh
      )
    }));
  };

  const handleSaveWeeklyHours = async () => {
    if (!selectedSchedule) return;
    setSaving(true);

    try {
      const { data } = await availabilityAPI.updateWeeklyHours(
        selectedSchedule.id,
        { weeklyHours: selectedSchedule.weeklyHours }
      );
      setSelectedSchedule(data);
      setSchedules(prev => prev.map(s => s.id === data.id ? data : s));
      toast.success('Availability saved');
    } catch (error) {
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const handleTimezoneChange = async (timezone) => {
    if (!selectedSchedule) return;

    try {
      const { data } = await availabilityAPI.updateSchedule(selectedSchedule.id, { timezone });
      setSelectedSchedule(prev => ({ ...prev, timezone }));
      setSchedules(prev => prev.map(s => s.id === data.id ? data : s));
      toast.success('Timezone updated');
    } catch (error) {
      toast.error('Failed to update timezone');
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
          <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set your available hours for bookings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Schedule List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4 border-b">
              <h2 className="font-medium text-gray-900">Schedules</h2>
            </div>
            <div className="p-2">
              {schedules.map(schedule => (
                <button
                  key={schedule.id}
                  onClick={() => setSelectedSchedule(schedule)}
                  className={clsx(
                    "w-full flex items-center justify-between p-3 rounded-md text-left transition-colors",
                    selectedSchedule?.id === schedule.id
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {schedule.name}
                    </span>
                    {schedule.isDefault && (
                      <span className="ml-2 text-xs text-green-600 font-medium">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {showNewSchedule ? (
                <form onSubmit={handleCreateSchedule} className="p-3 space-y-3">
                  <input
                    type="text"
                    value={newScheduleName}
                    onChange={(e) => setNewScheduleName(e.target.value)}
                    placeholder="Schedule name"
                    className="input text-sm"
                    autoFocus
                  />
                  <select
                    value={newScheduleTimezone}
                    onChange={(e) => setNewScheduleTimezone(e.target.value)}
                    className="input text-sm"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <button type="submit" className="btn-primary text-xs py-1">
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewSchedule(false)}
                      className="btn-secondary text-xs py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewSchedule(true)}
                  className="w-full flex items-center p-3 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Schedule
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="lg:col-span-3">
          {selectedSchedule ? (
            <div className="card">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-gray-900">{selectedSchedule.name}</h2>
                  <p className="text-sm text-gray-500">
                    Configure your available hours
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!selectedSchedule.isDefault && (
                    <button
                      onClick={() => handleSetDefault(selectedSchedule.id)}
                      className="btn-secondary text-sm"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 border-b">
                <label className="label">Timezone</label>
                <select
                  value={selectedSchedule.timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="input max-w-xs"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Weekly Hours</h3>
                <div className="space-y-3">
                  {DAYS.map((day, index) => {
                    const hours = selectedSchedule.weeklyHours?.find(wh => wh.dayOfWeek === index);
                    return (
                      <div key={day} className="flex items-center space-x-4">
                        <label className="flex items-center w-32">
                          <input
                            type="checkbox"
                            checked={hours?.isEnabled ?? false}
                            onChange={(e) => handleWeeklyHoursChange(index, 'isEnabled', e.target.checked)}
                            className="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day}</span>
                        </label>
                        {hours?.isEnabled && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={hours.startTime}
                              onChange={(e) => handleWeeklyHoursChange(index, 'startTime', e.target.value)}
                              className="input py-1 text-sm"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              value={hours.endTime}
                              onChange={(e) => handleWeeklyHoursChange(index, 'endTime', e.target.value)}
                              className="input py-1 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <button
                    onClick={handleSaveWeeklyHours}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-gray-500">
                Create a schedule to configure your availability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
