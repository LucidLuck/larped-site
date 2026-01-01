PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY,
  display_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  location TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  accent TEXT DEFAULT 'yellow',
  bg_mode TEXT DEFAULT 'gradient',
  bg_value TEXT DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
