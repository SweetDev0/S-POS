const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

class BackupService {
  constructor(dbPath, userId) {
    this.dbPath = dbPath;
    this.userId = userId;
    this.backupsDir = path.join(app.getPath('userData'), 'backups', String(userId));
  }

  async initialize() {
    try {
      await fs.mkdir(this.backupsDir, { recursive: true });
      console.log('Backups directory is ready:', this.backupsDir);
    } catch (error) {
      console.error('Failed to create backups directory:', error);
    }
  }

  async createBackup(isAuto = false) {
    try {
      await this.initialize(); // Ensure directory exists
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${isAuto ? 'auto-' : ''}backup-${timestamp}.db`;
      const backupFilePath = path.join(this.backupsDir, backupFileName);

      await fs.copyFile(this.dbPath, backupFilePath);
      const stats = await fs.stat(backupFilePath); // Get stats of the new file

      const newBackup = {
        name: backupFileName,
        path: backupFilePath,
        size: stats.size,
        createdAt: stats.birthtime,
      };

      console.log(`Backup created successfully:`, newBackup);
      return { success: true, backup: newBackup }; // Return the new backup object
    } catch (error) {
      console.error('Failed to create backup:', error);
      return { success: false, error: 'Yedek oluşturulamadı.' };
    }
  }

  async listBackups() {
    try {
      await this.initialize(); // Ensure directory exists
      const files = await fs.readdir(this.backupsDir);
      const backupFiles = files.filter(file => file.endsWith('.db'));

      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupsDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
      );

      // Sort by creation date, newest first
      backups.sort((a, b) => b.createdAt - a.createdAt);

      return { success: true, backups };
    } catch (error) {
      console.error('Failed to list backups:', error);
      return { success: false, error: 'Yedekler listelenemedi.' };
    }
  }
}

module.exports = BackupService; 