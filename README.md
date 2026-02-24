# 🚀 SystemMax Optimizer Pro

![SystemMax Hero Banner](https://via.placeholder.com/1200x400/09090b/facc15?text=SystemMax+Optimizer+Pro)

**SystemMax Optimizer Pro** is an advanced, all-in-one Windows PC optimization tool built with Electron and React. Designed for gamers and power users, it reduces network latency, frees up system resources, monitors hardware temperatures in real-time, and manages premium subscriptions via a secure Supabase backend.

---

## ✨ Key Features

### 📊 Command Center (Real-Time Dashboard)
* **Dynamic Health Gauge:** A sleek, real-time speedometer-style gauge that calculates system health based on CPU load, RAM usage, and thermals.
* **Hardware Monitoring:** Live CPU and GPU temperature tracking (requires Administrator privileges).
* **Live Network Traffic:** Real-time download and upload speed monitoring.
* **1-Click Boost:** Instantly flushes DNS, clears temp files, and optimizes basic system performance.

### 🎮 Gaming Mode
* **Power Plan Injection:** Automatically applies high-performance Windows power plans (`powercfg`) for maximum FPS.
* **Process Manager:** Scans and allows you to kill background processes consuming high memory or CPU.

### 🌐 Network & Latency Optimizer
* **Game Ping Tester:** Real-time TCP ping testing against global servers for popular games (LoL, Valorant, CoD, CS2, etc.).
* **DNS Switcher:** 1-Click DNS switching (Cloudflare, Google, OpenDNS) using PowerShell.
* **TCP Optimizer:** Disables network throttling and optimizes global TCP parameters via `netsh`.
* **Network Reset:** Deep reset of the Windows network stack (Winsock, IP, FlushDNS).

### 🧹 System Cleaner
* **Deep Junk Scan:** Scans Temp folders, Windows Update cache, Browser cache, and Recycle Bin.
* **Space Recovery:** Select specific categories to clean and view exact megabytes freed.

### 🔒 Secure Licensing System
* **Supabase Integration:** Live subscription checking (1 Month, 3 Months, 6 Months, 12 Months, Premium).
* **HWID Locking:** Licenses are securely tied to the user's Hardware ID to prevent sharing.
* **Dynamic LockScreen:** Features a glassmorphism overlay that smoothly locks the UI when a subscription expires, prompting renewal.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, TailwindCSS
* **Bundler:** Vite
* **Desktop Framework:** Electron.js (IPC communication, Native APIs)
* **Backend/Auth:** Supabase (PostgreSQL)
* **System APIs:** `systeminformation`, `child_process` (PowerShell/CMD execution)
* **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **Windows OS** (Required for PowerShell, `netsh`, and `powercfg` commands)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/systemmax-optimizer.git](https://github.com/your-username/systemmax-optimizer.git)
   cd systemmax-optimizer
   Install dependencies:Bashnpm install
Configure Supabase:Ensure your Supabase URL and Anon Key are correctly set in main.cjs for the licensing system to work.Run in Development Mode:Bashnpm run dev
Note: For Vite + Electron, you may need to run the Vite dev server and the Electron app concurrently depending on your specific script setup.Build for Production:Bashnpm run build
⚠️ Important NoteAdministrator Privileges Required: To accurately read CPU/GPU temperatures and execute system-level network/power optimizations, the compiled executable (.exe) must be run as an Administrator.📸 ScreenshotsDashboardGaming ModeNetwork OptimizerPremium LockScreen📄 LicenseThis is a proprietary tool. All rights reserved by the SystemMax Team.
