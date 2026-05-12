// Kills processes on ports 3001 and 5173/5174 before starting dev servers
import { execSync } from 'child_process';

const ports = [3001, 5173, 5174];

for (const port of ports) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = result.trim().split('\n');
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`✅ Freed port ${port} (killed PID ${pid})`);
      } catch {}
    }
  } catch {
    // Port not in use — that's fine
  }
}
