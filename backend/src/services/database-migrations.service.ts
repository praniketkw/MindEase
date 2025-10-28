import { DatabaseService } from './database.service';

export interface Migration {
  version: number;
  description: string;
  up: (db: DatabaseService) => void;
  down?: (db: DatabaseService) => void;
}

export class DatabaseMigrationService {
  private db: DatabaseService;
  private migrations: Migration[] = [];

  constructor(db: DatabaseService) {
    this.db = db;
    this.initializeMigrations();
  }

  private initializeMigrations(): void {
    // Migration 1: Initial schema (already handled in DatabaseService)
    this.migrations.push({
      version: 1,
      description: 'Initial schema creation',
      up: () => {
        // Schema is already created in DatabaseService constructor
        console.log('Initial schema already created');
      }
    });

    // Migration 2: Add indexes for performance
    this.migrations.push({
      version: 2,
      description: 'Add performance indexes',
      up: (db) => {
        // Additional indexes for better query performance
        db['db'].exec(`
          CREATE INDEX IF NOT EXISTS idx_conversation_summaries_session_id ON conversation_summaries(session_id);
          CREATE INDEX IF NOT EXISTS idx_journal_entries_mood_score ON journal_entries(mood_score);
          CREATE INDEX IF NOT EXISTS idx_coping_strategies_effectiveness ON coping_strategies(effectiveness_score);
        `);
      }
    });

    // Migration 3: Add full-text search for journal entries
    this.migrations.push({
      version: 3,
      description: 'Add full-text search capabilities',
      up: (db) => {
        db['db'].exec(`
          CREATE VIRTUAL TABLE IF NOT EXISTS journal_search USING fts5(
            entry_id,
            content,
            themes,
            content='journal_entries',
            content_rowid='rowid'
          );
          
          -- Populate the FTS table with existing data
          INSERT OR IGNORE INTO journal_search(entry_id, content, themes)
          SELECT id, '', themes FROM journal_entries;
        `);
      }
    });

    // Migration 4: Add user settings table for advanced preferences
    this.migrations.push({
      version: 4,
      description: 'Add user settings table',
      up: (db) => {
        db['db'].exec(`
          CREATE TABLE IF NOT EXISTS user_settings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            setting_key TEXT NOT NULL,
            setting_value TEXT,
            encrypted BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, setting_key)
          );
          
          CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(setting_key);
        `);
      }
    });
  }

  async runMigrations(): Promise<void> {
    const currentVersion = this.db.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);

    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('Database is up to date');
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations...`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        
        // Run migration in a transaction
        const transaction = this.db.beginTransaction();
        
        try {
          migration.up(this.db);
          this.db.setVersion(migration.version);
          transaction();
          
          console.log(`Migration ${migration.version} completed successfully`);
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error);
          throw error;
        }
      } catch (error) {
        console.error(`Failed to run migration ${migration.version}:`, error);
        throw new Error(`Migration failed at version ${migration.version}: ${error}`);
      }
    }

    console.log('All migrations completed successfully');
  }

  async rollback(targetVersion: number): Promise<void> {
    const currentVersion = this.db.getCurrentVersion();
    
    if (targetVersion >= currentVersion) {
      console.log('Target version is not lower than current version');
      return;
    }

    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // Reverse order for rollback

    console.log(`Rolling back ${migrationsToRollback.length} migrations...`);

    for (const migration of migrationsToRollback) {
      if (!migration.down) {
        throw new Error(`Migration ${migration.version} does not support rollback`);
      }

      try {
        console.log(`Rolling back migration ${migration.version}: ${migration.description}`);
        
        const transaction = this.db.beginTransaction();
        
        try {
          migration.down(this.db);
          this.db.setVersion(migration.version - 1);
          transaction();
          
          console.log(`Migration ${migration.version} rolled back successfully`);
        } catch (error) {
          console.error(`Rollback of migration ${migration.version} failed:`, error);
          throw error;
        }
      } catch (error) {
        console.error(`Failed to rollback migration ${migration.version}:`, error);
        throw new Error(`Rollback failed at version ${migration.version}: ${error}`);
      }
    }

    console.log(`Rollback to version ${targetVersion} completed successfully`);
  }

  getMigrationStatus(): { current: number; latest: number; pending: number } {
    const current = this.db.getCurrentVersion();
    const latest = Math.max(...this.migrations.map(m => m.version));
    const pending = this.migrations.filter(m => m.version > current).length;

    return { current, latest, pending };
  }

  listMigrations(): Migration[] {
    return [...this.migrations];
  }
}