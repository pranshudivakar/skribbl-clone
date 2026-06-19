import { io } from "../server.js";

export class MessageHandler {
  constructor() {
    this.messageTypes = {
      ROOM: "room",
      GAME: "game",
      DRAWING: "drawing",
      CHAT: "chat",
      ERROR: "error",
    };
  }

  /**
   * Handle room-related messages
   */
  handleRoomMessage(socket, room, event, data) {
    switch (event) {
      case "create_room":
        return this.handleCreateRoom(socket, data);
      case "join_room":
        return this.handleJoinRoom(socket, data);
      case "leave_room":
        return this.handleLeaveRoom(socket, data);
      case "toggle_ready":
        return this.handleToggleReady(socket, room);
      case "start_game":
        return this.handleStartGame(socket, room);
      default:
        return this.sendError(socket, "Unknown room event");
    }
  }

  /**
   * Handle game-related messages
   */
  handleGameMessage(socket, room, event, data) {
    switch (event) {
      case "choose_word":
        return this.handleChooseWord(socket, room, data);
      case "guess":
        return this.handleGuess(socket, room, data);
      case "get_game_state":
        return this.handleGetGameState(socket, room);
      case "end_round":
        return this.handleEndRound(socket, room);
      default:
        return this.sendError(socket, "Unknown game event");
    }
  }

  /**
   * Handle drawing-related messages
   */
  handleDrawingMessage(socket, room, event, data) {
    if (
      !room ||
      !room.game.currentDrawer ||
      room.game.currentDrawer.id !== socket.id
    ) {
      return this.sendError(socket, "Only the drawer can draw");
    }

    switch (event) {
      case "draw_start":
        return this.handleDrawStart(socket, room, data);
      case "draw_move":
        return this.handleDrawMove(socket, room, data);
      case "draw_end":
        return this.handleDrawEnd(socket, room);
      case "canvas_clear":
        return this.handleCanvasClear(socket, room);
      case "draw_undo":
        return this.handleDrawUndo(socket, room);
      default:
        return this.sendError(socket, "Unknown drawing event");
    }
  }

  /**
   * Handle chat messages
   */
  handleChatMessage(socket, room, data) {
    if (!data.text || data.text.trim().length === 0) {
      return this.sendError(socket, "Message cannot be empty");
    }

    const player = room.game.getPlayer(socket.id);
    if (!player) {
      return this.sendError(socket, "Player not found");
    }

    // Check if message is a guess
    if (room.game.isRoundActive && !player.isDrawer) {
      const guessResult = room.game.handleGuess(socket.id, data.text);
      if (guessResult.correct) {
        this.broadcastGuessResult(
          room,
          socket.id,
          player.name,
          guessResult.points,
        );
        return;
      }
    }

    // Regular chat message
    this.broadcastChatMessage(room, player, data.text);
  }

  // ========== Private Handlers ==========

  /**
   * Handle create room
   */
  handleCreateRoom(socket, data) {
    try {
      const { hostName, settings } = data;
      if (!hostName || hostName.trim().length === 0) {
        return this.sendError(socket, "Host name is required");
      }

      // Room creation is handled in socketHandler.js
      // This method is just for validation
      return { success: true, hostName, settings };
    } catch (error) {
      return this.sendError(socket, error.message);
    }
  }

  /**
   * Handle join room
   */
  handleJoinRoom(socket, data) {
    try {
      const { roomId, playerName } = data;
      if (!roomId || !playerName) {
        return this.sendError(socket, "Room ID and player name are required");
      }

      if (playerName.trim().length === 0) {
        return this.sendError(socket, "Player name cannot be empty");
      }

      return { success: true, roomId, playerName };
    } catch (error) {
      return this.sendError(socket, error.message);
    }
  }

  /**
   * Handle leave room
   */
  handleLeaveRoom(socket, room) {
    if (!room) {
      return this.sendError(socket, "Room not found");
    }

    const player = room.removePlayer(socket.id);
    if (player) {
      this.broadcastPlayerLeft(room, socket.id);
      socket.leave(room.id);
    }

    return { success: true };
  }

  /**
   * Handle toggle ready
   */
  handleToggleReady(socket, room) {
    if (!room) {
      return this.sendError(socket, "Room not found");
    }

    const player = room.game.getPlayer(socket.id);
    if (!player) {
      return this.sendError(socket, "Player not found");
    }

    const isReady = player.toggleReady();
    this.broadcastPlayerReady(room, socket.id, isReady);

    return { success: true, isReady };
  }

  /**
   * Handle start game
   */
  handleStartGame(socket, room) {
    if (!room) {
      return this.sendError(socket, "Room not found");
    }

    if (room.hostId !== socket.id) {
      return this.sendError(socket, "Only the host can start the game");
    }

    if (room.game.players.length < 2) {
      return this.sendError(socket, "Need at least 2 players to start");
    }

    const allReady = room.game.players.every((p) => p.isReady);
    if (!allReady) {
      return this.sendError(socket, "All players must be ready");
    }

    try {
      const gameStartData = room.startGame();
      this.broadcastGameStarted(room, gameStartData);
      return { success: true, gameStartData };
    } catch (error) {
      return this.sendError(socket, error.message);
    }
  }

  /**
   * Handle choose word
   */
  handleChooseWord(socket, room, data) {
    if (!room) {
      return this.sendError(socket, "Room not found");
    }

    if (room.game.currentDrawer.id !== socket.id) {
      return this.sendError(socket, "Only the drawer can choose the word");
    }

    try {
      const chosen = room.game.chooseWord(data.word);
      this.broadcastWordChosen(room, chosen);
      return { success: true, word: chosen };
    } catch (error) {
      return this.sendError(socket, error.message);
    }
  }

  /**
   * Handle guess
   */
  handleGuess(socket, room, data) {
    if (!room) {
      return this.sendError(socket, "Room not found");
    }

    if (!room.game.isRoundActive) {
      return this.sendError(socket, "No active round");
    }

    const player = room.game.getPlayer(socket.id);
    if (!player) {
      return this.sendError(socket, "Player not found");
    }

    if (player.isDrawer) {
      return this.sendError(socket, "Drawer cannot guess");
    }

    const result = room.game.handleGuess(socket.id, data.text);
    if (result.correct) {
      this.broadcastGuessResult(room, socket.id, player.name, result.points);
      if (result.allGuessed) {
        // All players guessed correctly
        this.broadcastRoundEnd(room);
      }
    } else {
      this.sendGuessResult(socket, false, null);
    }

    return { success: true, result };
  }

  /**
   * Handle get game state
   */
  handleGetGameState(socket, room) {
    if (!room) {
      return this.sendError(socket, "Room not found");
    }

    const gameState = room.game.getGameState();
    socket.emit("game_state", gameState);
    return { success: true };
  }

  /**
   * Handle end round (admin only)
   */
  handleEndRound(socket, room) {
    if (!room) {
      return this.sendError(socket, "Room not found");
    }

    if (room.hostId !== socket.id) {
      return this.sendError(socket, "Only the host can end the round");
    }

    this.broadcastRoundEnd(room);
    return { success: true };
  }

  /**
   * Handle draw start
   */
  handleDrawStart(socket, room, data) {
    const action = {
      type: "draw_start",
      x: data.x,
      y: data.y,
      color: data.color,
      size: data.size,
    };
    room.game.addDrawAction(action);
    this.broadcastDrawData(room, action);
    return { success: true };
  }

  /**
   * Handle draw move
   */
  handleDrawMove(socket, room, data) {
    const action = {
      type: "draw_move",
      x: data.x,
      y: data.y,
    };
    room.game.addDrawAction(action);
    this.broadcastDrawData(room, action);
    return { success: true };
  }

  /**
   * Handle draw end
   */
  handleDrawEnd(socket, room) {
    const action = { type: "draw_end" };
    room.game.addDrawAction(action);
    this.broadcastDrawData(room, action);
    return { success: true };
  }

  /**
   * Handle canvas clear
   */
  handleCanvasClear(socket, room) {
    io.to(room.id).emit("canvas_clear");
    room.game.addDrawAction({ type: "canvas_clear" });
    return { success: true };
  }

  /**
   * Handle draw undo
   */
  handleDrawUndo(socket, room) {
    io.to(room.id).emit("draw_undo");
    room.game.addDrawAction({ type: "draw_undo" });
    return { success: true };
  }

  // ========== Broadcasting Methods ==========

  /**
   * Broadcast player joined
   */
  broadcastPlayerJoined(room, player) {
    io.to(room.id).emit("player_joined", {
      player: player.toJSON(),
      players: room.game.players.map((p) => p.toJSON()),
    });
  }

  /**
   * Broadcast player left
   */
  broadcastPlayerLeft(room, playerId) {
    io.to(room.id).emit("player_left", {
      playerId,
      players: room.game.players.map((p) => p.toJSON()),
    });
  }

  /**
   * Broadcast player ready status
   */
  broadcastPlayerReady(room, playerId, isReady) {
    io.to(room.id).emit("player_ready", {
      playerId,
      isReady,
    });
  }

  /**
   * Broadcast game started
   */
  broadcastGameStarted(room, gameStartData) {
    io.to(room.id).emit("game_started", {
      roomInfo: room.getRoomInfo(),
      gameState: room.game.getGameState(),
    });

    // Send word options to drawer
    const drawer = room.game.currentDrawer;
    io.to(drawer.socketId).emit("word_selection", {
      words: gameStartData.wordOptions,
      drawTime: room.settings.drawTime,
    });
  }

  /**
   * Broadcast word chosen
   */
  broadcastWordChosen(room, word) {
    io.to(room.id).emit("word_chosen", {
      word: room.game.getWordDisplay(),
      drawerId: room.game.currentDrawer.id,
    });
  }

  /**
   * Broadcast guess result
   */
  broadcastGuessResult(room, playerId, playerName, points) {
    io.to(room.id).emit("guess_result", {
      correct: true,
      playerId,
      playerName,
      points,
    });
  }

  /**
   * Send guess result to specific player
   */
  sendGuessResult(socket, correct, message) {
    socket.emit("guess_result", {
      correct,
      message: message || (correct ? "Correct!" : "Wrong guess"),
    });
  }

  /**
   * Broadcast round end
   */
  broadcastRoundEnd(room) {
    const roundResult = room.game.endRound();
    io.to(room.id).emit("round_end", roundResult);

    if (room.game.isGameOver()) {
      this.broadcastGameOver(room);
    } else {
      // Start next round after delay
      setTimeout(() => {
        this.startNextRound(room);
      }, 5000);
    }
  }

  /**
   * Broadcast game over
   */
  broadcastGameOver(room) {
    const leaderboard = room.game.getPlayersByScore();
    const winner = leaderboard[0];
    io.to(room.id).emit("game_over", {
      winner: winner.toJSON(),
      leaderboard: leaderboard.map((p) => p.toJSON()),
      roundHistory: room.game.roundHistory,
    });
    room.status = "finished";
  }

  /**
   * Start next round
   */
  startNextRound(room) {
    const gameStartData = room.game.startNewRound();
    io.to(room.id).emit("new_round", {
      round: gameStartData.round,
      drawer: gameStartData.drawer,
      wordOptions: gameStartData.wordOptions,
    });

    // Send word options to new drawer
    const drawer = room.game.currentDrawer;
    io.to(drawer.socketId).emit("word_selection", {
      words: gameStartData.wordOptions,
      drawTime: room.settings.drawTime,
    });
  }

  /**
   * Broadcast draw data
   */
  broadcastDrawData(room, data) {
    io.to(room.id).emit("draw_data", data);
  }

  /**
   * Broadcast chat message
   */
  broadcastChatMessage(room, player, text) {
    io.to(room.id).emit("chat_message", {
      playerId: player.id,
      playerName: player.name,
      text,
      timestamp: Date.now(),
    });
  }

  /**
   * Send error message
   */
  sendError(socket, message) {
    socket.emit("error", { message });
    return { success: false, error: message };
  }

  /**
   * Validate message payload
   */
  validateMessage(event, data) {
    const validations = {
      create_room: () => data.hostName && data.settings,
      join_room: () => data.roomId && data.playerName,
      guess: () => data.text && data.text.trim().length > 0,
      chat_message: () => data.text && data.text.trim().length > 0,
      draw_start: () => data.x !== undefined && data.y !== undefined,
      draw_move: () => data.x !== undefined && data.y !== undefined,
      choose_word: () => data.word && data.word.trim().length > 0,
    };

    const validator = validations[event];
    if (!validator) return true; // No validation needed
    return validator();
  }

  /**
   * Sanitize message data
   */
  sanitizeMessage(data) {
    const sanitized = { ...data };

    // Sanitize strings
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "string") {
        sanitized[key] = sanitized[key].trim().slice(0, 500); // Limit length
      }
    });

    // Sanitize numbers
    if (sanitized.x !== undefined)
      sanitized.x = Math.max(0, Math.min(sanitized.x, 1000));
    if (sanitized.y !== undefined)
      sanitized.y = Math.max(0, Math.min(sanitized.y, 1000));
    if (sanitized.size !== undefined)
      sanitized.size = Math.max(1, Math.min(sanitized.size, 20));

    return sanitized;
  }
}