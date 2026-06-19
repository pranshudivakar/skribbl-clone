import React, { useEffect, useState } from "react";
import "./Timer.css";

export default function Timer({ timeLeft = 80, onTimeUp }) {
  // ✅ Default 80
  const [isUrgent, setIsUrgent] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    console.log("⏱️ Timer received timeLeft:", timeLeft); // ✅ Debug log
    setIsUrgent(timeLeft <= 10);

    const maxTime = 80;
    const progressPercent = (timeLeft / maxTime) * 100;
    setProgress(Math.max(0, Math.min(100, progressPercent)));

    if (timeLeft <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSeverity = () => {
    if (timeLeft <= 5) return "critical";
    if (timeLeft <= 10) return "high";
    if (timeLeft <= 20) return "medium";
    return "low";
  };

  const severity = getSeverity();

  return (
    <div className="timer-widget">
      <div className="timer-display-group">
        <span className="timer-icon">⏱️</span>
        <span
          className={`timer-text timer-${severity} ${isUrgent ? "timer-pulsing" : ""}`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="timer-progress-track">
        <div
          className={`timer-progress-fill timer-progress-${severity}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isUrgent && timeLeft > 0 && (
        <span className="timer-status timer-status-hurry">⚠️ Hurry!</span>
      )}
      {timeLeft === 0 && (
        <span className="timer-status timer-status-up">⏰ Time's Up!</span>
      )}
    </div>
  );
}
