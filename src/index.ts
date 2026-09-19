import { Router } from "itty-router";
import { Env } from "./types";
import { NotificationCoordinator } from "./durable_objects/NotificationCoordinator";
import { DatabaseService } from "./services/databaseService";
import { validateApiKey } from "./auth/apiKey";
import { checkRateLimit } from "./middleware/rateLimiter";
import { docsHtml } from "./docs";

export { NotificationCoordinator };

const router = Router();

// Docs
router.get("/", () => new Response(docsHtml, { headers: { "Content-Type": "text/html" } }));
router.get("/docs", () => new Response(docsHtml, { headers: { "Content-Type": "text/html" } }));

// Routes
router.get("/v1/health", () => new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
  headers: { "Content-Type": "application/json" }
}));

// POST /v1/push
router.post("/v1/push", async (request, env: Env) => {
  if (!validateApiKey(request.headers.get("Authorization"), env.API_KEY)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json() as any;
  if (!body.email || !body.title || !body.body) {
    return new Response(JSON.stringify({ error: "Missing required fields (email, title, body)" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Basic Validation
  if (typeof body.email !== 'string' || !body.email.includes('@') || body.email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (body.title.length > 200 || body.body.length > 2000) {
      return new Response(JSON.stringify({ error: "Title or body too long" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  let user = await DatabaseService.getUserByEmail(env, body.email);
  if (!user) {
    // Auto-create user if they do not exist
    const newUserId = await DatabaseService.createUser(env, body.email);
    user = { id: newUserId };
  }

  const nId = await DatabaseService.storeNotification(env, user.id, body.title, body.body, body.data || {});

  // Trigger DO push
  let delivered = false;
  try {
    const doId = env.NOTIFICATION_COORDINATOR.idFromName(user.id);
    const obj = env.NOTIFICATION_COORDINATOR.get(doId);
    const doResp = await obj.fetch(new Request("https://internal/internal/push", {
      method: "POST",
      body: JSON.stringify({ userId: user.id, notificationId: nId, title: body.title, body: body.body, data: body.data || {} })
    }));
    const doResult = await doResp.json() as any;
    delivered = doResult.delivered === true;
  } catch (e) {
    console.error("Durable Object push error:", e);
  }

  return new Response(JSON.stringify({
    success: true,
    status: delivered ? "delivered" : "queued",
    notificationId: nId
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});

// POST /v1/devices/register
router.post("/v1/devices/register", async (request, env: Env) => {
  const { email, deviceId, platform } = await request.json() as any;
  if (!email || !deviceId) {
    return new Response(JSON.stringify({ error: "Missing email or deviceId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Basic Validation
  if (typeof email !== 'string' || !email.includes('@') || email.length > 255) {
    return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (typeof deviceId !== 'string' || deviceId.length > 100) {
    return new Response(JSON.stringify({ error: "Invalid deviceId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  let user = await DatabaseService.getUserByEmail(env, email);
  if (!user) {
    const newUserId = await DatabaseService.createUser(env, email);
    user = { id: newUserId };
  }

  await DatabaseService.registerDevice(env, user.id, deviceId, platform || "android");
  return new Response(JSON.stringify({ success: true, userId: user.id }), {
    headers: { "Content-Type": "application/json" }
  });
});

// DELETE /v1/devices/:deviceId
router.delete("/v1/devices/:deviceId", async (request, env: Env) => {
  const deviceId = request.params.deviceId;
  const email = request.headers.get("X-User-Email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Missing X-User-Email header" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const user = await DatabaseService.getUserByEmail(env, email);
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  await DatabaseService.deleteDevice(env, user.id, deviceId);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

// GET /v1/notifications/pending
router.get("/v1/notifications/pending", async (request, env: Env) => {
  const email = request.headers.get("X-User-Email");
  if (!email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const user = await DatabaseService.getUserByEmail(env, email);
  if (!user) {
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }

  const notifications = await DatabaseService.getPendingNotifications(env, user.id);
  return new Response(JSON.stringify(notifications), { headers: { "Content-Type": "application/json" } });
});

// POST /v1/notifications/:id/ack
router.post("/v1/notifications/:id/ack", async (request, env: Env) => {
  const id = request.params.id;
  await DatabaseService.acknowledgeNotification(env, id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});

// GET /v1/ws
router.get("/v1/ws", async (request, env: Env) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const deviceId = url.searchParams.get("deviceId");

  if (!userId || !deviceId) {
    return new Response("Missing userId or deviceId", { status: 400 });
  }

  // Security Layer: Verify device is registered before upgrading WebSocket
  const deviceRegistered = await DatabaseService.isDeviceRegistered(env, userId, deviceId);
  if (!deviceRegistered) {
      return new Response("Unauthorized: Device not registered for this user", { status: 401 });
  }

  const doId = env.NOTIFICATION_COORDINATOR.idFromName(userId);
  return env.NOTIFICATION_COORDINATOR.get(doId).fetch(request);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.fetch(request, env, ctx);
      return response || new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },

  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      console.log("Processing async queue notification:", message.body);
    }
  }
};
