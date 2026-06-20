# 🎨 Skribbl.io Clone

A real-time multiplayer drawing and guessing game built with React, Node.js, Socket.IO, and MongoDB.

## 🚀 Live Demo

- **Frontend (Vercel):** [https://skribbl-clone-vercel.vercel.app](https://skribbl-clone-vercel.vercel.app)
- **Backend (Render):** [https://skribbl-clone1.onrender.com](https://skribbl-clone1.onrender.com)
- **Health Check:** [https://skribbl-clone1.onrender.com/health](https://skribbl-clone1.onrender.com/health)
    - **GitHub:** [https://github.com/pranshudivakar/skribbl-clone](https://github.com/pranshudivakar/skribbl-clone)
---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Deployment](#-deployment)
- [How to Play](#-how-to-play)
- [WebSocket Events](#-websocket-events)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Features

### Core Features
- ✅ Create/Join rooms with unique 6-character codes
- ✅ Real-time drawing synchronization via WebSockets
- ✅ Turn-based gameplay with rotating drawers
- ✅ Word guessing with scoring system
- ✅ Lobby system with ready-up functionality
- ✅ Configurable room settings
- ✅ Private rooms (invite-only)

### Drawing Tools
- 🎨 20+ Colors
- ✏️ Adjustable Brush Size (1-20)
- 🧹 Clear Canvas
- ↩️ Undo Last Stroke
- 🧽 Eraser Tool

### Game Features
- ⏱️ Timed Rounds (15-240 seconds)
- 💡 Hints System (0-5 hints per round)
- 📊 Score Tracking
- 🏆 Leaderboard
- 💬 Chat System
- 🌍 Multi-Language Word Support (English, Hindi, Spanish, French, German)

### Room Settings (Host Configurable)
| Setting | Options |
|---------|---------|
| Max Players | 2-20 |
| Rounds | 2-10 |
| Draw Time | 15-240 seconds |
| Word Count | 1-5 words |
| Hints | 0-5 hints |
| Word Language | English, Hindi, Spanish, French, German |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Socket.IO Client | Real-time communication |
| HTML5 Canvas | Drawing |
| CSS3 | Styling |
| Vite | Build Tool |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web Framework |
| Socket.IO | WebSocket Server |
| MongoDB | Database |
| Mongoose | ODM |

---

## 🏆 Bonus Features Implemented
- ✅ Multi-Language Word Support (English, Hindi, Spanish)
- ✅ Private Rooms (Invite-only)
- ✅ Eraser Tool
- ✅ Mobile Responsive UI
- ✅ Auto Word Selection Timer (10 seconds)


## 🏗️ Architecture

### Project Structure