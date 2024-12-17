import React, { useState, useEffect, useRef } from "react";
import "./Timer.css"; // Custom CSS file for styling
import beep from "../../assets/notification/beep.wav";
// Global Variables for Study and Rest Times
const STUDY_TIME = 1800; // 30 minutes in seconds
const REST_TIME = 600; // 10 minutes in seconds

export default function Timer() {
  const [timeLeft, setTimeLeft] = useState(STUDY_TIME);
  const [isResting, setIsResting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [totalCycles, setTotalCycles] = useState(1);

  // Reference for audio
  const audioRef = useRef(null);

  // Timer Logic
  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      // Play sound effect when phase ends
      if (audioRef.current) {
        audioRef.current.play();
      }

      // Handle end of current period
      if (isResting) {
        if (cycle === totalCycles) {
          setIsRunning(false);
        } else {
          setCycle((prev) => prev + 1);
          setIsResting(false);
          setTimeLeft(STUDY_TIME);
        }
      } else {
        setIsResting(true);
        setTimeLeft(REST_TIME);
      }
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isResting, cycle, totalCycles]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const resetTimer = () => {
    setTimeLeft(STUDY_TIME);
    setCycle(1);
    setTotalCycles(1);
    setIsRunning(false);
    setIsResting(false);
  };

  return (
    <div className="timer-container">
      {/* Hidden audio for phase end */}
      <audio ref={audioRef} src={beep} preload="auto"></audio>

      <h1 className="title">{isResting ? "Rest Time" : "Study Time"}</h1>
      <div className="timer-display">{formatTime(timeLeft)}</div>

      <button
        className="button start-button"
        onClick={() => setIsRunning(!isRunning)}
      >
        {isRunning ? "Pause" : "Start"}
      </button>

      <button className="button reset-button" onClick={resetTimer}>
        Reset
      </button>

      <div className="cycle-container">
        <p>Cycles: {totalCycles}</p>
        <div className="cycle-buttons">
          <button
            className="button cycle-button"
            onClick={() => setTotalCycles((prev) => Math.max(prev - 1, 1))}
          >
            -
          </button>
          <button
            className="button cycle-button"
            onClick={() => setTotalCycles((prev) => prev + 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
