import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "*" },
  });

  io.on("connection", (socket) => {
    // Clients join a room per show to only receive relevant updates
    socket.on("join-show", (showId) => {
      socket.join(`show:${showId}`);
    });
    socket.on("leave-show", (showId) => {
      socket.leave(`show:${showId}`);
    });
  });

  return io;
}

// Call this from anywhere a seat's status changes (hold/release/book)
export function emitSeatUpdate(showId, seats) {
  if (!io) return;
  io.to(`show:${showId}`).emit("seat:update", { showId, seats });
}

export function getIO() {
  return io;
}
