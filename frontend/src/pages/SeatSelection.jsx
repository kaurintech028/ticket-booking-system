import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import SeatMap from "../components/SeatMap";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const HOLD_TTL_SECONDS = (Number(import.meta.env.VITE_HOLD_TTL_MINUTES) || 10) * 60;

export default function SeatSelection() {
  const { showId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [heldSeats, setHeldSeats] = useState([]);
  const [holdExpiry, setHoldExpiry] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/shows/${showId}`).then(({ data }) => setShow(data));
  }, [showId]);

  // Countdown timer for held seats
  useEffect(() => {
    if (!holdExpiry) return;
    timerRef.current = setInterval(() => {
      const left = Math.max(0, holdExpiry - Date.now());
      setCountdown(Math.ceil(left / 1000));
      if (left === 0) {
        clearInterval(timerRef.current);
        toast.error("Your seat hold expired! Please re-select.");
        setHeldSeats([]);
        setHoldExpiry(null);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [holdExpiry]);

  async function holdSelected() {
    if (!user) return navigate("/login");
    if (!selectedSeats.length) return toast.error("Select at least one seat");
    setHolding(true);
    try {
      const { data } = await api.post("/seats/hold", {
        showId,
        seatIds: selectedSeats.map(s => s._id),
      });
      setHeldSeats(data.seats);
      setHoldExpiry(new Date(data.holdExpiresAt).getTime());
      toast.success(`${data.seats.length} seat(s) held for ${HOLD_TTL_SECONDS / 60} minutes!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not hold seats");
    } finally {
      setHolding(false);
    }
  }

  async function releaseHeld() {
    await api.post("/seats/release", {
      showId,
      seatIds: heldSeats.map(s => s._id),
    });
    setHeldSeats([]);
    setHoldExpiry(null);
    clearInterval(timerRef.current);
    toast("Seats released.");
  }

  const totalAmount = heldSeats.reduce((sum, s) => sum + s.price, 0);

  const fmtTime = (s) =>
    s !== null ? `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}` : null;

  return (
    <div className="page">
      {show && (
        <div style={{ marginBottom: 24 }}>
          <h2>{show.event?.title}</h2>
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            {show.venue?.name} — {new Date(show.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 30, alignItems: "start" }}>
        <div>
          <SeatMap
            showId={showId}
            currentUserId={user?._id || user?.id}
            onSelectionChange={setSelectedSeats}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Your Selection</h3>
            {selectedSeats.length === 0 && heldSeats.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Click seats on the map</p>
            )}
            {selectedSeats.length > 0 && heldSeats.length === 0 && (
              <>
                {selectedSeats.map(s => (
                  <div key={s._id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}>
                    <span>{s.label} <span style={{ color: "var(--muted)" }}>({s.category})</span></span>
                    <span>₹{s.price}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontWeight: 700, fontSize: "1.1rem" }}>
                  Total: ₹{selectedSeats.reduce((sum, s) => sum + s.price, 0)}
                </div>
                <button className="btn-primary" style={{ marginTop: 14, width: "100%" }} onClick={holdSelected} disabled={holding}>
                  {holding ? "Holding…" : "Hold Seats"}
                </button>
              </>
            )}

            {heldSeats.length > 0 && (
              <>
                <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid var(--warn)", borderRadius: "var(--radius)", padding: 10, marginBottom: 12 }}>
                  <p style={{ color: "var(--warn)", fontWeight: 600, fontSize: "0.9rem" }}>
                    ⏱ Hold expires in {fmtTime(countdown)}
                  </p>
                </div>
                {heldSeats.map(s => (
                  <div key={s._id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}>
                    <span>{s.label} <span style={{ color: "var(--muted)" }}>({s.category})</span></span>
                    <span>₹{s.price}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontWeight: 700, fontSize: "1.1rem" }}>Total: ₹{totalAmount}</div>
                <button className="btn-primary" style={{ marginTop: 14, width: "100%" }}
                  onClick={() => navigate(`/checkout/${showId}`, { state: { heldSeats, totalAmount } })}>
                  Proceed to Checkout →
                </button>
                <button className="btn-outline" style={{ marginTop: 8, width: "100%" }} onClick={releaseHeld}>
                  Release Seats
                </button>
              </>
            )}
          </div>

          {show?.pricing && (
            <div className="card">
              <h3 style={{ marginBottom: 10, fontSize: "0.9rem" }}>Pricing</h3>
              {show.pricing.map(p => (
                <div key={p.category} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  <span>{p.category}</span><span style={{ color: "var(--text)" }}>₹{p.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
