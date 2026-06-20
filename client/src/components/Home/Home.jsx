import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { useGame } from "../../contexts/GameContext";
import "./Home.css";

// ✅ NAYA: Supported languages list, dropdown ke liye
const LANGUAGES = [
  { code: "en", label: "🇬🇧 English" },
  { code: "hi", label: "🇮🇳 Hindi" },
  { code: "es", label: "🇪🇸 Spanish" },
  { code: "fr", label: "🇫🇷 French" },
  { code: "de", label: "🇩🇪 German" },
];

export default function Home() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { dispatch } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 3,
    isPrivate: false,
    language: "en", // ✅ NAYA: default language English
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    console.log("🔍 Create room button clicked");
    console.log("🔍 Player name:", playerName);
    console.log("🔍 Socket connected:", socket?.connected);

    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsCreating(true);
    console.log("📤 Emitting create_room...");

    socket.emit("create_room", {
      hostName: playerName,
      settings,
    });

    socket.once("room_created", ({ roomId, player, roomInfo }) => {
      console.log("✅ room_created received:", roomId, player);
      console.log("📤 Dispatching SET_ROOM...");

      dispatch({
        type: "SET_ROOM",
        payload: {
          roomId,
          player,
          settings: roomInfo.settings,
          isHost: true,
        },
      });

      console.log("📤 Dispatching UPDATE_PLAYERS with:", [player]);

      dispatch({
        type: "UPDATE_PLAYERS",
        payload: [player],
      });

      console.log("✅ Navigate to lobby...");
      navigate(`/lobby/${roomId}`);
    });

    socket.once("error", ({ message }) => {
      console.error("❌ Error:", message);
      alert(message);
      setIsCreating(false);
    });
  };

  // ✅ Mobile touch support with preventDefault
  const handleCreateRoomTouch = (e) => {
    e.preventDefault();
    handleCreateRoom();
  };

  const handleJoinRoom = () => {
    console.log("🔍 Join room button clicked");
    console.log("🔍 Player name:", playerName);
    console.log("🔍 Room code:", roomCode);
    console.log("🔍 Socket connected:", socket?.connected);

    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!roomCode.trim()) {
      alert("Please enter a room code");
      return;
    }

    const code = roomCode.toUpperCase();
    console.log("📤 Emitting join_room:", code, playerName);

    socket.emit("join_room", {
      roomId: code,
      playerName,
    });

    socket.once("join_success", ({ player, roomInfo }) => {
      console.log("✅ join_success received:", player);
      dispatch({
        type: "SET_ROOM",
        payload: {
          roomId: code,
          player,
          settings: roomInfo.settings,
          isHost: false,
        },
      });
      dispatch({
        type: "UPDATE_PLAYERS",
        payload: roomInfo.players,
      });
      navigate(`/lobby/${code}`);
    });

    socket.once("error", ({ message }) => {
      console.error("❌ Join error:", message);
      alert(message);
    });
  };

  // ✅ Mobile touch support with preventDefault
  const handleJoinRoomTouch = (e) => {
    e.preventDefault();
    handleJoinRoom();
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">🎨 Skribbl.io</h1>

        <div className="home-form">
          <div className="form-group">
            <label className="home-label">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="home-input"
              placeholder="Enter your name"
              maxLength={20}
              inputMode="text"
            />
          </div>

          <button
            onClick={handleCreateRoom}
            onTouchStart={handleCreateRoomTouch}
            disabled={isCreating}
            className="home-btn-create"
          >
            {isCreating ? "Creating..." : "🚀 Create Room"}
          </button>

          <div className="home-divider">
            <span>or</span>
          </div>

          <div className="home-room-input-group">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="home-input"
              placeholder="Room Code"
              maxLength={6}
              inputMode="text"
              autoCapitalize="characters"
            />
            <button
              onClick={handleJoinRoom}
              onTouchStart={handleJoinRoomTouch}
              className="home-btn-join"
            >
              Join
            </button>
          </div>

          <details className="home-settings">
            <summary className="home-settings-summary">
              ⚙️ Room Settings
            </summary>
            <div className="home-settings-content">
              {/* ✅ NAYA: Language selector - sabse upar rakha hai */}
              <div className="home-setting-item">
                <label>Word Language:</label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                  className="home-input"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="home-setting-item">
                <label>
                  Max Players:{" "}
                  <span className="home-setting-value">
                    {settings.maxPlayers}
                  </span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={settings.maxPlayers}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxPlayers: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="home-setting-item">
                <label>
                  Rounds:{" "}
                  <span className="home-setting-value">{settings.rounds}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.rounds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      rounds: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="home-setting-item">
                <label>
                  Draw Time:{" "}
                  <span className="home-setting-value">
                    {settings.drawTime}s
                  </span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="10"
                  value={settings.drawTime}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      drawTime: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="home-setting-item">
                <label>
                  Word Count:{" "}
                  <span className="home-setting-value">
                    {settings.wordCount}
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={settings.wordCount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      wordCount: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="home-setting-item">
                <label>
                  Hints:{" "}
                  <span className="home-setting-value">{settings.hints}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={settings.hints}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hints: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="home-checkbox-group">
                <input
                  type="checkbox"
                  checked={settings.isPrivate}
                  onChange={(e) =>
                    setSettings({ ...settings, isPrivate: e.target.checked })
                  }
                />
                <label>🔒 Private Room</label>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
