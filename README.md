# Fast Notifications by FastHand Studio

A production-ready, FCM-independent real-time push notification backend service powered by **Cloudflare Workers**, **Durable Objects (WebSocket Hibernation)**, and **D1 Database**.

---

## 🚀 Key Features & Architecture

Fast Notifications provides a reliable, self-hosted push architecture designed for high delivery guarantees without third-party push dependencies like Google Firebase Cloud Messaging (FCM).

* **⚡ Instant Online Delivery (WebSocket Hibernation):** Connected client devices receive instant pushes directly via persistent WebSocket connections managed by per-user `NotificationCoordinator` Durable Objects.
* **📦 Resilient Offline Queuing (D1 Database):** When a device is offline or unreachable, incoming notifications are stored in Cloudflare D1 with status `pending`.
* **🔄 Instant Offline-to-Online Reconciliation:** When a device reconnects to the WebSocket, all pending messages are instantly retrieved and delivered.
* **🧹 Zero Storage Bloat (Auto-cleanup on ACK):** Once the client displays the notification and sends an acknowledgment (`POST /v1/notifications/:id/ack`), the record is permanently deleted from D1.
* **🔒 Built-in Security & Device Binding:** WebSocket connections are strictly verified against registered devices (`isDeviceRegistered`), preventing unauthorized connection hijacking.

---

## 🛠️ Quick Setup & Deployment

### 1. One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/fasthand-studio/FastNotifications)

---

### 2. Manual CLI Setup

#### Prerequisites
- Node.js 18+ & npm
- Cloudflare account with Workers and D1 enabled

#### Step-by-Step Instructions

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/fasthand-studio/FastNotifications.git
   cd FastNotifications
   npm install
   ```

2. **Create the Cloudflare D1 Database:**
   ```bash
   npx wrangler d1 create notifications-db
   ```
   *Copy the output `database_id` into your `wrangler.toml` file under `[[d1_databases]]`.*

3. **Apply Database Migrations:**
   ```bash
   # For local development:
   npx wrangler d1 migrations apply notifications-db --local

   # For production:
   npx wrangler d1 migrations apply notifications-db --remote
   ```

4. **Set your Backend API Key Secret:**
   ```bash
   npx wrangler secret put API_KEY
   # Enter your secure API secret key when prompted
   ```

5. **Deploy the Worker:**
   ```bash
   npm run deploy
   ```

---

## 📖 API Reference

### Authentication
Server-to-server push requests require an API key passed in the `Authorization` header:
```http
Authorization: Bearer <YOUR_API_KEY>
```

---

### 1. Health Check
Checks edge worker status and timestamp.

* **Endpoint:** `GET /v1/health`
* **Auth Required:** No

#### Example Request
```bash
curl -X GET https://fastnotifications.fasthand.workers.dev/v1/health
```

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "timestamp": 1726756800000
}
```

---

### 2. Register Device
Registers a client hardware or app instance and binds it to a user email address.

* **Endpoint:** `POST /v1/devices/register`
* **Auth Required:** No

#### Request Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `String` | Yes | Recipient user email (e.g. `seller@fasthandbd.com`) |
| `deviceId` | `String` | Yes | Unique hardware or installation UUID |
| `platform` | `String` | No | Target platform (`android`, `ios`, `web`; default: `android`) |

#### Example Request
```bash
curl -X POST https://fastnotifications.fasthand.workers.dev/v1/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@fasthandbd.com",
    "deviceId": "and-dev-948210",
    "platform": "android"
  }'
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "userId": "1d22e4ac-ab74-49b8-8df4-a9e177a458b2"
}
```

---

### 3. Dispatch Push Notification
Dispatches a push notification to all active devices registered to the target user email. If the user is currently offline, the notification is securely queued in D1.

* **Endpoint:** `POST /v1/push`
* **Auth Required:** Yes (`Authorization: Bearer <API_KEY>`)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `String` | Yes | Target user email address |
| `title` | `String` | Yes | Notification title |
| `body` | `String` | Yes | Notification message text |
| `data` | `Object` | No | Custom JSON payload (e.g. `orderId`, `sound`, `actionUrl`) |

#### Example Request
```bash
curl -X POST https://fastnotifications.fasthand.workers.dev/v1/push \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@fasthandbd.com",
    "title": "New Order #1042",
    "body": "You have received a new order for ৳ 1,850.00",
    "data": {
      "orderId": "1042",
      "sound": "loud_alert"
    }
  }'
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "status": "delivered",
  "notificationId": "e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380"
}
```

---

### 4. Fetch Pending Notifications
Retrieves all unacknowledged notifications for a user account when recovering from an offline state.

* **Endpoint:** `GET /v1/notifications/pending`
* **Headers:** `X-User-Email: seller@fasthandbd.com`

#### Example Request
```bash
curl -X GET https://fastnotifications.fasthand.workers.dev/v1/notifications/pending \
  -H "X-User-Email: seller@fasthandbd.com"
```

#### Response (`200 OK`)
```json
[
  {
    "id": "e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380",
    "user_id": "1d22e4ac-ab74-49b8-8df4-a9e177a458b2",
    "title": "New Order #1042",
    "body": "You have received a new order for ৳ 1,850.00",
    "data": "{\"orderId\":\"1042\",\"sound\":\"loud_alert\"}",
    "status": "pending",
    "created_at": "2026-09-19 09:30:00"
  }
]
```

---

### 5. Acknowledge Notification
Signals that the client successfully received and displayed the notification. **Permanently deletes** the record from D1 to prevent data accumulation.

* **Endpoint:** `POST /v1/notifications/:id/ack`
* **Auth Required:** No

#### Example Request
```bash
curl -X POST https://fastnotifications.fasthand.workers.dev/v1/notifications/e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380/ack
```

#### Response (`200 OK`)
```json
{
  "success": true
}
```

---

### 6. Delete Device
Unregisters a device so it stops receiving push events.

* **Endpoint:** `DELETE /v1/devices/:deviceId`
* **Headers:** `X-User-Email: seller@fasthandbd.com`

#### Example Request
```bash
curl -X DELETE https://fastnotifications.fasthand.workers.dev/v1/devices/and-dev-948210 \
  -H "X-User-Email: seller@fasthandbd.com"
```

#### Response (`200 OK`)
```json
{
  "success": true
}
```

---

### 7. WebSocket Real-Time Stream
Persistent duplex WebSocket connection to the user's `NotificationCoordinator` Durable Object.

* **Endpoint:** `GET /v1/ws?userId=<USER_ID>&deviceId=<DEVICE_ID>`
* **Protocol:** `WSS`

#### Incoming Push Frame (JSON)
```json
{
  "type": "push",
  "id": "e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380",
  "title": "New Order #1042",
  "body": "You have received a new order for ৳ 1,850.00",
  "data": {
    "orderId": "1042",
    "sound": "loud_alert"
  },
  "timestamp": 1726756800000
}
```

#### Heartbeat (Ping/Pong)
Clients should periodically send a ping frame or text `"ping"`. The server responds with `"pong"` to maintain connection health.

---

## 📱 Android Client Implementation

The repository includes a ready-to-run Android Kotlin example in [`test-app-kotlin`](./test-app-kotlin) with:
1. **Sticky Foreground Service** (`PushNotificationService.kt`) with `FOREGROUND_SERVICE_DATA_SYNC`.
2. **Persistent OkHttp WebSocket Connection** with automated exponential reconnection and keep-alive pings.
3. **High-Priority Notification Channel** with custom loud sound playback and vibration pattern.
4. **Offline Recovery Hook** (`fetchPending` triggered on `WebSocketListener.onOpen`).

### Simplified Kotlin Code Example

```kotlin
class PushNotificationService : Service() {
    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private fun connectWebSocket(userId: String, deviceId: String) {
        val request = Request.Builder()
            .url("wss://your-domain.workers.dev/v1/ws?userId=$userId&deviceId=$deviceId")
            .build()

        client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                // Instantly fetch any notifications sent while offline
                fetchPendingNotifications()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val notification = parseNotification(text)
                showNotification(notification)
                acknowledgeNotification(notification.id)
            }
        })
    }
}
```

---

## 📂 Repository Structure

```text
├── src/
│   ├── index.ts                            # API Router & Entrypoint
│   ├── docs.ts                             # Interactive Web Docs Page
│   ├── types.ts                            # TypeScript Interfaces & Env
│   ├── auth/                               # Bearer & API Key Verification
│   ├── middleware/                         # Validation & Middleware
│   ├── services/                           # D1 Database Service
│   └── durable_objects/
│       └── NotificationCoordinator.ts      # WebSocket Coordinator (DO)
├── migrations/
│   └── 0001_initial_schema.sql             # D1 Schema Migrations
├── test-app-kotlin/                        # Complete Android Kotlin Test App
├── wrangler.toml                           # Cloudflare Worker Configuration
├── schema.sql                              # Database Schema Reference
└── README.md                               # Documentation
```

---

## 📄 License
MIT License. Created by **FastHand Studio**.
