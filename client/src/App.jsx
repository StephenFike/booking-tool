import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';
import Confirm from './pages/Confirm.jsx';
import Cancel from './pages/Cancel.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminServices from './pages/admin/Services.jsx';
import AdminAvailability from './pages/admin/Availability.jsx';
import AdminBookings from './pages/admin/Bookings.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/book/:serviceId" element={<Booking />} />
        <Route path="/confirm/:token" element={<Confirm />} />
        <Route path="/cancel/:token" element={<Cancel />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="availability" element={<AdminAvailability />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="font-display text-4xl font-medium text-stone-800">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-brand-700 hover:underline">
        ← Back to services
      </Link>
    </div>
  );
}
