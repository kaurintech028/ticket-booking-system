import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const STATUS_COLOR = {
  waiting: "badge-held",
  offered: "badge-available",
  fulfilled: "badge-available",
  expired: "badge-booked",
  cancelled: "badge-booked",
};

export default function MyWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchEntries() {
    api.get("/waitlist/my").then(({ data }) => {
      setEntries(data);
      setLoading(false);
    });
  }

  useEffect(() => { fetchEntries(); }, []);

  async function leave(entryId) {
    try {
      await api.delete(`/waitlist/${entryId}`);
      toast.success("Left waitlist");
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  }

  if (loading) return <div className="page"><p style={{ color: "var(--muted)" }}>Loading…</p></div>;

  return (
    <div className="page">
      <h1 style={{ marginBottom: 24 }}>My Waitlist</h1>
      {entries.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>You're not on any waitlists.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {entries.map(e => (
            <div key={e._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span className={`badge ${STATUS_COLOR[e.status] || "badge-held"}`}>{e.status}</span>
                  <h3 style={{ marginTop: 8 }}>{e.show?.event?.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {e.show?.venue?.name} — {new Date(e.show?.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p style={{ marginTop: 6, fontSize: "0.9rem" }}>Category: <b>{e.category}</b></p>
                  {e.status === "offered" && e.offerExpiresAt && (
                    <p style={{ color: "var(--warn)", marginTop: 6, fontSize: "0.85rem" }}>
                      ⏱ Offer expires: {new Date(e.offerExpiresAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {e.status === "offered" && (
                    <a href={`/checkout/offer/${e._id}`}>
                      <button className="btn-primary" style={{ width: "100%" }}>Complete Booking →</button>
                    </a>
                  )}
                  {e.status === "waiting" && (
                    <button className="btn-outline" onClick={() => leave(e._id)}>Leave Queue</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
