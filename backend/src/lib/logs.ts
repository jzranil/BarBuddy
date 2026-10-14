
import { supabaseAdmin } from './supabase';

// Writes an audit entry to bb_logs_tbl (shown in the Super Admin System Logs).
// Never throws: logging must not break the action being logged.
export async function logEvent(
  userId: string | null,
  service: string,
  description: string,
  level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
) {
  try {
    await supabaseAdmin.from('bb_logs_tbl').insert({
      user_id: userId,
      log_level: level,
      log_proc_service: service,
      log_proc_desc: description.slice(0, 1000),
      log_trace_id: crypto.randomUUID(),
      is_archived: false,
    });
  } catch (error) {
    console.error('Failed to write log entry:', error);
  }
}
