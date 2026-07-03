import { useLocation, useNavigate } from "react-router-dom";

export default function BookingSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { booking, qrCodeDataUrl } = state || {};

  if (!booking) {
    return (
      <div className="page">
        <p>No booking info. <a href="/events">Browse events</a></p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
        <h2>Booking Confirmed!</h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          A QR code ticket has been sent to your email.
        </p>
        <div style={{ margin: "24px auto", maxWidth: 240 }}>
          <img src={qrCodeDataUrl} alt="QR Code" style={{ width: "100%", borderRadius: "var(--radius)", border: "4px solid var(--border)" }} />
        </div>
        <div style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "12px 20px", marginBottom: 20 }}>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>BOOKING REF</p>
          <p style={{ fontWeight: 700, letterSpacing: 2, fontSize: "1.1rem" }}>{booking.bookingRef}</p>
        </div>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          Seats: <b style={{ color: "var(--text)" }}>{booking.seatLabels?.join(", ")}</b>
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: 6 }}>
          Total paid: <b style={{ color: "var(--text)" }}>₹{booking.totalAmount}</b>
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
          <button className="btn-primary" onClick={() => navigate("/my-bookings")}>My Bookings</button>
          <button className="btn-outline" onClick={() => navigate("/events")}>Browse More</button>
        </div>
      </div>
    </div>
  );
}
