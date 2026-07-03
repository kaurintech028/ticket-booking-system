import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function OrganiserDashboard() {
  const [tab, setTab] = useState("shows");
  const [shows, setShows] = useState([]);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // Create Event form
  const [evForm, setEvForm] = useState({ title: "", type: "concert", description: "" });
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Create Show form
  const [showForm, setShowForm] = useState({ eventId: "", venueId: "", date: "", pricing: [] });
  const [creatingShow, setCreatingShow] = useState(false);

  useEffect(() => {
    api.get("/shows/organiser/my-shows").then(({ data }) => setShows(data));
    api.get("/venues").then(({ data }) => setVenues(data));
    api.get("/events").then(({ data }) => setEvents(data));
  }, []);

  async function createEvent(e) {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      const { data } = await api.post("/events", evForm);
      toast.success("Event created!");
      setEvents(prev => [data, ...prev]);
      setEvForm({ title: "", type: "concert", description: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setCreatingEvent(false);
    }
  }

  async function createShow(e) {
    e.preventDefault();
    setCreatingShow(true);
    try {
      // Build pricing array from venue categories
      const venue = venues.find(v => v._id === showForm.venueId);
      const pricing = venue?.seatLayout.map(bl => ({
        category: bl.category,
        price: Number(showForm[`price_${bl.category}`] || 0),
      })) || [];
      await api.post("/shows", { ...showForm, pricing });
      toast.success("Show created with seats!");
      const { data } = await api.get("/shows/organiser/my-shows");
      setShows(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setCreatingShow(false);
    }
  }

  async function fetchRevenue(showId) {
    setLoadingRevenue(true);
    const { data } = await api.get(`/shows/organiser/${showId}/revenue`);
    setRevenue(data);
    setLoadingRevenue(false);
  }

  const selectedVenue = venues.find(v => v._id === showForm.venueId);

  return (
    <div className="page">
      <h1 style={{ marginBottom: 20 }}>Organiser Dashboard</h1>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {["shows", "create-event", "create-show"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={tab === t ? "btn-primary" : "btn-outline"} style={{ textTransform: "capitalize" }}>
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {tab === "shows" && (
        <div>
          <h2 style={{ marginBottom: 16 }}>My Shows</h2>
          {shows.length === 0 && <p style={{ color: "var(--muted)" }}>No shows created yet.</p>}
          {shows.map(s => (
            <div key={s._id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3>{s.event?.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {s.venue?.name} — {new Date(s.date).toLocaleString("en-IN")}
                  </p>
                </div>
                <button className="btn-outline" onClick={() => { fetchRevenue(s._id); setTab("revenue-" + s._id); }}>
                  View Revenue
                </button>
              </div>
              {tab === `revenue-${s._id}` && revenue && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  {loadingRevenue ? <p>Loading…</p> : (
                    <>
                      <p>Bookings: <b>{revenue.bookingsCount}</b></p>
                      <p>Revenue: <b>₹{revenue.totalRevenue}</b></p>
                      <div style={{ marginTop: 8 }}>
                        {revenue.seatStats?.map(s => (
                          <span key={s._id} className="badge badge-available" style={{ marginRight: 8 }}>
                            {s._id}: {s.count}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "create-event" && (
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ marginBottom: 16 }}>Create Event</h2>
          <form onSubmit={createEvent} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group"><label>Title</label>
              <input value={evForm.title} onChange={e => setEvForm({ ...evForm, title: e.target.value })} required />
            </div>
            <div className="form-group"><label>Type</label>
              <select value={evForm.type} onChange={e => setEvForm({ ...evForm, type: e.target.value })}>
                <option value="concert">Concert</option>
                <option value="movie">Movie</option>
              </select>
            </div>
            <div className="form-group"><label>Description</label>
              <textarea value={evForm.description} onChange={e => setEvForm({ ...evForm, description: e.target.value })} rows={3} />
            </div>
            <button className="btn-primary" type="submit" disabled={creatingEvent}>
              {creatingEvent ? "Creating…" : "Create Event"}
            </button>
          </form>
        </div>
      )}

      {tab === "create-show" && (
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ marginBottom: 16 }}>Create Show</h2>
          <form onSubmit={createShow} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group"><label>Event</label>
              <select value={showForm.eventId} onChange={e => setShowForm({ ...showForm, eventId: e.target.value })} required>
                <option value="">-- Select Event --</option>
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Venue</label>
              <select value={showForm.venueId} onChange={e => setShowForm({ ...showForm, venueId: e.target.value })} required>
                <option value="">-- Select Venue --</option>
                {venues.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Date & Time</label>
              <input type="datetime-local" value={showForm.date} onChange={e => setShowForm({ ...showForm, date: e.target.value })} required />
            </div>
            {selectedVenue?.seatLayout.map(bl => (
              <div className="form-group" key={bl.category}>
                <label>Price for {bl.category} (₹)</label>
                <input type="number" min={0} value={showForm[`price_${bl.category}`] || ""} onChange={e => setShowForm({ ...showForm, [`price_${bl.category}`]: e.target.value })} required />
              </div>
            ))}
            <button className="btn-primary" type="submit" disabled={creatingShow}>
              {creatingShow ? "Creating…" : "Create Show & Generate Seats"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
