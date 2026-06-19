import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, default: 0 },
  isDrawer: { type: Boolean, default: false },
  socketId: { type: String },
});

const gameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [playerSchema],
  settings: {
    maxPlayers: { type: Number, default: 8 },
    rounds: { type: Number, default: 3 },
    drawTime: { type: Number, default: 80 },
  },
  status: {
    type: String,
    enum: ["waiting", "playing", "finished"],
    default: "waiting",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const GameModel = mongoose.model("Game", gameSchema);
