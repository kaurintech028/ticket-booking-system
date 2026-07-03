import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "./Events.module.css";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    api.get(`/events?${params}`).then(({ data }) => {
      setEvents(data);
      setLoading(false);
    });
  }, [search, type]);

  return (
    <div className="page">
      <h1 style={{ marginBottom: 24 }}>Browse Events</h1>
      <div className={styles.filters}>
        <input
          placeholder="Search events…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <select value={type} onChange={e => setType(e.target.value)} style={{ width: 160 }}>
          <option value="">All Types</option>
          <option value="movie">Movie</option>
          <option value="concert">Concert</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : events.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No events found.</p>
      ) : (
        <div className="grid-3" style={{ marginTop: 24 }}>
          {events.map(ev => (
            <div
              key={ev._id}
              className={`card ${styles.eventCard}`}
              onClick={() => navigate(`/events/${ev._id}`)}
            >
              {ev.posterUrl && (
                <img src={ev.posterUrl} alt={ev.title} className={styles.poster} />
              )}
              <div className={styles.info}>
                <span className={`badge ${ev.type === "movie" ? "badge-available" : "badge-held"}`}>
                  {ev.type}
                </span>
                <h3 style={{ marginTop: 10 }}>{ev.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 6 }}>
                  {ev.description?.slice(0, 80)}…
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
