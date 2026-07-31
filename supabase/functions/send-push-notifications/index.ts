/* global Deno */

import { createClient } from 'npm:@supabase/supabase-js@2.106.2';
import webpush from 'npm:web-push@3.6.7';

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
};

type PushSubscriptionRow = {
  id: string;
  teacher_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NotificationPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
};

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const webhookSecret = requiredSecret('PUSH_WEBHOOK_SECRET');

  if (request.headers.get('x-webhook-secret') !== webhookSecret) {
    return jsonResponse({ error: 'Unauthorized webhook.' }, 401);
  }

  try {
    const webhook = (await request.json()) as WebhookPayload;
    const notification = buildNotification(webhook);

    if (!notification || webhook.type !== 'INSERT') {
      return jsonResponse({ sent: 0, ignored: true });
    }

    const supabase = createClient(
      requiredSecret('SUPABASE_URL'),
      requiredSecret('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const actorTeacherId = getActorTeacherId(webhook);
    let query = supabase
      .from('push_subscriptions')
      .select('id,teacher_id,endpoint,p256dh,auth');

    if (actorTeacherId) {
      query = query.neq('teacher_id', actorTeacherId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const subscriptions = (data ?? []) as PushSubscriptionRow[];
    webpush.setVapidDetails(
      requiredSecret('VAPID_SUBJECT'),
      requiredSecret('VAPID_PUBLIC_KEY'),
      requiredSecret('VAPID_PRIVATE_KEY'),
    );

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify(notification),
            { TTL: 60 * 60 * 24, urgency: 'normal' },
          );
          return { status: 'sent' as const };
        } catch (sendError) {
          if (isExpiredSubscription(sendError)) {
            await supabase.from('push_subscriptions').delete().eq('id', subscription.id);
            return { status: 'removed' as const };
          }

          throw sendError;
        }
      }),
    );

    const sent = results.filter(
      (result) => result.status === 'fulfilled' && result.value.status === 'sent',
    ).length;
    const removed = results.filter(
      (result) => result.status === 'fulfilled' && result.value.status === 'removed',
    ).length;
    const failed = results.filter((result) => result.status === 'rejected').length;

    return jsonResponse({ sent, removed, failed });
  } catch (error) {
    console.error('Push notification delivery failed.', error);
    return jsonResponse({ error: 'Push notification delivery failed.' }, 500);
  }
});

function buildNotification(webhook: WebhookPayload): NotificationPayload | null {
  const record = webhook.record;

  if (!record) {
    return null;
  }

  if (webhook.table === 'forum_messages') {
    const authorName = stringValue(record.author_name) || 'Un professeur';
    const message = truncate(stringValue(record.message), 180);
    const id = stringValue(record.id) || crypto.randomUUID();

    return {
      title: 'Nouveau message du Forum',
      body: `${authorName} : ${message}`,
      tag: `forum-${id}`,
      url: '/?view=forum',
    };
  }

  if (webhook.table === 'change_log_entries') {
    const description = truncate(stringValue(record.description), 200);
    const id = stringValue(record.id) || crypto.randomUUID();

    return {
      title: 'Modification du planning',
      body: description || 'Une nouvelle modification a été enregistrée.',
      tag: `change-${id}`,
      url: '/?view=changes',
    };
  }

  return null;
}

function getActorTeacherId(webhook: WebhookPayload) {
  if (!webhook.record) {
    return undefined;
  }

  const field = webhook.table === 'forum_messages' ? 'teacher_id' : 'actor_teacher_id';
  return stringValue(webhook.record[field]) || undefined;
}

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Missing required Edge Function secret: ${name}`);
  }

  return value;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function isExpiredSubscription(error: unknown) {
  if (!error || typeof error !== 'object' || !('statusCode' in error)) {
    return false;
  }

  const statusCode = Reflect.get(error, 'statusCode');
  return statusCode === 404 || statusCode === 410;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}
