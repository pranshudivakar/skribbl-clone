import React, { useEffect, useState } from "react";
import "./WordSelection.css";

export default function WordSelection({ words, onSelect, timeLimit = 10 }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  console.log("🎯 WordSelection rendered with:", words);

  // ✅ Countdown timer
  useEffect(() => {
    if (selectedWord) return; // already chosen, stop counting

    if (timeLeft <= 0) {
      // ✅ Auto-select first word agar time khatam ho jaye aur kuch select na hua ho
      if (words && words.length > 0) {
        console.log("⏰ Time up! Auto-selecting:", words[0]);
        handleSelect(words[0]);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, selectedWord]);

  const handleSelect = (word) => {
    if (selectedWord) return; // double-click guard
    console.log("📤 Word selected:", word);
    setSelectedWord(word);
    onSelect(word);
  };

  const isUrgent = timeLeft <= 3;

  if (!words || words.length === 0) {
    return (
      <div className="word-selection-page">
        <div className="word-selection-card">
          <div className="word-selection-header">
            <h2 className="word-selection-title">🎯 Choose Your Word</h2>
            <p className="word-selection-subtitle">Loading words...</p>
          </div>
          <div className="word-options-list">
            <div className="word-option-skeleton" />
            <div className="word-option-skeleton" />
            <div className="word-option-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="word-selection-page">
      <div className="word-selection-card">
        <div className="word-selection-header">
          <h2 className="word-selection-title">🎯 Choose Your Word</h2>
          <p className="word-selection-subtitle">
            Pick a word to draw for this round
          </p>
        </div>

        <div className="word-timer-wrap">
          <div className="word-timer-pill">
            <span
              className={`word-timer-text ${isUrgent ? "word-timer-urgent" : ""}`}
            >
              {timeLeft}s
            </span>
          </div>
        </div>

        <div className="word-options-list">
          {words.map((word, index) => {
            const isSelected = selectedWord === word;
            const isDisabled = selectedWord !== null && !isSelected;

            return (
              <button
                key={index}
                onClick={() => handleSelect(word)}
                disabled={selectedWord !== null}
                className={`word-option-btn ${isSelected ? "word-option-selected" : ""} ${
                  isDisabled ? "word-option-disabled" : ""
                }`}
              >
                <span className="word-option-row">
                  <span>{word}</span>
                  {isSelected && (
                    <span className="word-option-check">✓ Selected</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="word-selection-footer">
          <p
            className={`word-selection-info ${isUrgent ? "word-info-urgent" : ""}`}
          >
            {selectedWord
              ? "Get ready to draw..."
              : isUrgent
                ? "⏰ Hurry up, time is running out!"
                : "Choose wisely — you'll be drawing this word"}
          </p>
        </div>
      </div>
    </div>
  );
}
