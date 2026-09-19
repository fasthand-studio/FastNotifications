export interface Env {
  DB: D1Database;
  NOTIFICATION_COORDINATOR: DurableObjectNamespace;
  NOTIFICATION_QUEUE: Queue<NotificationPayload>;
  API_KEY: string;
  JWT_SECRET: string;
}

export interface NotificationPayload {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_id: string;
  platform: string;
  connected: boolean;
}
