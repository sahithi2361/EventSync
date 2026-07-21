import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export async function pushNotification(
  user_id: string,
  data: { title: string; message?: string; type?: Notification['type']; link?: string },
) {
  try {
    await supabase.from('notifications').insert({
      user_id,
      title: data.title,
      message: data.message ?? null,
      type: data.type ?? 'info',
      link: data.link ?? null,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('notification insert failed', e);
  }
}

export async function logActivity(
  user_id: string | undefined | null,
  action: string,
  entity?: string,
  entity_id?: string,
  meta?: Record<string, unknown>,
) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: user_id ?? null,
      action,
      entity: entity ?? null,
      entity_id: entity_id ?? null,
      meta: meta ?? null,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('activity log failed', e);
  }
}
