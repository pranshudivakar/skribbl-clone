import React, { createContext, useContext, useReducer } from "react";

const GameContext = createContext();

const initialState = {
  roomId: null,
  player: null,
  players: [],
  gameState: {
    isGameActive: false,
    isRoundActive: false,
    currentRound: 0,
    totalRounds: 0,
    currentDrawer: null,
    word: null,
    timeLeft: 80, // ✅ DEFAULT 80
    hint: null,
  },
  settings: {
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 3,
  },
  isHost: false,
  isDrawer: false,
  pendingWordOptions: null, // ✅ Word selection race condition fix
};

function gameReducer(state, action) {
  console.log("📥 REDUCER - Action:", action.type, action.payload);

  switch (action.type) {
    case "SET_ROOM":
      return {
        ...state,
        roomId: action.payload.roomId,
        player: action.payload.player,
        settings: action.payload.settings || state.settings,
        isHost: action.payload.isHost || false,
      };
    case "UPDATE_PLAYERS":
      console.log("📥 REDUCER - Updating players:", action.payload);
      return {
        ...state,
        players: action.payload,
      };
    case "UPDATE_GAME_STATE":
      console.log("📥 REDUCER - Updating game state:", action.payload);
      // ✅ Agar isDrawer payload mein hai toh state.isDrawer bhi set karo
      const newGameState = {
        ...state.gameState,
        ...action.payload,
      };
      return {
        ...state,
        gameState: newGameState,
        ...(action.payload.isDrawer !== undefined && {
          isDrawer: action.payload.isDrawer,
        }),
      };
    case "SET_DRAWER_STATUS":
      console.log(
        "📥 REDUCER - SET_DRAWER_STATUS called with:",
        action.payload,
      );
      console.log("📥 REDUCER - Old isDrawer:", state.isDrawer);
      const newState = {
        ...state,
        isDrawer: action.payload,
      };
      console.log("📥 REDUCER - New isDrawer:", newState.isDrawer);
      return newState;
    case "SET_HOST_STATUS":
      return {
        ...state,
        isHost: action.payload,
      };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    case "UPDATE_PLAYER_SCORE":
      console.log("📥 REDUCER - Updating player score:", action.payload);
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, score: (p.score || 0) + action.payload.score }
            : p,
        ),
      };
    case "SET_PENDING_WORD_OPTIONS":
      console.log("📥 REDUCER - SET_PENDING_WORD_OPTIONS:", action.payload);
      return {
        ...state,
        pendingWordOptions: action.payload,
      };
    case "CLEAR_PENDING_WORD_OPTIONS":
      console.log("📥 REDUCER - CLEAR_PENDING_WORD_OPTIONS");
      return {
        ...state,
        pendingWordOptions: null,
      };
    case "RESET_GAME":
      return {
        ...initialState,
        gameState: { ...initialState.gameState },
        settings: { ...initialState.settings },
      };
    default:
      return state;
  }
}

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
