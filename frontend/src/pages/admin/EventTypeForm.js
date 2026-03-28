import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { eventTypesAPI, availabilityAPI } from '../../services/api';
import { validateEventTypeForm } from '../../utils/validation';
import clsx from 'clsx';

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', 
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function EventTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    duration: 30,
    color: '#3B82F6',
    scheduleId: '',
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    minimumNotice: 60,
    requiresConfirmation: false,
  });

  useEffect(() => {
    fetchSchedules();
    if (isEditing) {
      fetchEventType();
    }
  }, [id]);

  const fetchSchedules = async () => {
    try {
      const { data } = await availabilityAPI.getSchedules();
      setSchedules(data);
      if (!isEditing && data.length > 0) {
        const defaultSchedule = data.find(s => s.isDefault) || data[0];
        setFormData(prev => ({ ...prev, scheduleId: defaultSchedule.id }));
      }
    } catch (error) {
      console.error('Failed to load schedules');
    }
  };

  const fetchEventType = async () => {
    try {
      const { data } = await eventTypesAPI.getOne(id);
      setFormData({
        title: data.title,
        slug: data.slug,
        description: data.description || '',
        duration: data.duration,
        color: data.color,
        scheduleId: data.scheduleId || '',
        bufferTimeBefore: data.bufferTimeBefore,
        bufferTimeAfter: data.bufferTimeAfter,
        minimumNotice: data.minimumNotice,
        requiresConfirmation: data.requiresConfirmation,
      });
    } catch (error) {
      toast.error('Failed to load event type');
      navigate('/event-types');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: !isEditing ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : prev.slug
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateEventTypeForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        duration: parseInt(formData.duration),
        bufferTimeBefore: parseInt(formData.bufferTimeBefore),
        bufferTimeAfter: parseInt(formData.bufferTimeAfter),
        minimumNotice: parseInt(formData.minimumNotice),
      };

      if (isEditing) {
        await eventTypesAPI.update(id, payload);
        toast.success('Event type updated');
      } else {
        await eventTypesAPI.create(payload);
        toast.success('Event type created');
      }
      navigate('/event-types');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to save event type';
      toast.error(message);
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEditing ? 'Edit Event Type' : 'Create Event Type'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="label">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            onBlur={handleFieldBlur}
            className={clsx(
              "input",
              touchedFields.title && validationErrors.title && "border-red-500 focus:ring-red-500"
            )}
            placeholder="e.g., 30 Minute Meeting"
            required
          />
          {touchedFields.title && validationErrors.title && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {validationErrors.title}
            </div>
          )}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="label">URL Slug</label>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">/demo/</span>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              onBlur={handleFieldBlur}
              className={clsx(
                "input flex-1",
                touchedFields.slug && validationErrors.slug && "border-red-500 focus:ring-red-500"
              )}
              placeholder="30min"
              pattern="[a-z0-9-]+"
              required
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Only lowercase letters, numbers, and hyphens
          </p>
          {touchedFields.slug && validationErrors.slug && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {validationErrors.slug}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleFieldBlur}
            rows={3}
            className={clsx(
              "input",
              touchedFields.description && validationErrors.description && "border-red-500 focus:ring-red-500"
            )}
            placeholder="A brief description of the meeting..."
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-1">
            <div>
              {touchedFields.description && validationErrors.description && (
                <div className="flex items-center text-sm text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {validationErrors.description}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formData.description.length}/500
            </span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="label">Duration</label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            onBlur={handleFieldBlur}
            className={clsx(
              "input",
              touchedFields.duration && validationErrors.duration && "border-red-500 focus:ring-red-500"
            )}
          >
            {DURATIONS.map(d => (
              <option key={d} value={d}>{d} minutes</option>
            ))}
          </select>
          {touchedFields.duration && validationErrors.duration && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {validationErrors.duration}
            </div>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded-full transition-transform ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label htmlFor="scheduleId" className="label">Availability Schedule</label>
          <select
            id="scheduleId"
            name="scheduleId"
            value={formData.scheduleId}
            onChange={handleChange}
            onBlur={handleFieldBlur}
            className={clsx(
              "input",
              touchedFields.scheduleId && validationErrors.scheduleId && "border-red-500 focus:ring-red-500"
            )}
          >
            <option value="">Select a schedule</option>
            {schedules.map(schedule => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.name} {schedule.isDefault && '(Default)'}
              </option>
            ))}
          </select>
          {touchedFields.scheduleId && validationErrors.scheduleId && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
              {validationErrors.scheduleId}
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Advanced Options</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bufferTimeBefore" className="label">Buffer before (minutes)</label>
              <input
                type="number"
                id="bufferTimeBefore"
                name="bufferTimeBefore"
                value={formData.bufferTimeBefore}
                onChange={handleChange}
                onBlur={handleFieldBlur}
                min="0"
                max="60"
                className={clsx(
                  "input",
                  touchedFields.bufferTimeBefore && validationErrors.bufferTimeBefore && "border-red-500 focus:ring-red-500"
                )}
              />
              {touchedFields.bufferTimeBefore && validationErrors.bufferTimeBefore && (
                <div className="mt-1 flex items-center text-xs text-red-600">
                  <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                  {validationErrors.bufferTimeBefore}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="bufferTimeAfter" className="label">Buffer after (minutes)</label>
              <input
                type="number"
                id="bufferTimeAfter"
                name="bufferTimeAfter"
                value={formData.bufferTimeAfter}
                onChange={handleChange}
                onBlur={handleFieldBlur}
                min="0"
                max="60"
                className={clsx(
                  "input",
                  touchedFields.bufferTimeAfter && validationErrors.bufferTimeAfter && "border-red-500 focus:ring-red-500"
                )}
              />
              {touchedFields.bufferTimeAfter && validationErrors.bufferTimeAfter && (
                <div className="mt-1 flex items-center text-xs text-red-600">
                  <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                  {validationErrors.bufferTimeAfter}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="minimumNotice" className="label">Minimum notice (minutes)</label>
            <input
              type="number"
              id="minimumNotice"
              name="minimumNotice"
              value={formData.minimumNotice}
              onChange={handleChange}
              onBlur={handleFieldBlur}
              min="0"
              className={clsx(
                "input",
                touchedFields.minimumNotice && validationErrors.minimumNotice && "border-red-500 focus:ring-red-500"
              )}
            />
            <p className="mt-1 text-sm text-gray-500">
              Minimum time before a meeting can be booked
            </p>
            {touchedFields.minimumNotice && validationErrors.minimumNotice && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {validationErrors.minimumNotice}
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="requiresConfirmation"
                checked={formData.requiresConfirmation}
                onChange={handleChange}
                className="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="ml-2 text-sm text-gray-700">
                Require confirmation before booking
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/event-types')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
