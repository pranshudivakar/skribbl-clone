export class Player {
  constructor(id, name, socketId) {
    console.log("      📥 NEW PLAYER CREATED");
    console.log("      📥 ID:", id);
    console.log("      📥 Name:", name);
    console.log("      📥 Socket ID:", socketId);

    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isDrawer = false;
    this.isReady = false;
    this.isOnline = true;
    this.guesses = [];
    this.lastActive = Date.now();

    console.log("      ✅ Player object created");
    console.log("      📥 Stored socketId:", this.socketId);
  }

  addPoints(points) {
    this.score += points;
    console.log(
      `  📥 Player ${this.name} earned ${points} points. Total: ${this.score}`,
    );
  }

  resetForNewGame() {
    console.log(`  📥 Resetting player ${this.name} for new game`);
    this.score = 0;
    this.isDrawer = false;
    this.isReady = false;
    this.guesses = [];
  }

  toggleReady() {
    this.isReady = !this.isReady;
    console.log(`  📥 Player ${this.name} ready status: ${this.isReady}`);
    return this.isReady;
  }

  updateSocketId(socketId) {
    this.socketId = socketId;
    this.isOnline = true;
    console.log(`  📥 Player ${this.name} socket updated: ${socketId}`);
  }

  setOffline() {
    this.isOnline = false;
    console.log(`  📥 Player ${this.name} is offline`);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      socketId: this.socketId, // ✅ FIX: socketId ko include kiya, taaki client ko bhi pata chale
      score: this.score,
      isDrawer: this.isDrawer,
      isReady: this.isReady,
      isOnline: this.isOnline,
    };
  }
}
