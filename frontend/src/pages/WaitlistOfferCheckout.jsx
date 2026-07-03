import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function WaitlistOfferCheckout() {
  const { entryId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!user) return navigate("/login");
    api.get(`/waitlist/offer/${entryId}`).then(({ data }) => {
      setOffer(data);
      setLoading(false);
      // Countdown
      const interval = setInterval(() => {
        const left = Math.max(0, new Date(data.entry.offerExpiresAt) - Date.now());
        setCountdown(Math.ceil(left / 1000));
        if (left === 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }).catch(() => {
      toast.error("Offer not found or expired");
      setLoading(false);
    });
  }, [entryId]);

  async function confirm() {
    setConfirming(true);
    try {
      const { data } = await api.post("/bookings/confirm", {
        showId: offer.show._id,
        seatIds: [offer.seat._id],
        waitlistEntryId: entryId,
      });
      toast.success("Booking confirmed!");
      navigate(`/booking-success/${data.booking._id}`, { state: { booking: data.booking, qrCodeDataUrl: data.qrCodeDataUrl } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
      setConfirming(false);
    }
  }

  const fmtTime = s =>
    s !== null ? `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}` : "–";

  if (loading) return <div className="page"><p style={{ color: "var(--muted)" }}>Loading offer…</p></div>;
  if (!offer) return <div className="page"><p style={{ color: "var(--danger)" }}>This offer has expired or is no longer valid.</p></div>;

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <h2 style={{ marginBottom: 8 }}>🎉 Seat Available from Waitlist!</h2>
      <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid var(--warn)", borderRadius: "var(--radius)", padding: 12, marginBottom: 20 }}>
        <p style={{ color: "var(--warn)", fontWeight: 600 }}>⏱ Offer expires in {fmtTime(countdown)}</p>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: 4 }}>If you don't confirm in time, the seat will be offered to the next person on the waitlist.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Offer Details</h3>
        <p><b>Event:</b> {offer.show.event?.title}</p>
        <p><b>Venue:</b> {offer.show.venue?.name}</p>
        <p><b>Date:</b> {new Date(offer.show.date).toLocaleString("en-IN")}</p>
        <p style={{ marginTop: 10 }}><b>Seat:</b> {offer.seat.label} ({offer.seat.category}) — ₹{offer.seat.price}</p>
      </div>

      <button className="btn-primary" style={{ width: "100%", padding: 14, fontSize: "1rem" }} onClick={confirm} disabled={confirming || countdown === 0}>
        {confirming ? "Confirming…" : `Confirm Booking — ₹${offer.seat.price}`}
      </button>
    </div>
  );
}
