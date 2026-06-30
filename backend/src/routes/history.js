import { Router } from "express";
import { getDb } from "../db/client.js";

const router = Router();

// ── Analysis History ─────────────────────────────────────────────────────────

router.get("/analysis/:sessionId", async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, date, score, ats_score, jd_count, jd_title, summary, full_analysis
      FROM analysis_history
      WHERE session_id = ${req.params.sessionId}
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return res.json({ history: rows });
  } catch (err) {
    console.error("history get error:", err);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.post("/analysis", async (req, res) => {
  try {
    const sql = getDb();
    const { sessionId, entry } = req.body;
    await sql`
      INSERT INTO analysis_history (id, session_id, date, score, ats_score, jd_count, jd_title, summary, full_analysis)
      VALUES (${entry.id}, ${sessionId}, ${entry.date}, ${entry.score}, ${entry.ats_score},
              ${entry.jd_count}, ${entry.jd_title}, ${entry.summary}, ${JSON.stringify(entry.full_analysis ?? null)})
      ON CONFLICT (id) DO NOTHING
    `;
    return res.json({ ok: true });
  } catch (err) {
    console.error("history save error:", err);
    return res.status(500).json({ error: "Failed to save history" });
  }
});

router.delete("/analysis/:sessionId", async (req, res) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM analysis_history WHERE session_id = ${req.params.sessionId}`;
    return res.json({ ok: true });
  } catch (err) {
    console.error("history delete error:", err);
    return res.status(500).json({ error: "Failed to clear history" });
  }
});

// ── CV History ───────────────────────────────────────────────────────────────

router.get("/cv/:sessionId", async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, timestamp, name, template, page_mode, form_data
      FROM cv_history
      WHERE session_id = ${req.params.sessionId}
      ORDER BY timestamp DESC
      LIMIT 20
    `;
    const history = rows.map((r) => ({
      id: r.id,
      timestamp: Number(r.timestamp),
      name: r.name,
      template: r.template,
      pageMode: r.page_mode,
      formData: r.form_data,
    }));
    return res.json({ history });
  } catch (err) {
    console.error("cv history get error:", err);
    return res.status(500).json({ error: "Failed to fetch CV history" });
  }
});

router.post("/cv", async (req, res) => {
  try {
    const sql = getDb();
    const { sessionId, entry } = req.body;
    await sql`
      INSERT INTO cv_history (id, session_id, timestamp, name, template, page_mode, form_data)
      VALUES (${entry.id}, ${sessionId}, ${entry.timestamp}, ${entry.name},
              ${entry.template}, ${entry.pageMode}, ${JSON.stringify(entry.formData)})
      ON CONFLICT (id) DO NOTHING
    `;
    return res.json({ ok: true });
  } catch (err) {
    console.error("cv history save error:", err);
    return res.status(500).json({ error: "Failed to save CV history" });
  }
});

router.delete("/cv/:sessionId/:id", async (req, res) => {
  try {
    const sql = getDb();
    await sql`
      DELETE FROM cv_history
      WHERE id = ${req.params.id} AND session_id = ${req.params.sessionId}
    `;
    return res.json({ ok: true });
  } catch (err) {
    console.error("cv history delete error:", err);
    return res.status(500).json({ error: "Failed to delete CV" });
  }
});

router.delete("/cv/:sessionId", async (req, res) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM cv_history WHERE session_id = ${req.params.sessionId}`;
    return res.json({ ok: true });
  } catch (err) {
    console.error("cv history clear error:", err);
    return res.status(500).json({ error: "Failed to clear CV history" });
  }
});

export default router;
