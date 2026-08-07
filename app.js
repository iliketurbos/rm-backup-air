// Backup Manager - Main Application Logic
class BackupManager {
    constructor() {
        this.backupLocation = null;
        this.registeredDevices = [];
        this.backupHistory = [];
        this.autoBackup = true;
        this.currentDevice = null;
        this.isBackingUp = false;
        this.fileStats = { totalFiles: 0, totalSize: 0 };
        this.seenDeviceIds = new Set();
        this.pendingDetectedDevices = [];

        this.initializeScreen = 'loading';
        this.hasPermission = false;
        this.deviceDetectionMode = 'none';
        
        this.init();
    }

    async init() {
        console.log('Initializing Backup Manager...');
        
        // Load from localStorage
        this.loadSettings();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup device detection
        this.setupDeviceDetection();

        // Show dashboard by default and use settings for file access
        this.showScreen('dashboard');
        this.updateNotice();

        await this.checkForNewDevices();
    }

    setupEventListeners() {
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('settingsCloseBtn').addEventListener('click', () => this.closeSettings());

        // Device dialogs
        document.getElementById('deviceAcceptBtn').addEventListener('click', () => this.acceptDevice());
        document.getElementById('deviceDeclineBtn').addEventListener('click', () => this.declineDevice());

        // Folder selection
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => this.selectFolderOption(card));
        });
        document.getElementById('folderCreateBtn').addEventListener('click', () => this.createBackupFolder());
        document.getElementById('folderCancelBtn').addEventListener('click', () => this.cancelFolderSelection());

        // Backup button
        document.getElementById('backupBtn').addEventListener('click', () => this.startBackup());

        // Settings buttons
        document.getElementById('selectBackupLocationBtn').addEventListener('click', () => this.selectBackupLocation());
        document.getElementById('autoBackupToggle').addEventListener('change', (e) => {
            this.autoBackup = e.target.checked;
            this.saveSettings();
        });

        // Overlay clicks
        document.getElementById('deviceDialogOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.declineDevice();
            }
        });
        document.getElementById('folderDialogOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.cancelFolderSelection();
            }
        });
        document.getElementById('settingsOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeSettings();
            }
        });
    }

    setupDeviceDetection() {
        this.seenDeviceIds = new Set(this.registeredDevices.map(d => d.id));

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForNewDevices();
            }
        });
    }

    async requestFileAccess() {
        return this.selectBackupLocation();
    }

    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    }

    getFallbackDetectedDevices() {
        if (!this.isMobileDevice()) return [];

        return [
            { id: 'internal-storage', name: 'Internal Storage', path: 'Internal Storage', handle: { kind: 'directory', name: 'Internal Storage' } },
            { id: 'sd-card', name: 'SD Card', path: 'SD Card', handle: { kind: 'directory', name: 'SD Card' } },
            { id: 'external-storage', name: 'External Storage', path: 'External Storage', handle: { kind: 'directory', name: 'External Storage' } },
            { id: 'micro-sd', name: 'Micro SD', path: 'Micro SD', handle: { kind: 'directory', name: 'Micro SD' } },
            { id: 'storage-extsdcard', name: 'extSdCard', path: 'extSdCard', handle: { kind: 'directory', name: 'extSdCard' } },
            { id: 'storage-sdcard1', name: 'sdcard1', path: 'sdcard1', handle: { kind: 'directory', name: 'sdcard1' } },
            { id: 'storage-sdcard', name: 'sdcard', path: 'sdcard', handle: { kind: 'directory', name: 'sdcard' } },
            { id: 'downloads', name: 'Downloads', path: 'Downloads', handle: { kind: 'directory', name: 'Downloads' } },
            { id: 'dcim', name: 'DCIM', path: 'DCIM', handle: { kind: 'directory', name: 'DCIM' } }
        ];
    }

    queueDetectedDevices(devices) {
        const uniqueDevices = devices.filter(device => !this.pendingDetectedDevices.some(p => p.id === device.id));
        this.pendingDetectedDevices.push(...uniqueDevices);
    }

    showNextPendingDevice() {
        if (this.currentDevice) return;
        if (this.pendingDetectedDevices.length === 0) return;

        const device = this.pendingDetectedDevices.shift();
        if (!device) return;

        this.onNewDeviceDetected(device);
    }

    async checkForNewDevices() {
        try {
            const foundDevices = [];

            if (!this.backupLocation && !this.isMobileDevice()) return;

            if (this.deviceDetectionMode === 'mobile-fallback' || !this.backupLocation) {
                for (const device of this.getFallbackDetectedDevices()) {
                    if (this.seenDeviceIds.has(device.id)) continue;
                    const alreadyRegistered = this.registeredDevices.find(d => d.id === device.id);
                    if (alreadyRegistered) {
                        this.seenDeviceIds.add(device.id);
                        continue;
                    }
                    foundDevices.push(device);
                }
            }

            if (this.backupLocation && typeof this.backupLocation.entries === 'function') {
                const entries = this.backupLocation.entries();

                for await (const [name, handle] of entries) {
                    if (handle.kind !== 'directory') continue;
                    if (this.seenDeviceIds.has(name)) continue;
                    const alreadyRegistered = this.registeredDevices.find(d => d.id === name);
                    if (alreadyRegistered) {
                        this.seenDeviceIds.add(name);
                        continue;
                    }

                    foundDevices.push({
                        id: name,
                        name: name,
                        handle: handle,
                        path: name
                    });
                }
            }

            if (foundDevices.length > 0) {
                this.queueDetectedDevices(foundDevices);
                if (!this.currentDevice) {
                    this.showNextPendingDevice();
                }
            } else if (!this.currentDevice && this.pendingDetectedDevices.length > 0) {
                this.showNextPendingDevice();
            }

        } catch (error) {
            console.log('Device detection:', error.message);
        }
    }

    onNewDeviceDetected(device) {
        this.currentDevice = device;
        document.getElementById('deviceDialogName').textContent = device.name;
        this.openDialog('device');
    }

    async acceptDevice() {
        this.closeDialog('device');
        
        // Show folder selection dialog
        document.getElementById('folderDeviceName').textContent = this.currentDevice.name;
        document.getElementById('folderName').value = this.currentDevice.name;
        this.openDialog('folder');
    }

    declineDevice() {
        if (this.currentDevice) {
            this.seenDeviceIds.add(this.currentDevice.id);
        }
        this.closeDialog('device');
        this.currentDevice = null;

        if (this.pendingDetectedDevices.length > 0) {
            setTimeout(() => this.showNextPendingDevice(), 250);
        }
    }

    selectFolderOption(card) {
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const option = card.dataset.option;
        const customInput = document.getElementById('customFolderInput');
        
        if (option === 'custom') {
            customInput.style.display = 'block';
        } else {
            customInput.style.display = 'none';
        }
    }

    async createBackupFolder() {
        try {
            const selectedOption = document.querySelector('.option-card.selected').dataset.option;
            const folderName = document.getElementById('folderName').value.trim();

            if (selectedOption === 'custom' && !folderName) {
                this.showNotification('Invalid Input', 'Please enter a folder name.', 'error');
                return;
            }

            this.closeDialog('folder');

            const device = this.currentDevice;
            device.backupOption = selectedOption;
            device.folderName = selectedOption === 'custom' ? folderName : 'DCIM';
            device.lastBackup = null;
            device.autoBackupEnabled = true;

            this.registeredDevices.push(device);
            this.seenDeviceIds.add(device.id);
            this.saveSettings();

            this.showNotification(
                'Device Registered',
                `${device.name} added to auto-backup list.`,
                'success'
            );

            if (device.autoBackupEnabled) {
                await this.startBackupForDevice(device);
            }

            this.updateDevicesList();
            this.currentDevice = null;

            if (this.pendingDetectedDevices.length > 0) {
                setTimeout(() => this.showNextPendingDevice(), 250);
            }

        } catch (error) {
            this.showNotification('Error', error.message, 'error');
        }
    }

    cancelFolderSelection() {
        this.closeDialog('folder');
        this.currentDevice = null;
        document.getElementById('customFolderInput').style.display = 'none';
    }

    async selectBackupLocation() {
        try {
            const button = document.getElementById('selectBackupLocationBtn');
            if (button) {
                button.disabled = true;
                button.textContent = 'Preparing...';
            }

            let newLocation = null;
            if (typeof window.showDirectoryPicker === 'function') {
                newLocation = await window.showDirectoryPicker({
                    mode: 'readwrite',
                    id: 'backup-location'
                });
            } else if (this.isMobileDevice()) {
                newLocation = {
                    kind: 'directory',
                    name: 'Mobile Storage',
                    isFallback: true
                };
                this.deviceDetectionMode = 'mobile-fallback';
            } else {
                throw new Error('Folder selection is not supported in this browser.');
            }

            this.backupLocation = newLocation;
            this.hasPermission = true;
            this.saveSettings();

            this.showNotification(
                this.deviceDetectionMode === 'mobile-fallback' ? 'Mobile fallback enabled' : 'Location Updated',
                this.deviceDetectionMode === 'mobile-fallback'
                    ? 'Using common storage folders for device detection on this mobile device.'
                    : 'Backup location has been changed.',
                'success'
            );

            this.updateNotice();
            this.closeSettings();
            await this.checkForNewDevices();
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.showNotification('Error', 'Could not select backup location.', 'error');
            }
        } finally {
            const button = document.getElementById('selectBackupLocationBtn');
            if (button) {
                button.disabled = false;
                button.textContent = 'Select Folder';
            }
        }
    }

    async startBackup() {
        const device = this.currentDevice || this.registeredDevices[0];
        if (!device) {
            this.showNotification('No Device', 'Register a device in settings or connect a removable device.', 'error');
            return;
        }

        await this.startBackupForDevice(device);
    }

    async startBackupForDevice(device) {
        if (this.isBackingUp) {
            this.showNotification('Backup In Progress', 'A backup is already running.', 'warning');
            return;
        }

        this.isBackingUp = true;

        try {
            // Show progress section
            const progressSection = document.getElementById('progressSection');
            progressSection.classList.remove('hidden');
            document.getElementById('progressFill').style.width = '0%';
            document.getElementById('progressCount').textContent = '0';

            // Update device status
            const statusText = document.getElementById('deviceStatusText');
            statusText.textContent = 'Backing up...';

            // Simulate device access and backup
            await this.performBackup(device, progressSection);

            // Update last backup time
            device.lastBackup = new Date().toISOString();
            this.saveSettings();

            statusText.textContent = 'Backup completed!';
            this.showNotification(
                'Backup Complete',
                `${device.name} has been backed up successfully!`,
                'success'
            );

            this.addToHistory(device);
            this.updateDevicesList();

        } catch (error) {
            this.showNotification(
                'Backup Error',
                error.message || 'An error occurred during backup.',
                'error'
            );
            document.getElementById('deviceStatusText').textContent = 'Backup failed - try again';
        } finally {
            this.isBackingUp = false;
        }
    }

    async performBackup(device, progressSection) {
        try {
            // This simulates a backup process
            // In a real app, this would:
            // 1. Scan device for media files
            // 2. Check if files exist in backup location
            // 3. Copy only new/changed files
            // 4. Never delete from device

            const fileCount = 25; // Simulated
            let processedCount = 0;

            // Simulate file processing
            const interval = setInterval(() => {
                if (processedCount < fileCount) {
                    processedCount++;
                    const progress = (processedCount / fileCount) * 100;
                    document.getElementById('progressFill').style.width = progress + '%';
                    document.getElementById('progressCount').textContent = processedCount;
                } else {
                    clearInterval(interval);
                }
            }, 200);

            // Wait for simulation to complete
            await new Promise(resolve => {
                const checkComplete = setInterval(() => {
                    if (processedCount >= fileCount) {
                        clearInterval(checkComplete);
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });

            // Update stats
            this.fileStats.totalFiles += fileCount;
            this.fileStats.totalSize += (Math.random() * 500).toFixed(1); // Simulated size in MB

        } catch (error) {
            throw new Error('Failed to backup device: ' + error.message);
        }
    }

    addToHistory(device) {
        const entry = {
            id: Date.now(),
            device: device.name,
            date: new Date(),
            status: 'success',
            filesCount: 25 // Simulated
        };

        this.backupHistory.unshift(entry);
        if (this.backupHistory.length > 20) {
            this.backupHistory.pop();
        }

        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');

        if (this.backupHistory.length === 0) {
            historyList.innerHTML = '<p class="empty-state">No backups yet. Connect a device to get started!</p>';
            return;
        }

        historyList.innerHTML = this.backupHistory.map(entry => `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-title">${entry.device}</div>
                    <div class="history-item-time">${this.formatDate(entry.date)}</div>
                </div>
                <div class="history-item-status">
                    ${entry.status === 'success' ? '✓' : '✗'} ${entry.filesCount} files
                </div>
            </div>
        `).join('');
    }

    updateDevicesList() {
        const devicesList = document.getElementById('devicesList');
        const settingsDevicesList = document.getElementById('settingsDevicesList');

        if (this.registeredDevices.length === 0) {
            devicesList.innerHTML = '<p class="empty-state">No devices registered yet.</p>';
            settingsDevicesList.innerHTML = '<p class="empty-state">No devices registered yet.</p>';
            this.refreshDashboardDeviceCard();
            return;
        }

        const devicesHTML = this.registeredDevices.map(device => `
            <div class="device-item">
                <div class="device-item-info">
                    <div class="device-item-name">${device.name}</div>
                    <div class="device-item-path">${device.folderName}</div>
                    ${device.lastBackup ? `<div class="device-item-path">Last backup: ${this.formatDate(new Date(device.lastBackup))}</div>` : ''}
                </div>
                <button class="btn-icon" onclick="backupApp.removeDevice('${device.id}')" title="Remove device">🗑️</button>
            </div>
        `).join('');

        const settingsHTML = this.registeredDevices.map(device => `
            <div class="device-item settings-device-item">
                <div class="device-item-info">
                    <div class="device-item-name">${device.name}</div>
                    <div class="device-item-path">${device.folderName}</div>
                    ${device.lastBackup ? `<div class="device-item-path">Last backup: ${this.formatDate(new Date(device.lastBackup))}</div>` : ''}
                </div>
                <div class="device-item-actions">
                    <button class="btn-icon device-auto-toggle" onclick="backupApp.toggleDeviceAutoBackup('${device.id}')" title="Toggle auto backup">
                        ${device.autoBackupEnabled ? '✓' : '✕'}
                    </button>
                    <button class="btn-icon" onclick="backupApp.removeDevice('${device.id}')" title="Remove device">🗑️</button>
                </div>
            </div>
        `).join('');

        devicesList.innerHTML = devicesHTML;
        settingsDevicesList.innerHTML = settingsHTML;
        this.refreshDashboardDeviceCard();
    }

    removeDevice(deviceId) {
        if (confirm('Are you sure you want to remove this device from auto-backup?')) {
            this.registeredDevices = this.registeredDevices.filter(d => d.id !== deviceId);
            this.saveSettings();
            this.updateDevicesList();
            this.showNotification('Device Removed', 'Device removed from auto-backup list.', 'success');
        }
    }

    showSettings() {
        document.getElementById('settingsOverlay').classList.remove('hidden');
        
        document.getElementById('totalFiles').textContent = this.fileStats.totalFiles;
        document.getElementById('totalSize').textContent = (this.fileStats.totalSize).toFixed(0) + ' MB';
        document.getElementById('totalDevices').textContent = this.registeredDevices.length;

        document.getElementById('autoBackupToggle').checked = this.autoBackup;
        this.updateDevicesList();
    }

    closeSettings() {
        document.getElementById('settingsOverlay').classList.add('hidden');
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });

        const screenMap = {
            'loading': 'loadingScreen',
            'dashboard': 'dashboard'
        };

        const screen = document.getElementById(screenMap[screenName]);
        if (screen) {
            screen.style.display = 'flex';
        }

        this.initializeScreen = screenName;
    }

    openDialog(type) {
        const overlayMap = {
            'device': 'deviceDialogOverlay',
            'folder': 'folderDialogOverlay',
            'settings': 'settingsOverlay'
        };

        const overlay = document.getElementById(overlayMap[type]);
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    closeDialog(type) {
        const overlayMap = {
            'device': 'deviceDialogOverlay',
            'folder': 'folderDialogOverlay',
            'settings': 'settingsOverlay'
        };

        const overlay = document.getElementById(overlayMap[type]);
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icons = {
            'success': '✓',
            'error': '✕',
            'warning': '⚠',
            'info': 'ℹ'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type]}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    formatDate(date) {
        if (!date) return 'Never';
        
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) return 'Just now';
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        // Format as date
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    saveSettings() {
        const settings = {
            backupLocation: this.backupLocation ? 'set' : null,
            registeredDevices: this.registeredDevices.map(d => ({
                id: d.id,
                name: d.name,
                backupOption: d.backupOption,
                folderName: d.folderName,
                lastBackup: d.lastBackup,
                autoBackupEnabled: d.autoBackupEnabled !== false
            })),
            backupHistory: this.backupHistory,
            autoBackup: this.autoBackup,
            fileStats: this.fileStats
        };

        localStorage.setItem('backupManagerSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const stored = localStorage.getItem('backupManagerSettings');
        if (!stored) return;

        try {
            const settings = JSON.parse(stored);
            this.registeredDevices = (settings.registeredDevices || []).map(device => ({
                ...device,
                autoBackupEnabled: device.autoBackupEnabled !== false
            }));
            this.backupHistory = settings.backupHistory || [];
            this.autoBackup = settings.autoBackup !== false;
            this.fileStats = settings.fileStats || { totalFiles: 0, totalSize: 0 };
            
            if (settings.backupLocation === 'set') {
                this.hasPermission = true;
            }
        } catch (error) {
            console.log('Error loading settings:', error);
        }
    }

    toggleDeviceAutoBackup(deviceId) {
        const device = this.registeredDevices.find(d => d.id === deviceId);
        if (!device) return;

        device.autoBackupEnabled = !device.autoBackupEnabled;
        this.saveSettings();
        this.updateDevicesList();
        this.showNotification(
            device.autoBackupEnabled ? 'Auto-Backup Enabled' : 'Auto-Backup Disabled',
            `${device.name} will ${device.autoBackupEnabled ? 'backup automatically' : 'no longer backup automatically'}.`,
            'info'
        );
    }

    refreshDashboardDeviceCard() {
        const deviceCard = document.getElementById('deviceCard');
        const statusText = document.getElementById('statusText');
        const deviceName = document.getElementById('deviceName');
        const devicePath = document.getElementById('devicePath');
        const deviceStatusText = document.getElementById('deviceStatusText');

        if (this.registeredDevices.length === 0) {
            deviceCard.classList.add('hidden');
            statusText.textContent = 'No devices registered yet.';
            return;
        }

        const activeDevice = this.registeredDevices[0];
        deviceName.textContent = activeDevice.name;
        devicePath.textContent = activeDevice.folderName;
        deviceStatusText.textContent = activeDevice.lastBackup ? `Last backup ${this.formatDate(new Date(activeDevice.lastBackup))}` : 'Ready to backup';

        deviceCard.classList.remove('hidden');
        statusText.textContent = 'Ready to backup';
    }

    updateNotice() {
        const noticeBanner = document.getElementById('noticeBanner');
        if (this.deviceDetectionMode === 'mobile-fallback') {
            noticeBanner.textContent = 'Mobile fallback is active. Common storage folders are available for device detection.';
            noticeBanner.classList.remove('hidden');
            return;
        }

        if (!this.backupLocation) {
            noticeBanner.textContent = 'Select your backup location in Settings before adding devices.';
            noticeBanner.classList.remove('hidden');
            return;
        }

        noticeBanner.classList.add('hidden');
    }
}

// Initialize app when DOM is ready
let backupApp;

document.addEventListener('DOMContentLoaded', () => {
    backupApp = new BackupManager();
    
    // Add to window for easy access
    window.backupApp = backupApp;
});
