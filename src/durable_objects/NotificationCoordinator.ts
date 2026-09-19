import { Env } from "../types";

export class NotificationCoordinator {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint for Android client to connect via WebSocket
    if (url.pathname === "/v1/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }

      const userId = url.searchParams.get("userId");
      const deviceId = url.searchParams.get("deviceId");
      if (!userId || !deviceId) {
        return new Response("Forbidden: Missing credentials", { status: 403 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Using the Hibernation API
      this.state.acceptWebSocket(server);
      server.serializeAttachment({ userId, deviceId });

      // Notify that device is connected in D1
      await this.updateDeviceConnection(userId, deviceId, true);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // INTERNAL: Webhook for Worker to push notification to DO
    if (url.pathname === "/internal/push") {
      const payload = await request.json() as any;
      const { userId, ...notification } = payload;

      const webSockets = this.state.getWebSockets();
      let delivered = false;

      const pushMessage = {
        type: "push",
        id: notification.notificationId || notification.id,
        notificationId: notification.notificationId || notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        timestamp: Date.now()
      };

      for (const ws of webSockets) {
        const attachment = ws.deserializeAttachment() as { userId: string, deviceId: string };
        if (attachment.userId === userId) {
          try {
            ws.send(JSON.stringify(pushMessage));
            delivered = true;
          } catch (e) {
            console.error("Error sending WebSocket message:", e);
          }
        }
      }
      return new Response(JSON.stringify({ delivered }), { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
      if (data.type === "ack" && data.notificationId) {
        // Mark notification as acknowledged in D1
        await this.env.DB.prepare(
          "UPDATE notifications SET status = 'delivered', acknowledged_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(data.notificationId).run();
      }
    } catch (e) {
      console.error("WebSocket message parsing error:", e);
    }
  }

  async webSocketClose(ws: WebSocket | null, code: number, reason: string, wasClean: boolean) {
    const attachment = ws?.deserializeAttachment() as { userId: string, deviceId: string };
    if (attachment) {
      await this.updateDeviceConnection(attachment.userId, attachment.deviceId, false);
    }
  }

  async webSocketError(ws: WebSocket, error: any) {
    await this.webSocketClose(ws, 1006, "Error", false);
  }

  private async updateDeviceConnection(userId: string, deviceId: string, connected: boolean) {
    try {
      await this.env.DB.prepare(
        "UPDATE devices SET connected = ?, last_seen = CURRENT_TIMESTAMP WHERE user_id = ? AND device_id = ?"
      )
        .bind(connected ? 1 : 0, userId, deviceId)
        .run();
    } catch (e) {
      console.error("D1 update error:", e);
    }
  }
}
