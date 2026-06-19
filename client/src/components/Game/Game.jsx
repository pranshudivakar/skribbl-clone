import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { useGame } from "../../contexts/GameContext";
import Canvas from "../Canvas/Canvas";
import Chat from "../Chat/Chat";
import Scoreboard from "./Scoreboard";
import WordDisplay from "./WordDisplay";
import Timer from "./Timer";
import WordSelection from "./WordSelection";
import "./Game.css";

export default function Game() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();
  const [guesses, setGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const [wordOptions, setWordOptions] = useState([]);

  console.log("🎮 Game component rendered");
  console.log("🔍 Players:", state.players);
  console.log("🔍 isDrawer:", state.isDrawer);
  console.log("🔍 isRoundActive:", state.gameState.isRoundActive);
  console.log("🔍 showWordSelection:", showWordSelection);
  console.log("🔍 pendingWordOptions:", state.pendingWordOptions);
  console.log("⏱️ Timer timeLeft:", state.gameState.timeLeft);

  useEffect(() => {
    if (state.pendingWordOptions) {
      console.log(
        "📥🔥 Found pendingWordOptions in context, showing word selection immediately:",
        state.pendingWordOptions,
      );
      setWordOptions(state.pendingWordOptions.words);
      setShowWordSelection(true);
      dispatch({ type: "CLEAR_PENDING_WORD_OPTIONS" });
    }
  }, []);

  // ✅ MONITOR: isDrawer changes
  useEffect(() => {
    console.log("📥 isDrawer CHANGED to:", state.isDrawer);
  }, [state.isDrawer]);

  // ✅ FIX 1: Sync players and request game state on mount
  useEffect(() => {
    console.log("📥 Game component - Current players:", state.players);
    console.log("📥 Game component - Current game state:", state.gameState);

    if (state.players.length === 0 && socket) {
      console.log("📤 Requesting game state from server...");
      socket.emit("get_game_state");
    }

    if (state.players && state.players.length > 0) {
      console.log("✅ Players already in state:", state.players);
    }
  }, [state.players, socket]);

  // ✅ FIX 2: Main socket events
  useEffect(() => {
    if (!socket) {
      console.log("⏳ Waiting for socket...");
      return;
    }

    console.log("✅ Game useEffect - Socket ready");

    socket.on("game_started", ({ roomInfo, gameState }) => {
      console.log("🎮 GAME STARTED EVENT RECEIVED!");
      console.log("📥 Room info:", roomInfo);
      console.log("📥 Game state:", gameState);

      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          isGameActive: true,
          ...gameState,
        },
      });

      if (roomInfo && roomInfo.players) {
        console.log("📥 Updating players from roomInfo:", roomInfo.players);
        dispatch({
          type: "UPDATE_PLAYERS",
          payload: roomInfo.players,
        });
      }
    });

    socket.on("game_state", (gameState) => {
      console.log("📥 Game state received:", gameState);
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: gameState,
      });
    });

    socket.on("word_selection", ({ words, drawTime }) => {
      console.log("📥🔥 WORD SELECTION RECEIVED:", words);
      console.log("📥🔥 Draw time:", drawTime);
      console.log("📥🔥 Current socket ID:", socket.id);

      setWordOptions(words);
      setShowWordSelection(true);
    });

    socket.on("word_chosen", ({ word, drawerId }) => {
      console.log("📥🔥 WORD CHOSEN RECEIVED:");
      console.log("📥 Word:", word);
      console.log("📥 Drawer ID:", drawerId);
      console.log("📥 Current Socket ID:", socket.id);
      console.log("📥 Am I drawer?", drawerId === socket.id);

      setShowWordSelection(false);

      const isDrawer = drawerId === socket.id;
      console.log("📥 Setting isDrawer to:", isDrawer);

      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          word,
          isRoundActive: true,
          isDrawer: isDrawer, // ✅ IMPORTANT
        },
      });

      dispatch({
        type: "SET_DRAWER_STATUS",
        payload: isDrawer,
      });

      // ✅ Request game state to ensure timer is running
      socket.emit("get_game_state");
    });

    socket.on("new_round", ({ round, drawer, wordOptions: options }) => {
      console.log("📥 New round:", round);
      setWordOptions(options);
      setShowWordSelection(true);
      setGuesses([]);
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          currentRound: round,
          currentDrawer: drawer,
          isRoundActive: true,
        },
      });
    });

    socket.on("guess_result", ({ correct, playerId, playerName, points }) => {
      if (correct) {
        console.log("🎯 Correct guess!", playerName, points);
        setGuesses((prev) => [
          ...prev,
          {
            playerName,
            points,
            isCorrect: true,
            timestamp: Date.now(),
          },
        ]);

        // ✅ Update player score
        dispatch({
          type: "UPDATE_PLAYER_SCORE",
          payload: {
            playerId: playerId,
            score: points,
          },
        });
      }
    });

    socket.on("round_end", ({ word, scores, guessed }) => {
      console.log("📥 Round ended:", word);
      setShowWordSelection(false);
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          isRoundActive: false,
          word,
        },
      });
    });

    socket.on("game_over", ({ winner: gameWinner, leaderboard: board }) => {
      console.log("📥 Game over!");
      setGameOver(true);
      setWinner(gameWinner);
      setLeaderboard(board);
    });

    // ✅ TIMER UPDATE EVENT - Pehle se hai, but ensure karo
    socket.on("timer_update", ({ timeLeft }) => {
      console.log("⏱️ Timer update received on Game page:", timeLeft);
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: { timeLeft },
      });
    });

    socket.on("hint_update", ({ hint }) => {
      console.log("💡 Hint update received:", hint);
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: { hint },
      });
    });

    socket.on("error", ({ message }) => {
      console.error("❌ Socket error:", message);
      alert(message);
    });

    return () => {
      console.log("🧹 Game useEffect - Cleanup");
      socket.off("game_started");
      socket.off("game_state");
      socket.off("word_selection");
      socket.off("word_chosen");
      socket.off("new_round");
      socket.off("guess_result");
      socket.off("round_end");
      socket.off("game_over");
      socket.off("timer_update");
      socket.off("hint_update");
      socket.off("error");
    };
  }, [socket, dispatch]);

  useEffect(() => {
    if (socket && state.gameState.isGameActive && state.players.length === 0) {
      console.log("📤 Auto-requesting game state (players missing)...");
      socket.emit("get_game_state");
    }
  }, [socket, state.gameState.isGameActive, state.players.length]);

  // ✅ Auto-request timer state every 5 seconds (fallback)
  useEffect(() => {
    if (socket && state.gameState.isRoundActive) {
      const interval = setInterval(() => {
        socket.emit("get_game_state");
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [socket, state.gameState.isRoundActive]);

  const handleWordSelect = (word) => {
    console.log("📤 Word selected:", word);
    socket.emit("choose_word", { word });
    setShowWordSelection(false);
  };

  if (gameOver) {
    return (
      <div className="game-over-page">
        <div className="game-over-card">
          <h1 className="game-over-title">🎮 Game Over!</h1>
          <div className="game-over-winner">
            <div className="winner-label">🏆 Winner</div>
            <div className="winner-name">{winner?.name}</div>
            <div className="winner-score">Score: {winner?.score}</div>
          </div>
          <div className="game-over-leaderboard">
            <h2 className="leaderboard-title">📊 Leaderboard</h2>
            <div className="leaderboard-list">
              {leaderboard.map((player, index) => (
                <div key={player.id} className="leaderboard-row">
                  <span className="leaderboard-player">
                    <span className="leaderboard-rank">#{index + 1}</span>
                    {player.name}
                    {player.id === state.player?.id && (
                      <span className="leaderboard-you">(You)</span>
                    )}
                  </span>
                  <span className="leaderboard-score">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate("/")} className="play-again-btn">
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  if (showWordSelection) {
    return (
      <WordSelection
        words={wordOptions}
        onSelect={handleWordSelect}
        timeLimit={10}
      />
    );
  }

  return (
    <div className="game-page">
      <div className="game-layout">
        <div className="game-grid">
          <div className="game-sidebar">
            <Scoreboard
              players={state.players}
              currentDrawer={state.gameState.currentDrawer}
            />
          </div>

          <div className="game-main">
            <div className="game-info-bar">
              <div className="game-info-left">
                <span className="game-round">
                  Round {state.gameState.currentRound}/{state.settings.rounds}
                </span>
                <span className="game-info-divider">|</span>
                <span className="game-drawer-name">
                  🎨 {state.gameState.currentDrawer?.name}
                  {state.isDrawer && (
                    <span className="game-drawer-you">(You)</span>
                  )}
                </span>
              </div>
              <div className="game-info-right">
                <Timer timeLeft={state.gameState.timeLeft || 80} />
                <WordDisplay
                  word={state.gameState.word}
                  isDrawer={state.isDrawer}
                  hint={state.gameState.hint}
                />
              </div>
            </div>

            <div className="game-canvas-wrap">
              <Canvas
                isDrawer={state.isDrawer}
                isRoundActive={state.gameState.isRoundActive}
              />
            </div>

            <div className="game-chat-wrap">
              <Chat
                guesses={guesses}
                isDrawer={state.isDrawer}
                isRoundActive={state.gameState.isRoundActive}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
