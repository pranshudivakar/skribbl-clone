import React from "react";
import "./WordDisplay.css";

export default function WordDisplay({ word, isDrawer, hint }) {
  // Agar drawer hai toh word dikhao
  if (isDrawer) {
    return (
      <div className="word-display">
        <span className="word-display-icon">📝</span>
        <span className="word-display-text word-display-text-drawer">
          {word || "Select a word"}
        </span>
      </div>
    );
  }

  // Agar hint available hai toh hint dikhao
  if (hint) {
    return (
      <div className="word-display">
        <span className="word-display-icon">💡</span>
        <span className="word-display-text word-display-text-hint">
          {hint}
        </span>
      </div>
    );
  }

  // Agar word hai toh blanks dikhao
  if (word) {
    return (
      <div className="word-display">
        <span className="word-display-icon">❓</span>
        <span className="word-display-text word-display-text-blanks">
          {word.split("").map((char, i) => (
            <span key={i} className={char === " " ? "word-blank-space" : ""}>
              {char === " " ? " " : "_ "}
            </span>
          ))}
        </span>
      </div>
    );
  }

  // Kuch nahi hai toh waiting show karo
  return (
    <div className="word-display">
      <span className="word-display-icon">⏳</span>
      <span className="word-display-text word-display-text-waiting">
        Waiting for word...
      </span>
    </div>
  );
}