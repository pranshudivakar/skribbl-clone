import { Game } from "./Game.js";
import { v4 as uuidv4 } from "uuid";

export class Room {
  constructor(hostId, settings) {
    this.id = uuidv4().substring(0, 6).toUpperCase();
    this.hostId = hostId;
    this.settings = settings;
    this.game = new Game(settings);
    this.isPrivate = settings.isPrivate || false;
    this.createdAt = Date.now();
    this.status = "waiting"; 
  }
  


  addPlayer(id, name, socketId) {
    console.log("  📥 Room.addPlayer called");
    console.log("  📥 ID:", id, "Name:", name);
    console.log("  📥 SocketId:", socketId); // ✅ Check socketId
    console.log("  📥 Current players before:", this.game.players.length);

    const player = this.game.addPlayer(id, name, socketId);

    console.log("  📥 After game.addPlayer");
    console.log("  📥 Player socketId:", player.socketId); // ✅ Check player.socketId
    console.log("  📥 Total players now:", this.game.players.length);

    if (this.game.players.length === 1) {
      this.hostId = id;
      console.log("  👑 Host set to:", id);
    }
    return player;
  }

  removePlayer(playerId) {
    const player = this.game.removePlayer(playerId);
    if (playerId === this.hostId && this.game.players.length > 0) {
      this.hostId = this.game.players[0].id;
    }
    return player;
  }

  startGame() {
    console.log("🚀 Room.startGame called");
    this.status = "playing";
    const result = this.game.startGame();
    console.log("✅ Room.startGame result:", result);
    return result;
  }

  getRoomInfo() {
    return {
      id: this.id,
      hostId: this.hostId,
      settings: this.settings,
      isPrivate: this.isPrivate,
      status: this.status,
      players: this.game.players.map((p) => p.toJSON()),
      gameState: this.game.getGameState(),
    };
  }

  toJSON() {
    return {
      id: this.id,
      hostId: this.hostId,
      settings: this.settings,
      isPrivate: this.isPrivate,
      status: this.status,
      playerCount: this.game.players.length,
      maxPlayers: this.settings.maxPlayers,
    };
  }
}