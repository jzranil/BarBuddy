import { serve } from '@hono/node-server';
import { app } from './app';
import { manilaDate } from './lib/competency';
import { isPastRolloutTime, runDailyRollout } from './lib/rollout';
import { paymongoConfigured } from './lib/paymongo';
import { expireStalePayments } from './lib/payments';

const port = 3001;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Daily questions rollout: every day at 7:00 AM Philippine time. Checked once
// a minute; the rollout is idempotent (one set per reviewee per day), so a
// restart after 7:00 AM only releases sets that are still missing.
let lastRolloutDate = '';

async function rolloutTick() {
  const today = manilaDate();
  if (lastRolloutDate === today || !isPastRolloutTime()) return;
  lastRolloutDate = today;
  try {
    await runDailyRollout();
  } catch (error: any) {
    lastRolloutDate = '';
    console.error('Daily rollout failed:', error?.message || error);
  }
}

setInterval(rolloutTick, 60_000);
setTimeout(rolloutTick, 5_000);

// Payment links last 10 minutes: once a minute, close the ones that ran out
// so their PayMongo checkout pages stop accepting payment.
if (paymongoConfigured()) {
  setInterval(() => {
    expireStalePayments().catch((error) => console.error('Payment expiry failed:', error?.message || error));
  }, 60_000);
}
