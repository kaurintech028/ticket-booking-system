import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import styles from "./SeatMap.module.css";

const STATUS_LABEL = { available: "Available", held: "Held", booked: "Booked" };

export default function SeatMap({ showId, onSelectionChange, currentUserId }) {
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Load initial seat map
  useEffect(() => {
    api.get(`/seats/show/${showId}`).then(({ data }) => {
      setSeats(data);
      setLoading(false);
    });
  }, [showId]);

  // Subscribe to real-time updates via Socket.io
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");
    socketRef.current = socket;
    socket.emit("join-show", showId);

    socket.on("seat:update", ({ seats: updatedSeats }) => {
      setSeats((prev) => {
        const map = new Map(prev.map((s) => [String(s._id), s]));
        updatedSeats.forEach((s) => map.set(String(s._id), s));
        return Array.from(map.values());
      });

      // Deselect any seat that is no longer available (someone else grabbed it)
      setSelected((prev) => {
        const next = new Set(prev);
        updatedSeats.forEach((s) => {
          if (s.status !== "available" && String(s.holdBy) !== currentUserId) {
            next.delete(String(s._id));
          }
        });
        return next;
      });
    });

    return () => {
      socket.emit("leave-show", showId);
      socket.disconnect();
    };
  }, [showId, currentUserId]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(
      seats.filter((s) => selected.has(String(s._id)))
    );
  }, [selected, seats]);

  function toggleSeat(seat) {
    // Can only toggle seats that are available, or already held by current user
    const isAvailable = seat.status === "available";
    const isMyHold =
      seat.status === "held" && String(seat.holdBy) === currentUserId;
    if (!isAvailable && !isMyHold) return;

    setSelected((prev) => {
      const next = new Set(prev);
      const id = String(seat._id);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Group seats by category then by row label
  const grouped = seats.reduce((acc, seat) => {
    acc[seat.category] = acc[seat.category] || {};
    const rowKey = seat.label[0]; // first char is the row letter
    acc[seat.category][rowKey] = acc[seat.category][rowKey] || [];
    acc[seat.category][rowKey].push(seat);
    return acc;
  }, {});

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading seat map…</p>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.screen}>🎬 SCREEN / STAGE</div>

      {Object.entries(grouped).map(([category, rows]) => (
        <div key={category} className={styles.section}>
          <h3 className={styles.categoryLabel}>{category}</h3>
          {Object.entries(rows).map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className={styles.row}>
              <span className={styles.rowLabel}>{rowLabel}</span>
              <div className={styles.seats}>
                {rowSeats
                  .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
                  .map((seat) => {
                    const isSelected = selected.has(String(seat._id));
                    const isMyHold =
                      seat.status === "held" &&
                      String(seat.holdBy) === currentUserId;
                    return (
                      <button
                        key={seat._id}
                        className={[
                          styles.seat,
                          styles[seat.status],
                          isSelected ? styles.selected : "",
                          isMyHold ? styles.myheld : "",
                        ].join(" ")}
                        onClick={() => toggleSeat(seat)}
                        disabled={
                          seat.status === "booked" ||
                          (seat.status === "held" && !isMyHold)
                        }
                        title={`${seat.label} — ${STATUS_LABEL[seat.status]} — ₹${seat.price}`}
                      >
                        {seat.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Legend */}
      <div className={styles.legend}>
        <span className={`${styles.legendDot} ${styles.available}`} /> Available
        <span className={`${styles.legendDot} ${styles.selected}`} /> Selected
        <span className={`${styles.legendDot} ${styles.held}`} /> Held
        <span className={`${styles.legendDot} ${styles.booked}`} /> Booked
      </div>
    </div>
  );
}
