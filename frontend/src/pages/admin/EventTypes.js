import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  ClockIcon, 
  LinkIcon, 
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { eventTypesAPI } from '../../services/api';
import clsx from 'clsx';

export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      console.log('Fetching event types...');
      const response = await eventTypesAPI.getAll();
      console.log('Event types full response:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        fullData: response.data
      });
      
      let data = response.data;
      console.log('Response.data after API call:', data, 'Type:', Array.isArray(data) ? 'Array' : typeof data);
      
      // Check if data is still wrapped (shouldn't be after interceptor)
      if (data && typeof data === 'object' && data.success !== undefined && data.data) {
        console.warn('Data still has success flag - interceptor may not be working');
        data = data.data;
      }
      
      console.log('Final extracted data:', data, 'Type:', Array.isArray(data) ? 'Array' : typeof data);
      
      if (!Array.isArray(data)) {
        console.warn('Data is not an array, data received:', data);
        throw new Error('Invalid data format - expected array');
      }
      
      setEventTypes(data);
      console.log('Event types set successfully, count:', data.length);
    } catch (error) {
      console.error('Error fetching event types:', error);
      toast.error(error.message || 'Failed to load event types');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await eventTypesAPI.toggle(id);
      setEventTypes(prev => prev.map(et => et.id === id ? data : et));
      toast.success(data.isActive ? 'Event type enabled' : 'Event type disabled');
    } catch (error) {
      toast.error('Failed to update event type');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event type?')) return;
    
    try {
      await eventTypesAPI.delete(id);
      setEventTypes(prev => prev.filter(et => et.id !== id));
      toast.success('Event type deleted');
    } catch (error) {
      toast.error('Failed to delete event type');
    }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/demo/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
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
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create events to share for people to book on your calendar.
          </p>
        </div>
        <Link to="/event-types/new" className="btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          New Event Type
        </Link>
      </div>

      {eventTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No event types</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new event type.
          </p>
          <div className="mt-6">
            <Link to="/event-types/new" className="btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Event Type
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className={clsx(
                "card p-6 transition-opacity",
                !eventType.isActive && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div
                    className="w-1 h-16 rounded-full mr-4"
                    style={{ backgroundColor: eventType.color }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {eventType.title}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {eventType.duration} min
                    </div>
                    {eventType.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {eventType.description}
                      </p>
                    )}
                    <div className="flex items-center mt-3 text-sm text-gray-500">
                      <LinkIcon className="h-4 w-4 mr-1" />
                      /demo/{eventType.slug}
                      <button
                        onClick={() => copyLink(eventType.slug)}
                        className="ml-2 p-1 hover:bg-gray-100 rounded"
                        title="Copy link"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggle(eventType.id)}
                    className={clsx(
                      "p-2 rounded-md transition-colors",
                      eventType.isActive 
                        ? "text-gray-500 hover:bg-gray-100" 
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                    title={eventType.isActive ? "Disable" : "Enable"}
                  >
                    {eventType.isActive ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5" />
                    )}
                  </button>
                  <Link
                    to={`/event-types/${eventType.id}`}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(eventType.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Public Link Preview */}
      {eventTypes.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Your public page:</span>{' '}
            <a 
              href="/demo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {window.location.origin}/demo
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
