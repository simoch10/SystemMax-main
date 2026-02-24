# 🚀 SystemMax Optimizer Pro

![SystemMax Hero Banner](https://via.placeholder.com/1200x400/09090b/facc15?text=SystemMax+Optimizer+Pro)

**SystemMax Optimizer Pro** is an ultimate Windows PC optimization tool designed for gamers, streamers, and power users. Built with a modern architecture, it reduces network latency, frees up system resources, monitors hardware temperatures in real-time, and ensures your PC runs at peak performance.

---

## ✨ Key Features

### 📊 Command Center (Real-Time Dashboard)
* **Dynamic Health Gauge:** A real-time speedometer-style gauge that calculates system health based on CPU load, RAM usage, and thermals.
* **Hardware Monitoring:** Live CPU and GPU temperature tracking directly from your motherboard sensors.
* **Live Network Traffic:** Real-time download and upload speed monitoring.
* **1-Click Boost:** Instantly flushes DNS, clears background RAM, and optimizes basic system performance.

### 🎮 Gaming Mode
* **Power Plan Injection:** Automatically applies high-performance Windows power plans (`powercfg`) for maximum FPS and zero throttling.
* **Process Manager:** Scans and allows you to kill background processes consuming high memory or CPU.

### 🌐 Network & Latency Optimizer
* **Game Ping Tester:** Real-time TCP ping testing against global servers for popular games (LoL, Valorant, CoD, CS2, etc.).
* **DNS Switcher:** 1-Click DNS switching (Cloudflare, Google, OpenDNS) to find the fastest route.
* **TCP Optimizer:** Disables network throttling and optimizes global TCP parameters via `netsh`.
* **Deep Network Reset:** Complete reset of the Windows network stack (Winsock, IP, FlushDNS) to fix connection issues.

### 🧹 System Cleaner
* **Deep Junk Scan:** Scans Temp folders, Windows Update cache, Browser cache, and Recycle Bin.
* **Space Recovery:** Select specific categories to clean and instantly view exact megabytes freed.

### 🔒 Secure Licensing System
* **Premium Subscriptions:** Live subscription checking (1 Month, 3 Months, 6 Months, 12 Months, Lifetime).
* **HWID Locking:** Licenses are securely tied to your specific Hardware ID to prevent unauthorized sharing.

---

## 💻 Installation & Usage (End-Users)

To get the most out of SystemMax Optimizer Pro, follow these steps:

### System Requirements
* **OS:** Windows 10 or Windows 11 (64-bit)
* **Permissions:** Administrator rights (Required for hardware sensors and network commands)

### How to Install
1. Navigate to the **[Releases](../../releases)** page on this repository.
2. Download the latest `SystemMax-Setup-vX.X.X.exe` file.
3. Double-click the downloaded `.exe` file to install the application.
4. **CRITICAL:** Right-click the installed SystemMax shortcut on your desktop and select **"Run as Administrator"**. *(Without admin rights, temperature readings and network optimizations will not function).*
5. Enter your premium license key when prompted.
6. Click **"1-Click Optimize"** on the Command Center and enjoy your boosted PC!

---

## 📸 Screenshots

| Command Center | Gaming Mode |
| :---: | :---: |
| ![Dashboard](https://via.placeholder.com/600x400/09090b/ffffff?text=Dashboard+Screenshot) | ![Gaming](https://via.placeholder.com/600x400/09090b/ffffff?text=Gaming+Screenshot) |

| Network Optimizer | Premium LockScreen |
| :---: | :---: |
| ![Network](https://via.placeholder.com/600x400/09090b/ffffff?text=Network+Screenshot) | ![LockScreen](https://via.placeholder.com/600x400/09090b/ffffff?text=LockScreen+Screenshot) |

---

## 🛠️ Developer Setup (For Contributors)

If you are a developer looking to build the app from source:

* **Tech Stack:** React 18, TypeScript, TailwindCSS, Vite, Electron.js, Supabase.

```bash
# 1. Clone the repository
git clone [https://github.com/your-username/systemmax-optimizer.git](https://github.com/your-username/systemmax-optimizer.git)
cd systemmax-optimizer

# 2. Install dependencies
npm install

# 3. Configure Supabase keys in main.cjs

# 4. Run in development mode
npm run dev

# 5. Build the .exe for Windows
npm run build
