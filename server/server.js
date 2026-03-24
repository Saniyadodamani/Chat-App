import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

dotenv.config();

/* ---------------- APP & SERVER ---------------- */
const app = express();
const server = http.createServer(app);

/* ---------------- SOCKET.IO ---------------- */
export const io = new Server(server, {
  cors: {
    origin: ["https://chat-app-olive-kappa.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Typing indicator
  socket.on("typing", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { from: userId });
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { from: userId });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors({
  origin: ["https://chat-app-olive-kappa.vercel.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));

/* ---------------- TEST ROUTE ---------------- */
app.get("/api/status", (req, res) => {
  res.send("Server is live");
});

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

/* ---------------- DATABASE ---------------- */
await connectDB();

/* ---------------- START SERVER (RENDER NEEDS THIS) ---------------- */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});