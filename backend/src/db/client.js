import { neon } from "@neondatabase/serverless";
import "dotenv/config";

let sql;

export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS analysis_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      date TEXT NOT NULL,
      score INTEGER NOT NULL,
      ats_score INTEGER NOT NULL,
      jd_count INTEGER NOT NULL,
      jd_title TEXT NOT NULL,
      summary TEXT NOT NULL,
      full_analysis JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_analysis_session ON analysis_history(session_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cv_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      timestamp BIGINT NOT NULL,
      name TEXT NOT NULL,
      template TEXT NOT NULL,
      page_mode TEXT NOT NULL,
      form_data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_cv_session ON cv_history(session_id)
  `;

  console.log("Database tables initialized");
}
