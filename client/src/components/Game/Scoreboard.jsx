import React from "react";
import "./Scoreboard.css";

export default function Scoreboard({ players, currentDrawer }) {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="scoreboard-panel">
      <h3 className="scoreboard-title">📊 Scoreboard</h3>
      <div className="scoreboard-list">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`scoreboard-item ${
              player.isDrawer ? "scoreboard-item-drawer" : ""
            }`}
          >
            <div className="scoreboard-player-info">
              <span className="scoreboard-rank">{index + 1}</span>
              <span className="scoreboard-name">
                {player.name}
                {player.isDrawer && " 🎨"}
              </span>
            </div>
            <span className="scoreboard-score">{player.score}</span>
          </div>
        ))}
      </div>
      {players.length === 0 && (
        <p className="scoreboard-empty">Waiting for players...</p>
      )}
    </div>
  );
}
