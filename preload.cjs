const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- 🔄 النظام والتحديثات ---
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // هذا باقي بنفس الاسم باش ما يتكسرش UI ديالك
    checkUpdate: () => ipcRenderer.invoke('check-update'),

    // ✅ جددنا هادو (كيخدمو مع main.cjs اللي لصقت)
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),

    // ✅ Events ديال update (باش تبيّن progress/status فـ React)
    onUpdate: (callback) => {
        const channels = [
            'update:checking',
            'update:available',
            'update:none',
            'update:progress',
            'update:downloaded',
            'update:error',
        ];

        channels.forEach((ch) =>
            ipcRenderer.on(ch, (_event, payload) => callback(ch, payload))
        );

        // optional cleanup function (إلا بغيت تحيد listeners من بعد)
        return () => {
            channels.forEach((ch) => ipcRenderer.removeAllListeners(ch));
        };
    },

    // --- 📊 الداشبورد ---
    onSysData: (callback) =>
        ipcRenderer.on('sys-data', (_event, data) => callback(data)),

    // --- 👑 الاشتراك ---
    getSubscriptionStatus: () => ipcRenderer.invoke('get-subscription-status'),
    activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
    removeLicense: () => ipcRenderer.invoke('remove-license'),

    // --- 🎮 Gaming Mode ---
    getProcesses: () => ipcRenderer.invoke('get-processes'),
    killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
    setGamingMode: (enable) => ipcRenderer.invoke('set-gaming-mode', enable),

    // --- 🌐 Network ---
    checkPing: (host) => ipcRenderer.invoke('check-ping', host),
    setDns: (dnsData) => ipcRenderer.invoke('set-dns', dnsData),
    getCurrentDns: () => ipcRenderer.invoke('get-current-dns'),
    getIpInfo: () => ipcRenderer.invoke('get-ip-info'),
    toggleBooster: (enabled) => ipcRenderer.invoke('toggle-booster', enabled),
    resetNetwork: () => ipcRenderer.invoke('reset-network'),

    // --- 🧹 Cleaner ---
    scanJunk: () => ipcRenderer.invoke('scan-junk'),
    cleanJunk: (categories) => ipcRenderer.invoke('clean-junk', categories),
    optimizeSystem: () => ipcRenderer.invoke('optimize-system'),
});
