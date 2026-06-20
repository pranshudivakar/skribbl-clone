import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { setupSocketHandlers } from "./socketHandler.js";
import connectDB from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ✅ MongoDB Connect
connectDB();

const app = express();
const httpServer = createServer(app);

// ✅ CORS for Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://skribbl-clone-vercel.vercel.app",
      "https://skribbl-clone-vercel-git-main-pranshudivakars-projects.vercel.app",
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ CORS for Express
app.use(
  cors({
    origin: [
      "https://skribbl-clone-vercel.vercel.app",
      "https://skribbl-clone-vercel-git-main-pranshudivakars-projects.vercel.app",
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/room/:roomId", (req, res) => {
  res.json({ message: "Use WebSocket for room info" });
});

// ✅ REMOVE THIS - Frontend Vercel par serve ho raha hai
// if (process.env.NODE_ENV === "production") {
//   const clientPath = path.join(process.cwd(), "client/dist");
//   console.log(`📦 Serving static files from: ${clientPath}`);
//   app.use(express.static(clientPath));
//   app.get("*", (req, res) => {
//     if (req.path.startsWith("/api")) {
//       return res.status(404).json({ error: "API endpoint not found" });
//     }
//     if (req.path.startsWith("/socket.io")) {
//       return res.status(404).json({ error: "WebSocket endpoint" });
//     }
//     res.sendFile(path.join(clientPath, "index.html"));
//   });
// }

// Setup WebSocket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 WebSocket server ready`);
});

export { io };
