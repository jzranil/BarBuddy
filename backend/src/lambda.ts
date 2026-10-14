import { handle } from 'hono/aws-lambda';
import { app } from './app';
import { runDailyRollout } from './lib/rollout';

const http = handle(app);

// API Gateway requests go to Hono. An EventBridge schedule rule
// (cron(0 23 * * ? *) = 7:00 AM Asia/Manila) runs the daily questions rollout.
export const handler = async (event: any, context: any) => {
  if (event?.source === 'aws.events' || event?.['detail-type'] === 'Scheduled Event') {
    return runDailyRollout();
  }
  return http(event, context);
};
