import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';
import Confirm from './pages/Confirm.jsx';
import Cancel from './pages/Cancel.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:serviceId" element={<Booking />} />
        <Route path="/confirm/:token" element={<Confirm />} />
        <Route path="/cancel/:token" element={<Cancel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
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
