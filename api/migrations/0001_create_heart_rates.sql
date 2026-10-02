-- measured_at を主キーにして，再送時の重複挿入を INSERT OR IGNORE で無視できるようにする
CREATE TABLE heart_rates (
  measured_at INTEGER PRIMARY KEY,
  bpm REAL NOT NULL
);
