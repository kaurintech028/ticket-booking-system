import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    blocks: [{ category: "Premium", rows: 3, cols: 10 }, { category: "Standard", rows: 5, cols: 15 }],
  });
  const [creating, setCreating] = useState(false);

  function fetchVenues() {
    api.get("/venues").then(({ data }) => setVenues(data));
  }

  useEffect(() => { fetchVenues(); }, []);

  function updateBlock(index, field, value) {
    const updated = form.blocks.map((b, i) =>
      i === index ? { ...b, [field]: value } : b
    );
    setForm({ ...form, blocks: updated });
  }

  function addBlock() {
    setForm({ ...form, blocks: [...form.blocks, { category: "", rows: 2, cols: 10 }] });
  }

  function removeBlock(index) {
    setForm({ ...form, blocks: form.blocks.filter((_, i) => i !== index) });
  }

  async function create(e) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/venues", {
        name: form.name,
        address: form.address,
        seatLayout: form.blocks.map(b => ({
          category: b.category,
          rows: Number(b.rows),
          cols: Number(b.cols),
          rowLabelStart: "A",
        })),
      });
      toast.success("Venue created!");
      fetchVenues();
      setForm({ name: "", address: "", blocks: [{ category: "Premium", rows: 3, cols: 10 }, { category: "Standard", rows: 5, cols: 15 }] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function deleteVenue(id) {
    if (!confirm("Delete this venue?")) return;
    await api.delete(`/venues/${id}`);
    toast.success("Deleted");
    fetchVenues();
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 24 }}>Admin — Venue Management</h1>
      <div className="grid-2" style={{ gap: 30 }}>
        <div>
          <h2 style={{ marginBottom: 16 }}>Create Venue</h2>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group"><label>Venue Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group"><label>Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Seat Blocks / Categories</label>
                <button type="button" className="btn-outline" style={{ padding: "4px 12px", fontSize: "0.8rem" }} onClick={addBlock}>+ Add Block</button>
              </div>
              {form.blocks.map((b, i) => (
                <div key={i} className="card" style={{ marginBottom: 10, padding: 14 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Category</label>
                      <input value={b.category} onChange={e => updateBlock(i, "category", e.target.value)} required placeholder="e.g. Premium" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Rows</label>
                      <input type="number" min={1} value={b.rows} onChange={e => updateBlock(i, "rows", e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Cols</label>
                      <input type="number" min={1} value={b.cols} onChange={e => updateBlock(i, "cols", e.target.value)} />
                    </div>
                  </div>
                  {form.blocks.length > 1 && (
                    <button type="button" className="btn-danger" style={{ marginTop: 8, padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => removeBlock(i)}>Remove</button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn-primary" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create Venue"}
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ marginBottom: 16 }}>Existing Venues</h2>
          {venues.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No venues yet.</p>
          ) : venues.map(v => (
            <div key={v._id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3>{v.name}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{v.address}</p>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {v.seatLayout?.map(bl => (
                      <span key={bl.category} className="badge badge-available">
                        {bl.category}: {bl.rows}×{bl.cols}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="btn-danger" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => deleteVenue(v._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
