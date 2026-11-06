import { handle } from 'hono/aws-lambda';
import { app } from './app';
import { runDailyRollout } from './lib/rollout';
import { expireStalePayments } from './lib/payments';
import { runPendingAiComparisons } from './lib/gemini';

const http = handle(app);

// Room left after the last essay is taken for one Gemini call (60 s timeout)
// and its database writes, so a run never hits the Lambda timeout mid-essay
const AI_RUN_MARGIN_MS = 75_000;

// API Gateway requests go to Hono. EventBridge schedule rules:
//   cron(0 23 * * ? *) = 7:00 AM Asia/Manila → daily questions rollout
//   rate(1 minute) with constant input {"task":"expire-payments"} → closes
//   payment links whose 10 minutes are up
//   rate(1 minute) with constant input {"task":"ai-comparisons"} → scores
//   submitted essays waiting for an AI review (set the timeout to 5 minutes)
export const handler = async (event: any, context: any) => {
  if (event?.task === 'expire-payments') {
    return { expired: await expireStalePayments() };
  }
  if (event?.task === 'ai-comparisons') {
    return runPendingAiComparisons(Date.now() + context.getRemainingTimeInMillis() - AI_RUN_MARGIN_MS);
  }
  if (event?.source === 'aws.events' || event?.['detail-type'] === 'Scheduled Event') {
    return runDailyRollout();
  }
  return http(event, context);
};
