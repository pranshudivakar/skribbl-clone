import React, { useRef, useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useGame } from "../../contexts/GameContext";
import "./Canvas.css";

export default function Canvas({ isDrawer, isRoundActive }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const { socket } = useSocket();
  const { state } = useGame();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState("brush"); // brush, eraser

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#808080",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  // Canvas setup and socket listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    ctxRef.current = context;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width || 800;
        canvas.height = rect.height || 400;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    if (socket) {
      socket.on("draw_data", (data) => {
        handleDrawData(data);
      });

      socket.on("canvas_clear", () => {
        clearCanvas(false);
      });

      socket.on("draw_undo", () => {
        undoDraw();
      });
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (socket) {
        socket.off("draw_data");
        socket.off("canvas_clear");
        socket.off("draw_undo");
      }
    };
  }, [socket]);

  const handleDrawData = (data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    switch (data.type) {
      case "draw_start":
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        ctx.strokeStyle = data.color || color;
        ctx.lineWidth = data.size || brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        break;
      case "draw_move":
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        break;
      case "draw_end":
        ctx.closePath();
        break;
      default:
        break;
    }
  };

  const startDrawing = (e) => {
    if (!isDrawer || !isRoundActive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setIsDrawing(true);
    socket.emit("draw_start", { x, y, color, size: brushSize });
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawer || !isRoundActive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    socket.emit("draw_move", { x, y });
  };

  const stopDrawing = () => {
    if (!isDrawer) return;
    setIsDrawing(false);
    socket.emit("draw_end");
  };

  const clearCanvas = (emit = true) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (emit && isDrawer) {
      socket.emit("canvas_clear");
    }
  };

  const undoDraw = () => {
    if (isDrawer) {
      socket.emit("draw_undo");
    }
  };

  // ✅ Tool handlers
  const handleToolChange = (newTool) => {
    console.log("🛠️ Tool changed:", newTool);
    setTool(newTool);
    if (newTool === "eraser") {
      setColor("#FFFFFF");
    } else {
      setColor("#000000");
    }
  };

  // Touch Event Handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    if (!touch) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    if (!isDrawer || !isRoundActive) return;

    setIsDrawing(true);
    socket.emit("draw_start", { x, y, color, size: brushSize });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawing || !isDrawer || !isRoundActive) return;

    const touch = e.touches[0];
    if (!touch) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    socket.emit("draw_move", { x, y });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawer) return;
    setIsDrawing(false);
    socket.emit("draw_end");
  };

  return (
    <div className="canvas-container">
      {/* Drawing Tools - Only visible to drawer */}
      {isDrawer && isRoundActive && (
        <div className="canvas-tools">
          {/* Color Palette */}
          <div className="canvas-tool-group">
            <span className="canvas-tool-label">🎨</span>
            <div className="canvas-colors">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    console.log("🎨 Color clicked:", c);
                    setColor(c);
                    if (tool === "eraser") setTool("brush");
                  }}
                  className={`canvas-color-btn ${color === c ? "active" : ""}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="canvas-tool-divider" />

          {/* Brush Size */}
          <div className="canvas-tool-group">
            <span className="canvas-tool-label">📏</span>
            <div className="canvas-brush-size">
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  console.log("📏 Brush size changed:", newSize);
                  setBrushSize(newSize);
                }}
              />
              <span className="size-label">{brushSize}</span>
            </div>
          </div>

          <div className="canvas-tool-divider" />

          {/* Tools */}
          <div className="canvas-tool-group">
            <button
              onClick={() => handleToolChange("brush")}
              className={`canvas-tool-btn ${tool === "brush" ? "active" : ""}`}
              title="Brush"
            >
              🖌️
            </button>
            <button
              onClick={() => handleToolChange("eraser")}
              className={`canvas-tool-btn ${tool === "eraser" ? "active" : ""}`}
              title="Eraser"
            >
              🧹
            </button>
          </div>

          <div className="canvas-tool-divider" />

          {/* Actions */}
          <div className="canvas-tool-group">
            <button
              onClick={() => clearCanvas(true)}
              className="canvas-action-btn clear"
            >
              Clear All
            </button>
            <button onClick={undoDraw} className="canvas-action-btn undo">
              ↩️ Undo
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Overlay Messages */}
      {!isRoundActive && (
        <div className="canvas-overlay">
          <div className="message">
            <span className="icon">{isDrawer ? "🎨" : "⏳"}</span>
            {isDrawer ? "Choose your word" : "Waiting for round to start..."}
          </div>
        </div>
      )}

      {isDrawer && isRoundActive && (
        <div className="canvas-drawer-badge">🖌️ You are drawing</div>
      )}

      {!isDrawer && isRoundActive && (
        <div className="canvas-drawer-badge">💬 Type your guess in chat</div>
      )}
    </div>
  );
}
