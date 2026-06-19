import mongoose from "mongoose";

const guessSchema = new mongoose.Schema({
  playerId: String,
  name: String,
  guess: String,
  isCorrect: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const gameHistorySchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    round: { type: Number, required: true },
    drawer: {
      playerId: String,
      name: String,
    },
    wordOptions: [{ type: String }],
    selectedWord: { type: String },
    guesses: [guessSchema],
    scores: { type: Map, of: Number },
    roundWinner: String,
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

export const GameHistory = mongoose.model("GameHistory", gameHistorySchema);