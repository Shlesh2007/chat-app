import { getDB } from '../db/database.js';

/**
 * Delete conversations older than 30 days for users who have auto_delete ON.
 * Runs once on startup and then every 24 hours.
 */
export function startScheduler() {
  const run = () => {
    try {
      const db = getDB();
      // Get all users with auto_delete enabled
      const users = db.prepare(`SELECT id FROM users WHERE auto_delete = 1`).all();

      let total = 0;
      for (const user of users) {
        const result = db.prepare(`
          DELETE FROM conversations
          WHERE user_id = ?
          AND datetime(updated_at) < datetime('now', '-30 days')
        `).run(user.id);
        total += result?.changes || 0;
      }

      if (total > 0) {
        console.log(`🗑️  Auto-delete: removed ${total} old conversation(s)`);
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  };

  // Run immediately on startup
  run();
  // Then every 24 hours
  setInterval(run, 24 * 60 * 60 * 1000);
}
