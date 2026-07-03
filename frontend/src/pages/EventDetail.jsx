import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`).then(({ data }) => {
      setData(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="page"><p style={{ color: "var(--muted)" }}>Loading…</p></div>;
  if (!data) return <div className="page"><p>Event not found.</p></div>;

  const { event, shows } = data;

  return (
    <div className="page">
      <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginBottom: 32 }}>
        {event.posterUrl && (
          <img src={event.posterUrl} alt={event.title}
            style={{ width: 200, height: 280, objectFit: "cover", borderRadius: "var(--radius)" }} />
        )}
        <div style={{ flex: 1 }}>
          <span className={`badge ${event.type === "movie" ? "badge-available" : "badge-held"}`}>
            {event.type}
          </span>
          <h1 style={{ marginTop: 10 }}>{event.title}</h1>
          <p style={{ color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>{event.description}</p>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>Available Shows</h2>
      {shows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No shows scheduled yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shows.map(show => (
            <div key={show._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontWeight: 600 }}>{show.venue?.name}</p>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{show.venue?.address}</p>
                <p style={{ marginTop: 6 }}>
                  {new Date(show.date).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
                </p>
                <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {show.pricing?.map(p => (
                    <span key={p.category} className="badge badge-available">
                      {p.category}: ₹{p.price}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn-primary" onClick={() => navigate(`/shows/${show._id}/seats`)}>
                Select Seats →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
