PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  pass_hash     TEXT NOT NULL,
  pass_salt     TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id            TEXT PRIMARY KEY,
  display_name       TEXT NOT NULL DEFAULT '',
  bio                TEXT NOT NULL DEFAULT '',
  avatar_url         TEXT NOT NULL DEFAULT '',
  background_url     TEXT NOT NULL DEFAULT '',
  accent_color       TEXT NOT NULL DEFAULT '#0b5cff',
  primary_color      TEXT NOT NULL DEFAULT '#0b1b3a',
  secondary_color    TEXT NOT NULL DEFAULT '#071126',
  text_color         TEXT NOT NULL DEFAULT '#eaf0ff',
  card_opacity       REAL NOT NULL DEFAULT 0.78,
  card_blur_px       INTEGER NOT NULL DEFAULT 18,
  effects_json       TEXT NOT NULL DEFAULT '{}',
  updated_at         TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS links (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS page_views (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  ts         TEXT NOT NULL,
  ua         TEXT NOT NULL DEFAULT '',
  device     TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_user_sort ON links(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_views_user_ts ON page_views(user_id, ts);
