import app from "./app.js";
import { initDb } from "./db/client.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`CareerLens backend running on http://localhost:${PORT}`);
  if (process.env.DATABASE_URL) {
    try { await initDb(); } catch (err) { console.error("DB init failed:", err.message); }
  } else {
    console.warn("DATABASE_URL not set — DB features disabled");
  }
});
