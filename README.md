# 📱 Backup Manager - Auto Photo & Video Backup

A mobile-friendly web app that safely backs up your photos and videos from removable storage devices. Works on both mobile and desktop - looks and feels like a native app!

## ✨ Features

### 🔒 Safe & Secure
- **Never overwrites files** - If a file already exists, it's skipped
- **Never deletes from device** - Only reads files, never modifies or removes them
- **Local processing** - All backups happen on your device, nothing is sent to the cloud
- **Private** - No accounts, no tracking, completely private

### 📱 Mobile & Desktop
- Fully responsive design works perfectly on phones, tablets, and computers
- Installs like a native app (PWA - Progressive Web App)
- Works offline after first load
- Touch-friendly interface

### 🎯 User-Friendly
- Simple, intuitive interface - no technical knowledge needed
- Clear notifications for every action
- Beautiful emoji-based UI that's easy to understand
- No confusing settings or options

### 💾 Auto-Backup
- Automatically detect when devices are connected
- Register devices for automatic backups
- Manual backup control when needed
- Backup history tracking

### 📊 Backup Management
- Track all your backups with history
- See registered devices
- View backup statistics
- Remove devices from auto-backup list

### First Launch

1. **Grant File Access**
   - The app will ask for permission to access your files
   - Click "Grant File Access"
   - Select a folder where backups should be saved

2. **Connect a Device**
   - Connect a removable storage device (USB drive, SD card, etc.)
   - The app will detect it and ask if you want to add it

3. **Set Backup Location**
   - Choose between:
     - **DCIM** - Photos and Videos (default)
     - **Custom Folder** - Create your own folder name
   - Click "Continue"

4. **Start Backup**
   - Click "Start Backup" or let it run automatically
   - Watch as your photos and videos are safely backed up

## 📖 How to Use

### Adding a Device

1. Connect your removable storage device
2. The app detects it and shows a dialog
3. Choose "Yes, Add it" to add to auto-backup list
4. Select backup location (DCIM or Custom)
5. Done! Future connections will auto-backup

### Manual Backup

1. Go to the Dashboard
2. Find your device under "Active Device"
3. Click "Start Backup"
4. Watch the progress bar as files are backed up

### Checking Backup History

1. Look at the "Backup History" section
2. See when each device was last backed up
3. View how many files were processed

### Managing Devices

1. Click the Settings icon (⚙️) in the top right
2. Scroll to "Manage Devices"
3. Click the trash icon (🗑️) to remove a device from auto-backup

### Changing Settings

1. Click Settings (⚙️)
2. **Backup Location** - Select a different folder for backups
3. **Auto-Backup** - Toggle automatic backup on/off
4. **View Statistics** - See total files and backup size

## 🔧 Technical Details

### Browser Support

This app requires:
- **Modern browser** with File System Access API support
- **Chrome/Chromium 86+**
- **Edge 86+**
- **Opera 72+**
- Safari (limited support - iOS 16.4+)

Not supported on Firefox (as of 2024).

### File Organization

```
Your Backup Location/
├── Photos & Videos/          (DCIM storage)
│   ├── 2024-01-15/
│   └── IMG_001.jpg
└── My Phone Backup/          (Custom folders)
    ├── camera/
    └── downloads/
```

### Supported File Types

- **Images**: JPG, PNG, GIF, WebP, HEIF, SVG, BMP
- **Videos**: MP4, MOV, MKV, WebM, AVI, FLV, WMV
- **Documents**: PDF, TXT, DOC, DOCX, XLS, XLSX
- And more...

## 🛡️ Data Safety

### What the app does:
✓ Reads files from your device
✓ Copies files to your chosen backup location
✓ Tracks backup history in your browser
✓ Stores settings locally

### What the app NEVER does:
✗ Deletes files from your device
✗ Overwrites existing backup files
✗ Sends data to any server
✗ Requires an account or login
✗ Shows ads
✗ Accesses other private data

### Storage

- **Settings**: Stored in browser's localStorage (not sent anywhere)
- **Backup History**: Stored locally (survives app updates)
- **Backup Data**: Stored where YOU choose

## 🆘 Troubleshooting

### Device Not Detected
- Make sure the device is properly connected
- Try disconnecting and reconnecting
- Refresh the app (press F5)
- Some devices need to be recognized by your OS first

### Permission Denied
- The app asks for permission once
- If denied, clear your browser data and try again
- Make sure you select a writable folder
- On mobile, ensure the browser has storage permission

### Backup Not Starting
- Check that the device is still connected
- Make sure the backup location is still accessible
- Try manually clicking "Start Backup"
- Disable "Auto-Backup" in settings if issues persist

### Files Not Copying
- Ensure sufficient space on backup location
- Check that the device is readable
- Some files may be locked by the OS

## 📱 Install as App

### On iPhone/iPad (Safari)
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Name it "Backup Manager"
5. Tap "Add"

### On Android (Chrome)
1. Open in Chrome
2. Tap the menu button (⋮)
3. Select "Install app"
4. Confirm the installation

### On Desktop (Chrome/Edge)
1. Click the install icon (⊞) in the address bar
2. Click "Install"
3. The app will open in its own window

## 🐛 Known Limitations

- **Firefox**: File System Access API not yet supported
- **Safari**: Limited support on macOS, better on iOS 16.4+
- **Mobile**: May require specific browser permissions
- **Large devices**: Backing up very large devices might take time

## 🔄 Updates & Changes

Backup Manager is designed to be updated automatically. Just reload the app to get the latest version.

## 📄 License

This project is provided as-is for personal use.

## 🤝 Privacy

This app is completely private. No data is collected, no servers are contacted. Everything stays on your device.

## 💡 Tips & Tricks

1. **Organize folders**: Use meaningful names for custom backup folders
2. **Regular backups**: Set up devices in auto-backup for regular backups
3. **Multiple devices**: You can register multiple devices with different backup locations
4. **Offline access**: After first load, app works offline
5. **Backup to external drive**: You can backup to an external hard drive too!

## ❓ FAQ

**Q: Can I backup to cloud storage?**
A: The app backs up to folders you select. This can be cloud-synced folders like OneDrive or Google Drive.

**Q: What if my app data is cleared?**
A: Your backup files are safe - they're stored where you chose. Only the app settings are lost. Registered devices will be forgotten.

**Q: Can I use this on multiple devices?**
A: Yes! Each device works independently. Just install and set up the same way.

**Q: How much data can I backup?**
A: As much as your storage allows! The app has no limits.

**Q: Is it really never going to delete files?**
A: Absolutely! The app only reads and copies. It never deletes anything from either location.

---

**Made with ❤️ for safe backups**

Questions or issues? Make sure your browser supports the File System Access API and try again!
