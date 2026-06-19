import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { SocketProvider } from "./contexts/SocketContext";
import { GameProvider } from "./contexts/GameContext";
import Home from "./components/Home/Home";
import Lobby from "./components/Lobby/Lobby";
import Game from "./components/Game/Game";
import "./styles/globals.css";

function App() {
  return (
    <Router>
      <SocketProvider>
        <GameProvider>
          <div className="min-h-screen bg-gray-900 text-white">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lobby/:roomId?" element={<Lobby />} />
              <Route path="/game" element={<Game />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </GameProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;

