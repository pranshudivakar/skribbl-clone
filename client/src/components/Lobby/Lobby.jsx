import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { useGame } from "../../contexts/GameContext";
import "./Lobby.css";

export default function Lobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);

  console.log("🔍 Lobby RENDER - Players:", players);
  console.log("🔍 Lobby RENDER - State players:", state.players);
  console.log(
    "🔍 Lobby RENDER - All ready:",
    players.length > 0 && players.every((p) => p.isReady),
  );
  console.log("🔍 Lobby RENDER - Is Host:", state.isHost);

  useEffect(() => {
    console.log("🔍 Lobby useEffect - Mounted");
    console.log("🔍 Socket:", socket?.id);
    console.log("🔍 Room ID:", roomId);
    console.log("🔍 State players on mount:", state.players);

    if (!socket || !roomId) {
      console.log("⏳ Waiting for socket or room...");
      return;
    }

    if (state.players && state.players.length > 0) {
      console.log("📥 Syncing state players to local:", state.players);
      setPlayers(state.players);
    }

    socket.emit("get_game_state");

    socket.on("player_joined", ({ player, players: updatedPlayers }) => {
      console.log("👤🔥 player_joined event received:", player);
      console.log("👥🔥 Updated players list:", updatedPlayers);
      setPlayers(updatedPlayers);
      dispatch({
        type: "UPDATE_PLAYERS",
        payload: updatedPlayers,
      });
    });

    socket.on("player_left", ({ playerId, players: updatedPlayers }) => {
      console.log("👤 Player left:", playerId);
      setPlayers(updatedPlayers);
      dispatch({
        type: "UPDATE_PLAYERS",
        payload: updatedPlayers,
      });
    });

    socket.on("player_ready", ({ playerId, isReady: ready }) => {
      console.log("✅ Player ready:", playerId, ready);
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, isReady: ready } : p)),
      );
    });

    socket.on("word_selection", ({ words, drawTime }) => {
      console.log(
        "📥🔥 LOBBY - WORD SELECTION RECEIVED (pre-navigate):",
        words,
      );
      dispatch({
        type: "SET_PENDING_WORD_OPTIONS",
        payload: { words, drawTime },
      });
    });

    socket.on("game_started", ({ roomInfo, gameState }) => {
      console.log("🎮 Game started!");
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          isGameActive: true,
          ...gameState,
        },
      });
      navigate("/game");
    });

    socket.on("host_changed", ({ newHostId }) => {
      console.log("👑 Host changed:", newHostId);
      dispatch({
        type: "SET_HOST_STATUS",
        payload: newHostId === socket.id,
      });
    });

    socket.on("error", ({ message }) => {
      console.error("❌ Socket error:", message);
      alert(message);
    });

    return () => {
      console.log("🔍 Lobby useEffect - Cleanup");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("player_ready");
      socket.off("word_selection");
      socket.off("game_started");
      socket.off("host_changed");
      socket.off("error");
    };
  }, [socket, roomId, navigate, dispatch]);

  useEffect(() => {
    if (state.players && state.players.length > 0 && players.length === 0) {
      console.log("📥 Syncing state.players to local players:", state.players);
      setPlayers(state.players);
    }
  }, [state.players]);

  const handleReadyToggle = () => {
    console.log("🔄 Toggle ready clicked");
    console.log("🔍 Current ready status:", isReady);
    console.log("🔍 Socket ID:", socket?.id);

    setIsReady(!isReady);
    socket.emit("toggle_ready");
  };

  const handleStartGame = () => {
    console.log("🚀 Start Game button clicked");
    console.log("🔍 Is Host:", state.isHost);
    console.log("🔍 All players ready:", allPlayersReady);
    console.log("🔍 Players:", players);

    if (!state.isHost) {
      alert("Only host can start the game!");
      return;
    }

    if (players.length < 2) {
      alert("Need at least 2 players!");
      return;
    }

    if (!allPlayersReady) {
      alert("All players must be ready!");
      return;
    }

    console.log("✅ All conditions met! Emitting start_game...");
    socket.emit("start_game");
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/lobby/${roomId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(link)
        .then(() => alert("✅ Room link copied!"))
        .catch(() => copyRoomLinkFallback(link));
    } else {
      copyRoomLinkFallback(link);
    }
  };

  const copyRoomLinkFallback = (text) => {
    const input = document.createElement("input");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      alert("✅ Room link copied!");
    } catch (err) {
      alert(`📋 Room link: ${text}`);
    }
    document.body.removeChild(input);
  };

  const allPlayersReady = players.length > 0 && players.every((p) => p.isReady);

  return (
    <div className="lobby-container">
      <div className="lobby-content">
        <div className="lobby-card">
          <div className="lobby-header">
            <h1 className="lobby-title">🎮 Lobby</h1>
            <div className="lobby-room-info">
              <span className="lobby-room-code">Room: {roomId}</span>
              <button onClick={copyRoomLink} className="lobby-btn-copy">
                📋 Copy Link
              </button>
            </div>
          </div>

          <div className="lobby-players-section">
            <h2 className="lobby-players-title">
              Players ({players.length}/{state.settings?.maxPlayers || 8})
            </h2>
            <div className="lobby-players-grid">
              {players.length === 0 ? (
                <p className="lobby-no-players">
                  👥 No players yet. Share the link!
                </p>
              ) : (
                players.map((player) => (
                  <div key={player.id} className="lobby-player-item">
                    <span className="lobby-player-name">
                      {player.name}
                      {player.id === state.player?.id && (
                        <span className="you"> (You)</span>
                      )}
                      {state.isHost && player.id === state.player?.id && (
                        <span className="host"> 👑</span>
                      )}
                    </span>
                    <span
                      className={`lobby-player-status ${player.isReady ? "ready" : "waiting"}`}
                    >
                      {player.isReady ? "✅ Ready" : "⏳ Waiting"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lobby-actions">
            <button
              onClick={handleStartGame}
              disabled={!allPlayersReady || players.length < 2 || !state.isHost}
              className={`btn ${allPlayersReady && players.length >= 2 && state.isHost ? "btn-success" : "btn-secondary"}`}
            >
              🚀 Start Game{" "}
              {!state.isHost
                ? "(Only Host)"
                : players.length < 2
                  ? "(Need 2+ players)"
                  : ""}
            </button>
            <button
              onClick={handleReadyToggle}
              className={`btn ${isReady ? "btn-warning" : "btn-primary"}`}
            >
              {isReady ? "❌ Cancel Ready" : "✅ Ready Up"}
            </button>
          </div>

          {!state.isHost && (
            <p className="lobby-info-text">
              ⏳ Waiting for host to start the game...
            </p>
          )}

          <div className="lobby-info-text">
            {players.length < 2
              ? "👥 Waiting for more players..."
              : !allPlayersReady
                ? "⏳ Waiting for all players to ready up..."
                : state.isHost
                  ? "🎯 All players ready! Start the game!"
                  : "⏳ Waiting for host to start..."}
          </div>
        </div>
      </div>
    </div>
  );
}
