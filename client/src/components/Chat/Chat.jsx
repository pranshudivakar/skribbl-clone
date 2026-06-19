import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useGame } from "../../contexts/GameContext";
import "./Chat.css";

export default function Chat({ guesses, isDrawer, isRoundActive }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { socket } = useSocket();
  const { state } = useGame();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Add guess notifications
    if (guesses && guesses.length > 0) {
      const lastGuess = guesses[guesses.length - 1];
      setMessages((prev) => [
        ...prev,
        {
          type: "guess",
          text: `🎯 ${lastGuess.playerName} guessed correctly! +${lastGuess.points} points`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [guesses]);

  useEffect(() => {
    if (!socket) return;

    socket.on("chat_message", ({ playerName, text, timestamp }) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "chat",
          playerName,
          text,
          timestamp,
        },
      ]);
    });

    return () => {
      socket.off("chat_message");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if it's a guess
    if (
      state.gameState.word &&
      input.trim().toLowerCase() === state.gameState.word.toLowerCase() &&
      !isDrawer
    ) {
      socket.emit("guess", { text: input.trim() });
    } else {
      socket.emit("chat_message", { text: input.trim() });
    }
    setInput("");
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message-row">
            {msg.type === "guess" ? (
              <div className="chat-bubble chat-bubble-guess">
                <span className="chat-guess-text">🎯 {msg.text}</span>
              </div>
            ) : (
              <div className="chat-bubble">
                <span className="chat-player-name">{msg.playerName}:</span>
                <span className="chat-text">{msg.text}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input-form">
        <div className="chat-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isDrawer
                ? "💬 You're drawing, chat..."
                : "💭 Type your guess or chat..."
            }
            className="chat-input"
            disabled={!isRoundActive}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!isRoundActive}
          >
            Send
          </button>
        </div>
        {!isRoundActive && (
          <p className="chat-waiting-text">⏳ Waiting for round to start...</p>
        )}
      </form>
    </div>
  );
}
