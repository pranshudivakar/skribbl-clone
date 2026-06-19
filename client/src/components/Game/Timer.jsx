import React, { useEffect, useState } from "react";
import "./Timer.css";

export default function Timer({ timeLeft, onTimeUp }) {
  const [isUrgent, setIsUrgent] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Check if time is urgent (less than 10 seconds)
    setIsUrgent(timeLeft <= 10);

    // Calculate progress percentage (assuming max 80 seconds)
    const maxTime = 80; // You can pass this as prop
    const progressPercent = (timeLeft / maxTime) * 100;
    setProgress(Math.max(0, Math.min(100, progressPercent)));

    // Call onTimeUp when time reaches 0
    if (timeLeft <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  // Format time to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get severity level based on time left (drives color via CSS class)
  const getSeverity = () => {
    if (timeLeft <= 5) return "critical";
    if (timeLeft <= 10) return "high";
    if (timeLeft <= 20) return "medium";
    return "low";
  };

  const severity = getSeverity();

  return (
    <div className="timer-widget">
      {/* Timer Icon */}
      <div className="timer-display-group">
        <span className="timer-icon">⏱️</span>

        {/* Time Display */}
        <span
          className={`timer-text timer-${severity} ${
            isUrgent ? "timer-pulsing" : ""
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="timer-progress-track">
        <div
          className={`timer-progress-fill timer-progress-${severity}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status Indicator */}
      {isUrgent && timeLeft > 0 && (
        <span className="timer-status timer-status-hurry">⚠️ Hurry!</span>
      )}
      {timeLeft === 0 && (
        <span className="timer-status timer-status-up">⏰ Time's Up!</span>
      )}
    </div>
  );
}
