import { Player } from "./Player.js";
import { getRandomWords } from "../utils/wordList.js";

export class Game {
  constructor(settings) {
    console.log("📥 Creating new Game instance with settings:", settings);

    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 3,
      wordMode: settings.wordMode || "normal",
      language: settings.language || "en",
    };

    this.players = [];
    this.roomId = null;
    this.currentRound = 0;
    this.currentDrawer = null;
    this.currentWord = null;
    this.wordOptions = [];
    this.chosenWord = null;
    this.guessedPlayers = new Set();
    this.isGameActive = false;
    this.isRoundActive = false;
    this.timer = null;
    this.timeLeft = this.settings.drawTime;
    this.hintsRevealed = 0;
    this.hintTimers = [];
    this.roundHistory = [];
    this.drawHistory = [];

    console.log("✅ Game instance created");
  }

  addPlayer(id, name, socketId) {
    console.log("    📥 Game.addPlayer called");
    console.log("    📥 ID:", id);
    console.log("    📥 Name:", name);
    console.log("    📥 SocketId:", socketId);
    console.log("    📥 Current players:", this.players.length);
    console.log("    📥 Max players:", this.settings.maxPlayers);

    if (this.players.length >= this.settings.maxPlayers) {
      console.log("    ❌ Room is full!");
      throw new Error("Room is full");
    }

    console.log("    📥 Creating new Player object...");
    const player = new Player(id, name, socketId);
    this.players.push(player);

    console.log("    ✅ Player added successfully");
    console.log("    📥 Player socketId:", player.socketId);
    console.log("    📥 Total players now:", this.players.length);
    console.log(
      "    📥 Players list:",
      this.players.map((p) => p.name),
    );

    return player;
  }

  removePlayer(playerId) {
    console.log("📥 Removing player:", playerId);
    const index = this.players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      const player = this.players[index];
      console.log("📥 Found player:", player.name);

      if (this.currentDrawer && this.currentDrawer.id === playerId) {
        console.log("📥 Current drawer is leaving, ending round...");
        this.endRound();
      }
      this.players.splice(index, 1);
      console.log("📥 Player removed. Total players:", this.players.length);
      return player;
    }
    console.log("📥 Player not found");
    return null;
  }

  getPlayer(playerId) {
    return this.players.find((p) => p.id === playerId);
  }

  getPlayersByScore() {
    return [...this.players].sort((a, b) => b.score - a.score);
  }

  startGame() {
    console.log("📥 Starting game...");
    console.log(
      "📥 Players:",
      this.players.map((p) => p.name),
    );

    if (this.players.length < 2) {
      console.log("❌ Need at least 2 players");
      throw new Error("Need at least 2 players");
    }

    this.isGameActive = true;
    this.currentRound = 0;
    this.players.forEach((p) => p.resetForNewGame());
    console.log("✅ Game started");

    return this.startNewRound();
  }

  startNewRound() {
    console.log("📥 Starting new round...");
    this.currentRound++;
    console.log("📥 Round:", this.currentRound);

    this.guessedPlayers = new Set();
    this.isRoundActive = true;
    this.timeLeft = this.settings.drawTime;
    this.hintsRevealed = 0;
    this.drawHistory = [];
    this.chosenWord = null;

    const drawerIndex = (this.currentRound - 1) % this.players.length;
    this.currentDrawer = this.players[drawerIndex];
    this.currentDrawer.isDrawer = true;

    console.log("📥 Drawer:", this.currentDrawer.name);
    console.log("📥 Drawer socketId:", this.currentDrawer.socketId);

    this.wordOptions = this.selectWords();
    this.currentWord = this.wordOptions[0];
    console.log("📥 Word options:", this.wordOptions);

    return {
      round: this.currentRound,
      drawer: this.currentDrawer.toJSON(),
      wordOptions: this.wordOptions,
      drawTime: this.settings.drawTime,
    };
  }

  selectWords() {
    const words = getRandomWords(
      this.settings.wordCount,
      null,
      this.settings.language || "en",
    );
    console.log(
      "📥 Selected words from wordList (language:",
      this.settings.language || "en",
      "):",
      words,
    );
    return words;
  }

  chooseWord(word) {
    console.log("📥 Choosing word:", word);
    if (!this.wordOptions.includes(word)) {
      console.log("❌ Invalid word choice:", word);
      throw new Error("Invalid word choice");
    }
    this.chosenWord = word;
    this.currentWord = word;
    console.log("✅ Word chosen:", word);
    return word;
  }

  handleGuess(playerId, guess) {
    console.log("📥 Guess from player:", playerId, "Guess:", guess);

    const player = this.getPlayer(playerId);
    if (!player) {
      console.log("❌ Player not found");
      return { correct: false, reason: "Player not found" };
    }

    if (player.isDrawer) {
      console.log("❌ Drawer cannot guess");
      return { correct: false, reason: "Drawer cannot guess" };
    }

    if (this.guessedPlayers.has(playerId)) {
      console.log("❌ Already guessed correctly");
      return { correct: false, reason: "Already guessed correctly" };
    }

    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedWord = this.chosenWord.toLowerCase().trim();
    console.log(
      "📥 Normalized guess:",
      normalizedGuess,
      "Word:",
      normalizedWord,
    );

    if (normalizedGuess === normalizedWord) {
      this.guessedPlayers.add(playerId);
      const points = this.calculatePoints();
      player.addPoints(points);
      console.log("✅ Correct guess! Player:", player.name, "Points:", points);

      return {
        correct: true,
        points,
        playerName: player.name,
        allGuessed: this.guessedPlayers.size === this.players.length - 1,
      };
    }

    console.log("❌ Wrong guess");
    return { correct: false };
  }

  calculatePoints() {
    const basePoints = 100;
    const timeBonus = Math.floor((this.timeLeft / this.settings.drawTime) * 50);
    const points = basePoints + timeBonus;
    console.log(
      "📥 Calculating points - Base:",
      basePoints,
      "Time bonus:",
      timeBonus,
      "Total:",
      points,
    );
    return points;
  }

  getHint() {
    if (this.hintsRevealed >= this.settings.hints || !this.chosenWord) {
      console.log("📥 No more hints available");
      return null;
    }

    this.hintsRevealed++;
    const word = this.chosenWord;
    const revealed = Math.floor(
      (this.hintsRevealed / this.settings.hints) * word.length,
    );

    let hint = "";
    for (let i = 0; i < word.length; i++) {
      if (i < revealed || word[i] === " ") {
        hint += word[i];
      } else {
        hint += "_";
      }
    }
    console.log("📥 Hint revealed:", hint);
    return hint;
  }

  // ✅ FIXED: endRound with timeLeft reset
  endRound() {
    console.log("📥 Ending round...");
    this.isRoundActive = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // ✅ Reset timeLeft for next round
    this.timeLeft = this.settings.drawTime;

    const roundResult = {
      word: this.chosenWord,
      scores: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      })),
      guessed: Array.from(this.guessedPlayers),
      nextDrawer: this.getNextDrawer(),
    };

    if (this.currentDrawer) {
      this.currentDrawer.isDrawer = false;
    }
    this.roundHistory.push(roundResult);
    console.log("✅ Round ended. Word was:", this.chosenWord);

    return roundResult;
  }

  getNextDrawer() {
    const currentIndex = this.players.findIndex(
      (p) => p.id === this.currentDrawer.id,
    );
    const nextIndex = (currentIndex + 1) % this.players.length;
    console.log(
      "📥 Next drawer index:",
      nextIndex,
      "Player:",
      this.players[nextIndex].name,
    );
    return this.players[nextIndex];
  }

  isGameOver() {
    const isOver = this.currentRound >= this.settings.rounds;
    console.log(
      "📥 Game over check - Current round:",
      this.currentRound,
      "Total rounds:",
      this.settings.rounds,
      "Is over:",
      isOver,
    );
    return isOver;
  }

  getGameState() {
    const state = {
      isGameActive: this.isGameActive,
      isRoundActive: this.isRoundActive,
      currentRound: this.currentRound,
      totalRounds: this.settings.rounds,
      currentDrawer: this.currentDrawer ? this.currentDrawer.toJSON() : null,
      word: this.getWordDisplay(),
      timeLeft: this.timeLeft,
      players: this.players.map((p) => p.toJSON()),
      hint: this.getHint(),
      settings: this.settings,
    };
    console.log("📥 Game state:", state);
    return state;
  }

  getWordDisplay() {
    if (!this.chosenWord) return null;
    if (this.settings.wordMode === "hidden") return null;
    return this.chosenWord;
  }

  addDrawAction(action) {
    this.drawHistory.push({
      ...action,
      timestamp: Date.now(),
    });
  }

  getDrawHistory() {
    return this.drawHistory;
  }
}
