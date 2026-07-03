import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Standard checkout after seat hold
export default function Checkout() {
  const { showId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const heldSeats = state?.heldSeats || [];
  const totalAmount = state?.totalAmount || 0;
  const waitlistEntryId = state?.waitlistEntryId || null;

  async function confirm() {
    setLoading(true);
    try {
      const { data } = await api.post("/bookings/confirm", {
        showId,
        seatIds: heldSeats.map(s => s._id),
        waitlistEntryId,
      });
      toast.success("Booking confirmed! Check your email for the QR ticket.");
      navigate(`/booking-success/${data.booking._id}`, { state: { booking: data.booking, qrCodeDataUrl: data.qrCodeDataUrl } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
      setLoading(false);
    }
  }

  if (!heldSeats.length) {
    return (
      <div className="page">
        <p style={{ color: "var(--muted)" }}>No seats held. <a href="/events">Browse events</a></p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 540 }}>
      <h2 style={{ marginBottom: 24 }}>Confirm Booking</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Seats</h3>
        {heldSeats.map(s => (
          <div key={s._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <span>{s.label} <span style={{ color: "var(--muted)" }}>({s.category})</span></span>
            <span>₹{s.price}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, fontWeight: 700, fontSize: "1.2rem", display: "flex", justifyContent: "space-between" }}>
          <span>Total</span><span>₹{totalAmount}</span>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 10 }}>Booking For</h3>
        <p>{user?.name}</p>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{user?.email}</p>
      </div>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 16 }}>
        A QR code ticket will be emailed to {user?.email} upon confirmation.
      </p>
      <button className="btn-primary" style={{ width: "100%", padding: 14, fontSize: "1rem" }} onClick={confirm} disabled={loading}>
        {loading ? "Confirming…" : "Confirm & Pay ₹" + totalAmount}
      </button>
    </div>
  );
}
