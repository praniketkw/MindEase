import path from 'path';
import { DatabaseService, DatabaseConfig } from './database.service';
import { DatabaseMigrationService } from './database-migrations.service';

export class DatabaseFactory {
  private static instance: DatabaseService | null = null;
  private static migrationService: DatabaseMigrationService | null = null;

  static async createDatabase(config?: Partial<DatabaseConfig>): Promise<DatabaseService> {
    if (this.instance) {
      return this.instance;
    }

    const defaultConfig: DatabaseConfig = {
      dbPath: this.getDefaultDatabasePath(),
      enableWAL: true,
      timeout: 5000,
      encryptionKey: process.env.DB_ENCRYPTION_KEY
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Create database instance
    this.instance = new DatabaseService(finalConfig);

    // Run migrations
    this.migrationService = new DatabaseMigrationService(this.instance);
    await this.migrationService.runMigrations();

    console.log('Database initialized successfully');
    return this.instance;
  }

  static getInstance(): DatabaseService {
    if (!this.instance) {
      throw new Error('Database not initialized. Call createDatabase() first.');
    }
    return this.instance;
  }

  static getMigrationService(): DatabaseMigrationService {
    if (!this.migrationService) {
      throw new Error('Migration service not initialized. Call createDatabase() first.');
    }
    return this.migrationService;
  }

  static async closeDatabase(): Promise<void> {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
      this.migrationService = null;
      console.log('Database connection closed');
    }
  }

  private static getDefaultDatabasePath(): string {
    const env = process.env.NODE_ENV || 'development';
    const dbDir = path.join(process.cwd(), 'data');
    
    switch (env) {
      case 'production':
        return path.join(dbDir, 'mindease.db');
      case 'test':
        return path.join(dbDir, 'mindease-test.db');
      default:
        return path.join(dbDir, 'mindease-dev.db');
    }
  }

  // Utility methods for testing and development
  static async createTestDatabase(): Promise<DatabaseService> {
    const testConfig: DatabaseConfig = {
      dbPath: ':memory:', // In-memory database for testing
      enableWAL: false,
      timeout: 1000
    };

    const db = new DatabaseService(testConfig);
    const migrationService = new DatabaseMigrationService(db);
    await migrationService.runMigrations();

    return db;
  }

  static async backupDatabase(backupPath?: string): Promise<string> {
    const db = this.getInstance();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultBackupPath = path.join(
      process.cwd(), 
      'backups', 
      `mindease-backup-${timestamp}.db`
    );
    
    const finalBackupPath = backupPath || defaultBackupPath;
    
    // Ensure backup directory exists
    const backupDir = path.dirname(finalBackupPath);
    const fs = require('fs');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    db.backup(finalBackupPath);
    console.log(`Database backed up to: ${finalBackupPath}`);
    
    return finalBackupPath;
  }

  static getDatabaseInfo(): {
    path: string;
    version: number;
    migrationStatus: { current: number; latest: number; pending: number };
  } {
    const db = this.getInstance();
    const migrationService = this.getMigrationService();
    
    return {
      path: this.getDefaultDatabasePath(),
      version: db.getCurrentVersion(),
      migrationStatus: migrationService.getMigrationStatus()
    };
  }
}