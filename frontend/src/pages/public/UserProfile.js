import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { publicAPI } from '../../services/api';

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [username]);

  const fetchUser = async () => {
    try {
      const { data } = await publicAPI.getUserProfile(username);
      setUser(data);
    } catch (err) {
      setError('User not found');
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

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
          <p className="mt-2 text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <UserCircleIcon className="mx-auto h-20 w-20 text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-500">@{user.username}</p>
        </div>

        {/* Event Types */}
        <div className="space-y-4">
          {user.eventTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No event types available
            </div>
          ) : (
            user.eventTypes.map((eventType) => (
              <Link
                key={eventType.id}
                to={`/${username}/${eventType.slug}`}
                className="block card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div
                    className="w-1 h-12 rounded-full mr-4"
                    style={{ backgroundColor: eventType.color }}
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {eventType.title}
                    </h2>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {eventType.duration} min
                    </div>
                    {eventType.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {eventType.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          Powered by Cal Clone
        </div>
      </div>
    </div>
  );
}
