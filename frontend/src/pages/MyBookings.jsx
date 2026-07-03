import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  function fetchBookings() {
    api.get("/bookings/my").then(({ data }) => {
      setBookings(data);
      setLoading(false);
    });
  }

  useEffect(() => { fetchBookings(); }, []);

  async function cancel(bookingId) {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled.");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return <div className="page"><p style={{ color: "var(--muted)" }}>Loading…</p></div>;

  return (
    <div className="page">
      <h1 style={{ marginBottom: 24 }}>My Bookings</h1>
      {bookings.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No bookings yet. <a href="/events">Browse events</a></p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bookings.map(b => (
            <div key={b._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <span className={`badge ${b.status === "confirmed" ? "badge-available" : "badge-booked"}`}>
                    {b.status}
                  </span>
                  <h3 style={{ marginTop: 8 }}>{b.show?.event?.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {b.show?.venue?.name} — {new Date(b.show?.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p style={{ marginTop: 8 }}>
                    Seats: <b>{b.seatLabels?.join(", ")}</b>
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    Ref: {b.bookingRef} · ₹{b.totalAmount}
                  </p>
                </div>
                {b.qrCodeDataUrl && (
                  <img src={b.qrCodeDataUrl} alt="QR"
                    style={{ width: 80, height: 80, borderRadius: 8, border: "1px solid var(--border)" }} />
                )}
              </div>
              {b.status === "confirmed" && (
                <button
                  className="btn-danger"
                  style={{ marginTop: 14 }}
                  disabled={cancelling === b._id}
                  onClick={() => cancel(b._id)}
                >
                  {cancelling === b._id ? "Cancelling…" : "Cancel Booking"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
