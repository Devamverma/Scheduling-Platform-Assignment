import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { BookingProvider } from './context/BookingContext';
import { AdminProvider } from './context/AdminContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import EventTypes from './pages/admin/EventTypes';
import EventTypeForm from './pages/admin/EventTypeForm';
import Availability from './pages/admin/Availability';
import Bookings from './pages/admin/Bookings';
import BookingDetail from './pages/admin/BookingDetail';

// Public Pages
import UserProfile from './pages/public/UserProfile';
import BookingPage from './pages/public/BookingPage';
import BookingConfirmation from './pages/public/BookingConfirmation';
import ManageBooking from './pages/public/ManageBooking';

function App() {
  return (
    <BookingProvider>
      <AdminProvider>
        <Routes>
          {/* Admin Routes */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/event-types" replace />} />
            <Route path="event-types" element={<EventTypes />} />
            <Route path="event-types/new" element={<EventTypeForm />} />
            <Route path="event-types/:id" element={<EventTypeForm />} />
            <Route path="availability" element={<Availability />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
          </Route>

          {/* Public Routes */}
          <Route path="/:username" element={<PublicLayout />}>
            <Route index element={<UserProfile />} />
            <Route path=":eventSlug" element={<BookingPage />} />
          </Route>

          {/* Booking Management */}
          <Route path="/booking/:uid" element={<ManageBooking />} />
          <Route path="/booking/:uid/confirmed" element={<BookingConfirmation />} />
        </Routes>
      </AdminProvider>
    </BookingProvider>
  );
}

export default App;
