import { Room } from "./classes/Room.js";
import { MessageHandler } from "./classes/MessageHandler.js";

const rooms = new Map();
const playerSockets = new Map();
const messageHandler = new MessageHandler();

// ✅ TIMER FUNCTION
function startTimer(io, room) {
  if (room.game.timer) {
    clearInterval(room.game.timer);
  }

  room.game.timer = setInterval(() => {
    room.game.timeLeft--;

    // ✅ Send timer update to everyone
    io.to(room.id).emit("timer_update", {
      timeLeft: room.game.timeLeft,
    });

    // ✅ Show hints at intervals
    if (room.game.timeLeft % 15 === 0 && room.game.timeLeft > 0) {
      const hint = room.game.getHint();
      if (hint) {
        io.to(room.id).emit("hint_update", { hint });
      }
    }

    // ✅ Time's up
    if (room.game.timeLeft <= 0) {
      clearInterval(room.game.timer);
      room.game.timer = null;

      // ✅ End round
      const roundResult = room.game.endRound();
      io.to(room.id).emit("round_end", roundResult);

      if (room.game.isGameOver()) {
        const leaderboard = room.game.getPlayersByScore();
        const winner = leaderboard[0];
        io.to(room.id).emit("game_over", {
          winner: winner.toJSON(),
          leaderboard: leaderboard.map((p) => p.toJSON()),
          roundHistory: room.game.roundHistory,
        });
        room.status = "finished";
      } else {
        // ✅ Start next round after delay
        setTimeout(() => {
          const gameStartData = room.game.startNewRound();
          io.to(room.id).emit("new_round", {
            round: gameStartData.round,
            drawer: gameStartData.drawer,
            wordOptions: gameStartData.wordOptions,
          });

          const drawer = room.game.currentDrawer;
          io.to(drawer.socketId).emit("word_selection", {
            words: gameStartData.wordOptions,
            drawTime: room.settings.drawTime,
          });

          startTimer(io, room);
        }, 3000);
      }
    }
  }, 1000);
}

export function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // =============================================
    // ✅ CREATE ROOM
    // =============================================
    socket.on("create_room", ({ hostName, settings }) => {
      try {
        console.log("========================================");
        console.log("📥 CREATE ROOM REQUEST RECEIVED");
        console.log("📥 Host Name:", hostName);
        console.log("📥 Settings:", settings);
        console.log("📥 Socket ID:", socket.id);

        const validation = messageHandler.handleCreateRoom(socket, {
          hostName,
          settings,
        });
        if (!validation.success) {
          console.log("❌ Validation failed");
          return;
        }

        console.log("📥 Creating Room object...");
        const room = new Room(socket.id, settings);
        console.log("✅ Room created with ID:", room.id);

        console.log("📥 Adding player to room...");
        const player = room.addPlayer(socket.id, hostName, socket.id);
        console.log("✅ Player added:", player);
        console.log("✅ Player name:", player.name);
        console.log("✅ Player ID:", player.id);

        rooms.set(room.id, room);
        playerSockets.set(socket.id, { playerId: socket.id, roomId: room.id });

        socket.join(room.id);
        console.log("📥 Socket joined room:", room.id);

        console.log("📤 Emitting room_created to client...");
        socket.emit("room_created", {
          roomId: room.id,
          player: player.toJSON(),
          roomInfo: room.getRoomInfo(),
        });

        console.log("📤 Broadcasting player_joined to room...");
        messageHandler.broadcastPlayerJoined(room, player);

        console.log(
          "✅ Create room COMPLETE. Total players:",
          room.game.players.length,
        );
        console.log("========================================");
      } catch (error) {
        console.error("❌ Create room error:", error);
        messageHandler.sendError(socket, error.message);
      }
    });

    // =============================================
    // ✅ JOIN ROOM
    // =============================================
    socket.on("join_room", ({ roomId, playerName }) => {
      try {
        console.log("📥 JOIN ROOM REQUEST:", roomId, playerName);

        const validation = messageHandler.handleJoinRoom(socket, {
          roomId,
          playerName,
        });
        if (!validation.success) return;

        const room = rooms.get(roomId.toUpperCase());
        if (!room) {
          messageHandler.sendError(socket, "Room not found");
          return;
        }

        if (room.game.players.length >= room.settings.maxPlayers) {
          messageHandler.sendError(socket, "Room is full");
          return;
        }

        const player = room.addPlayer(socket.id, playerName, socket.id);
        playerSockets.set(socket.id, { playerId: socket.id, roomId: room.id });

        socket.join(room.id);
        socket.emit("join_success", {
          player: player.toJSON(),
          roomInfo: room.getRoomInfo(),
        });

        messageHandler.broadcastPlayerJoined(room, player);
        console.log("✅ Player joined room:", roomId);
      } catch (error) {
        messageHandler.sendError(socket, error.message);
      }
    });

    // =============================================
    // ✅ LEAVE ROOM
    // =============================================
    socket.on("leave_room", () => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      messageHandler.handleLeaveRoom(socket, room);
    });

    // =============================================
    // ✅ TOGGLE READY
    // =============================================
    socket.on("toggle_ready", () => {
      console.log("🔄 toggle_ready from:", socket.id);

      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) {
        console.log("❌ Player info not found");
        return;
      }

      const room = rooms.get(playerInfo.roomId);
      if (!room) {
        console.log("❌ Room not found");
        return;
      }

      messageHandler.handleToggleReady(socket, room);
    });

    // =============================================
    // ✅ START GAME - WITH TIMER
    // =============================================
    socket.on("start_game", () => {
      console.log("🚀 start_game event received!");
      console.log("📥 Socket ID:", socket.id);

      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) {
        console.log("❌ Player info not found");
        socket.emit("error", { message: "Player not found" });
        return;
      }

      const room = rooms.get(playerInfo.roomId);
      if (!room) {
        console.log("❌ Room not found");
        socket.emit("error", { message: "Room not found" });
        return;
      }

      if (room.hostId !== socket.id) {
        console.log("❌ Only host can start");
        socket.emit("error", { message: "Only host can start" });
        return;
      }

      try {
        const gameStartData = room.startGame();
        console.log("✅ Game started:", gameStartData);
        console.log("📥 Word options:", gameStartData.wordOptions);
        console.log("📥 Drawer:", room.game.currentDrawer?.name);
        console.log("📥 Drawer socketId:", room.game.currentDrawer?.socketId);

        // ✅ Broadcast game_started
        io.to(room.id).emit("game_started", {
          roomInfo: room.getRoomInfo(),
          gameState: room.game.getGameState(),
        });

        // ✅ Send word selection
        io.to(room.id).emit("word_selection", {
          words: gameStartData.wordOptions,
          drawTime: room.settings.drawTime,
        });

        // ✅ START TIMER
        startTimer(io, room);
      } catch (error) {
        console.error("❌ Start game error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // =============================================
    // ✅ CHOOSE WORD
    // =============================================
    socket.on("choose_word", ({ word }) => {
      console.log("📥 choose_word received:", word);

      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) {
        console.log("❌ Player info not found");
        return;
      }

      const room = rooms.get(playerInfo.roomId);
      if (!room) {
        console.log("❌ Room not found");
        return;
      }

      const result = messageHandler.handleChooseWord(socket, room, { word });

      if (result.success) {
        console.log("✅ Word chosen via MessageHandler:", result.word);
        io.to(room.id).emit("game_state", room.game.getGameState());
      } else {
        console.log("❌ Choose word failed:", result.error);
      }
    });

    // =============================================
    // ✅ DRAWING EVENTS
    // =============================================
    socket.on("draw_start", (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      if (!messageHandler.validateMessage("draw_start", data)) {
        messageHandler.sendError(socket, "Invalid draw data");
        return;
      }
      const sanitizedData = messageHandler.sanitizeMessage(data);
      messageHandler.handleDrawingMessage(
        socket,
        room,
        "draw_start",
        sanitizedData,
      );
    });

    socket.on("draw_move", (data) => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      if (!messageHandler.validateMessage("draw_move", data)) {
        messageHandler.sendError(socket, "Invalid draw data");
        return;
      }
      const sanitizedData = messageHandler.sanitizeMessage(data);
      messageHandler.handleDrawingMessage(
        socket,
        room,
        "draw_move",
        sanitizedData,
      );
    });

    socket.on("draw_end", () => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      messageHandler.handleDrawingMessage(socket, room, "draw_end", {});
    });

    socket.on("canvas_clear", () => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      messageHandler.handleDrawingMessage(socket, room, "canvas_clear", {});
    });

    socket.on("draw_undo", () => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      messageHandler.handleDrawingMessage(socket, room, "draw_undo", {});
    });

    // =============================================
    // ✅ GUESSING
    // =============================================
    socket.on("guess", ({ text }) => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      if (!messageHandler.validateMessage("guess", { text })) {
        messageHandler.sendError(socket, "Invalid guess");
        return;
      }

      messageHandler.handleGuess(socket, room, { text });
    });

    // =============================================
    // ✅ CHAT
    // =============================================
    socket.on("chat_message", ({ text }) => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      if (!messageHandler.validateMessage("chat_message", { text })) {
        messageHandler.sendError(socket, "Invalid message");
        return;
      }

      messageHandler.handleChatMessage(socket, room, { text });
    });

    // =============================================
    // ✅ GET GAME STATE
    // =============================================
    socket.on("get_game_state", () => {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      messageHandler.handleGetGameState(socket, room);
    });

    // =============================================
    // ✅ DISCONNECT
    // =============================================
    socket.on("disconnect", () => {
      console.log(`❌ Player disconnected: ${socket.id}`);

      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo) return;

      const room = rooms.get(playerInfo.roomId);
      if (!room) return;

      const player = room.removePlayer(socket.id);
      if (player) {
        messageHandler.broadcastPlayerLeft(room, socket.id);
      }

      if (room.game.players.length === 0) {
        rooms.delete(room.id);
        console.log(`🗑️ Room ${room.id} deleted - empty`);
      } else if (room.hostId === socket.id && room.game.players.length > 0) {
        const newHost = room.game.players[0];
        room.hostId = newHost.id;
        io.to(room.id).emit("host_changed", { newHostId: newHost.id });
        console.log(`👑 New host: ${newHost.name}`);
      }

      playerSockets.delete(socket.id);
    });
  });
}
