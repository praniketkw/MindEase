import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export interface DatabaseConfig {
  dbPath: string;
  encryptionKey?: string;
  enableWAL?: boolean;
  timeout?: number;
}

export class DatabaseService {
  private db: Database.Database;
  private encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(config: DatabaseConfig) {
    // Ensure database directory exists
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(config.dbPath, {
      timeout: config.timeout || 5000,
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    });

    // Set encryption key
    this.encryptionKey = config.encryptionKey || this.generateEncryptionKey();

    // Configure database settings
    if (config.enableWAL !== false) {
      this.db.pragma('journal_mode = WAL');
    }
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000');
    this.db.pragma('temp_store = memory');

    // Initialize schema
    this.initializeSchema();
  }

  // Encryption methods
  encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('mindease-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText;
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('mindease-data'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText; // Return original if decryption fails
    }
  }

  // Database schema initialization
  private initializeSchema(): void {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        preferences TEXT, -- JSON encrypted
        emotional_baseline TEXT, -- JSON encrypted
        encryption_key TEXT,
        last_interaction DATETIME,
        UNIQUE(id)
      )
    `);

    // Conversation summaries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_summaries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        emotional_tone TEXT,
        key_themes TEXT, -- JSON array
        mood_score INTEGER CHECK(mood_score >= 1 AND mood_score <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Journal entries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        encrypted_content TEXT NOT NULL,
        content_type TEXT CHECK(content_type IN ('text', 'voice')) NOT NULL,
        timestamp DATETIME NOT NULL,
        emotional_analysis TEXT, -- JSON
        themes TEXT, -- JSON array
        mood_score INTEGER CHECK(mood_score >= 1 AND mood_score <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Coping strategies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS coping_strategies (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        strategy_name TEXT NOT NULL,
        original_strategy_id TEXT,
        effectiveness_score REAL DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        last_used DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check-in sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS check_in_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        mood INTEGER DEFAULT 3,
        stress_level INTEGER DEFAULT 2,
        emotional_state TEXT, -- JSON
        completed BOOLEAN DEFAULT FALSE,
        triggered_by TEXT NOT NULL,
        concerning_patterns TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check-in responses table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS check_in_responses (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        emotional_analysis TEXT, -- JSON
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES check_in_sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON conversation_summaries(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_summaries_timestamp ON conversation_summaries(timestamp);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_timestamp ON journal_entries(timestamp);
      CREATE INDEX IF NOT EXISTS idx_coping_strategies_user_id ON coping_strategies(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_last_interaction ON users(last_interaction);
      CREATE INDEX IF NOT EXISTS idx_check_in_sessions_user_id ON check_in_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_check_in_sessions_timestamp ON check_in_sessions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_check_in_responses_session_id ON check_in_responses(session_id);
    `);
  }

  // User operations
  createUser(userData: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, preferences, emotional_baseline, encryption_key, last_interaction)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      userData.id,
      this.encrypt(userData.preferences),
      this.encrypt(userData.emotional_baseline),
      userData.encryption_key,
      userData.last_interaction
    );
  }

  getUser(userId: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(userId);
    
    if (!row) return null;
    
    return {
      ...row,
      preferences: this.decrypt(row.preferences),
      emotional_baseline: this.decrypt(row.emotional_baseline)
    };
  }

  updateUser(userId: string, userData: any): void {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET preferences = ?, emotional_baseline = ?, last_interaction = ?
      WHERE id = ?
    `);
    
    stmt.run(
      this.encrypt(userData.preferences),
      this.encrypt(userData.emotional_baseline),
      userData.last_interaction,
      userId
    );
  }

  deleteUser(userId: string): void {
    // This will cascade delete all related data
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);
  }

  // Conversation operations
  saveConversationSummary(summary: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO conversation_summaries 
      (id, user_id, session_id, timestamp, emotional_tone, key_themes, mood_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      summary.id,
      summary.user_id,
      summary.session_id,
      summary.timestamp,
      summary.emotional_tone,
      summary.key_themes,
      summary.mood_score
    );
  }

  getRecentConversations(userId: string, limit: number = 5): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM conversation_summaries 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(userId, limit);
  }

  // Journal operations
  saveJournalEntry(entry: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO journal_entries 
      (id, user_id, encrypted_content, content_type, timestamp, emotional_analysis, themes, mood_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      entry.id,
      entry.user_id,
      this.encrypt(entry.content),
      entry.content_type,
      entry.timestamp,
      entry.emotional_analysis,
      entry.themes,
      entry.mood_score
    );
  }

  getJournalEntries(userId: string, limit?: number): any[] {
    let query = `
      SELECT id, user_id, content_type, timestamp, emotional_analysis, themes, mood_score, created_at
      FROM journal_entries 
      WHERE user_id = ? 
      ORDER BY timestamp DESC
    `;
    
    if (limit) {
      query += ` LIMIT ?`;
    }
    
    const stmt = this.db.prepare(query);
    const params = limit ? [userId, limit] : [userId];
    
    return stmt.all(...params);
  }

  getJournalEntry(entryId: string): any | null {
    const stmt = this.db.prepare(`
      SELECT * FROM journal_entries WHERE id = ?
    `);
    
    const row = stmt.get(entryId);
    if (!row) return null;
    
    return {
      ...row,
      content: this.decrypt(row.encrypted_content)
    };
  }

  // Coping strategy operations
  saveCopingStrategy(strategy: any): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO coping_strategies 
      (id, user_id, strategy_name, original_strategy_id, effectiveness_score, usage_count, last_used)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      strategy.id,
      strategy.user_id,
      strategy.strategy_name,
      strategy.original_strategy_id,
      strategy.effectiveness_score,
      strategy.usage_count,
      strategy.last_used
    );
  }

  getCopingStrategies(userId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM coping_strategies 
      WHERE user_id = ? 
      ORDER BY effectiveness_score DESC, usage_count DESC
    `);
    
    return stmt.all(userId);
  }

  // Check-in session operations
  saveCheckInSession(session: any): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO check_in_sessions 
      (id, user_id, timestamp, mood, stress_level, emotional_state, completed, triggered_by, concerning_patterns)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      session.id,
      session.user_id,
      session.timestamp,
      session.mood,
      session.stress_level,
      JSON.stringify(session.emotional_state),
      session.completed,
      session.triggered_by,
      session.concerning_patterns ? JSON.stringify(session.concerning_patterns) : null
    );
  }

  getCheckInSession(sessionId: string): any {
    const stmt = this.db.prepare(`
      SELECT * FROM check_in_sessions WHERE id = ?
    `);
    
    const row = stmt.get(sessionId);
    if (!row) return null;

    return {
      ...row,
      emotional_state: JSON.parse(row.emotional_state),
      concerning_patterns: row.concerning_patterns ? JSON.parse(row.concerning_patterns) : null
    };
  }

  getUserCheckInSessions(userId: string, limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM check_in_sessions 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(userId, limit).map(row => ({
      ...row,
      emotional_state: JSON.parse(row.emotional_state),
      concerning_patterns: row.concerning_patterns ? JSON.parse(row.concerning_patterns) : null
    }));
  }

  saveCheckInResponse(response: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO check_in_responses 
      (id, session_id, question, answer, emotional_analysis, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      response.id,
      response.session_id,
      response.question,
      response.answer,
      response.emotional_analysis ? JSON.stringify(response.emotional_analysis) : null,
      response.timestamp
    );
  }

  getCheckInResponses(sessionId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM check_in_responses 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `);
    
    return stmt.all(sessionId).map(row => ({
      ...row,
      emotional_analysis: row.emotional_analysis ? JSON.parse(row.emotional_analysis) : null
    }));
  }

  getLastCheckInDate(userId: string): Date | null {
    const stmt = this.db.prepare(`
      SELECT MAX(timestamp) as last_check_in 
      FROM check_in_sessions 
      WHERE user_id = ? AND completed = TRUE
    `);
    
    const result = stmt.get(userId);
    return result?.last_check_in ? new Date(result.last_check_in) : null;
  }

  // Utility methods
  beginTransaction(): Database.Transaction {
    return this.db.transaction(() => {});
  }

  backup(backupPath: string): void {
    this.db.backup(backupPath);
  }

  close(): void {
    this.db.close();
  }

  // Migration support
  getCurrentVersion(): number {
    try {
      const stmt = this.db.prepare('PRAGMA user_version');
      const result = stmt.get() as { user_version: number };
      return result.user_version;
    } catch {
      return 0;
    }
  }

  setVersion(version: number): void {
    this.db.pragma(`user_version = ${version}`);
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}