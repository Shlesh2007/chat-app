import { getDB } from '../db/database.js';

export function startScheduler() {
  const run = async () => {
    try {
      const db = getDB();
      const users = await db.execute({ sql: 'SELECT id FROM users WHERE auto_delete=1', args: [] });
      let total = 0;
      for (const user of users.rows) {
        const result = await db.execute({
          sql: "DELETE FROM conversations WHERE user_id=? AND datetime(updated_at) < datetime('now','-30 days')",
          args: [user.id]
        });
        total += result.rowsAffected || 0;
      }
      if (total > 0) console.log(`🗑️ Auto-deleted ${total} old conversation(s)`);
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  };

  run();
  setInterval(run, 24 * 60 * 60 * 1000);
}
