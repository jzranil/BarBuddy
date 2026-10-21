import { handle } from 'hono/aws-lambda';
import { app } from './app';
import { runDailyRollout } from './lib/rollout';
import { expireStalePayments } from './lib/payments';

const http = handle(app);

// API Gateway requests go to Hono. EventBridge schedule rules:
//   cron(0 23 * * ? *) = 7:00 AM Asia/Manila → daily questions rollout
//   rate(1 minute) with constant input {"task":"expire-payments"} → closes
//   payment links whose 10 minutes are up
export const handler = async (event: any, context: any) => {
  if (event?.task === 'expire-payments') {
    return { expired: await expireStalePayments() };
  }
  if (event?.source === 'aws.events' || event?.['detail-type'] === 'Scheduled Event') {
    return runDailyRollout();
  }
  return http(event, context);
};
