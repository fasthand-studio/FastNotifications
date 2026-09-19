import { Env } from "../types";

export const DatabaseService = {
  async createUser(env: Env, email: string): Promise<string> {
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO users (id, email) VALUES (?, ?)").bind(id, email).run();
    return id;
  },

  async getUserByEmail(env: Env, email: string): Promise<{ id: string } | null> {
    return await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: string }>();
  },

  async registerDevice(env: Env, userId: string, deviceId: string, platform: string): Promise<void> {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO devices (id, user_id, device_id, platform, connected) VALUES ((SELECT id FROM devices WHERE user_id = ? AND device_id = ?), ?, ?, ?, 0)"
    )
      .bind(userId, deviceId, userId, deviceId, platform)
      .run();
  },

  async deleteDevice(env: Env, userId: string, deviceId: string): Promise<void> {
    await env.DB.prepare("DELETE FROM devices WHERE user_id = ? AND device_id = ?").bind(userId, deviceId).run();
  },

  async isDeviceRegistered(env: Env, userId: string, deviceId: string): Promise<boolean> {
    const res = await env.DB.prepare("SELECT id FROM devices WHERE user_id = ? AND device_id = ?").bind(userId, deviceId).first();
    return !!res;
  },

  async storeNotification(
    env: Env,
    userId: string,
    title: string,
    body: string,
    data: Record<string, any>
  ): Promise<string> {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO notifications (id, user_id, title, body, data, status) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(id, userId, title, body, JSON.stringify(data), "pending")
      .run();
    return id;
  },

  async getPendingNotifications(env: Env, userId: string): Promise<any[]> {
    const res = await env.DB.prepare("SELECT * FROM notifications WHERE user_id = ? AND status = 'pending'")
      .bind(userId)
      .all();
    return res.results || [];
  },

  async acknowledgeNotification(env: Env, notificationId: string): Promise<void> {
    // Delete the notification from D1 once acknowledged/ended to prevent accumulation
    await env.DB.prepare("DELETE FROM notifications WHERE id = ?").bind(notificationId).run();
  }
};
