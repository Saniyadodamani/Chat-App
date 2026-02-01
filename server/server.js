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
    origin: "*",
    methods: ["GET", "POST"]
  }
});

export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json({ limit: "4mb" }));

/* ---------------- TEST ROUTE ---------------- */
app.get("/api/status", (req, res) => {
  res.send("Server is live");
});

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

/* ---------------- DATABASE ---------------- */
connectDB();

/* ---------------- START SERVER (RENDER NEEDS THIS) ---------------- */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});