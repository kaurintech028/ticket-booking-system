import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import WaitlistOfferCheckout from "./pages/WaitlistOfferCheckout";
import BookingSuccess from "./pages/BookingSuccess";
import MyBookings from "./pages/MyBookings";
import MyWaitlist from "./pages/MyWaitlist";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/events" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Toaster position="top-right" toastOptions={{ style: { background: "#1a1d27", color: "#e4e4f0", border: "1px solid #2a2d3e" } }} />
        <Routes>
          <Route path="/" element={<Navigate to="/events" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/shows/:showId/seats" element={<SeatSelection />} />
          <Route path="/checkout/:showId" element={<Protected><Checkout /></Protected>} />
          <Route path="/checkout/offer/:entryId" element={<Protected><WaitlistOfferCheckout /></Protected>} />
          <Route path="/booking-success/:id" element={<Protected><BookingSuccess /></Protected>} />
          <Route path="/my-bookings" element={<Protected><MyBookings /></Protected>} />
          <Route path="/my-waitlist" element={<Protected><MyWaitlist /></Protected>} />
          <Route path="/organiser" element={<Protected roles={["organiser"]}><OrganiserDashboard /></Protected>} />
          <Route path="/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
