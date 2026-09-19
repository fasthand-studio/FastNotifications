export const docsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fast Notifications by FastHand Studio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #F6F4F0;
      --card-bg: #FFFFFF;
      --card-border: #D1D5DB;
      --text-main: #111827;
      --text-muted: #6B7280;
      --accent: #2563EB;
      --accent-hover: #1D4ED8;
      --success: #059669;
      --danger: #DC2626;
      --warning: #D97706;
      --code-bg: #F3F4F6;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      font-size: 17px;
      line-height: 1.5;
      padding: 1rem 0.75rem 3rem;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
    }


    /* Capsule geometry buttons */
    .btn-compact {
      height: 32px;
      border-radius: 16px;
      padding: 0 0.85rem;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid var(--card-border);
      background: var(--card-bg);
      color: var(--text-main);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      text-decoration: none;
    }
    .btn-compact:hover {
      background: #E5E7EB;
    }

    /* Header */
    header {
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 0.25rem;
      color: var(--text-main);
    }
    p.lead {
      color: var(--text-muted);
      font-size: 15px;
    }

    /* Cards with 36px radius */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 36px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Badges */
    .method-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      color: #FFFFFF;
      display: inline-block;
      text-transform: uppercase;
      margin-right: 0.5rem;
    }
    .method-get { background-color: var(--success); }
    .method-post { background-color: var(--accent); }
    .method-delete { background-color: var(--danger); }
    .method-ws { background-color: var(--warning); }

    /* Tables */
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin-top: 0.5rem;
      margin-bottom: 0.75rem;
      border: 1px solid var(--card-border);
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
    }
    th {
      background: var(--code-bg);
      font-weight: 600;
      color: var(--text-main);
    }
    tr:last-child td {
      border-bottom: none;
    }

    /* Media Queries for Phone / Responsive */
    @media (max-width: 600px) {
      body {
        padding: 0.75rem 0.5rem 2rem;
        font-size: 15px;
      }
      h1 {
        font-size: 1.4rem;
      }
      .card {
        border-radius: 20px;
        padding: 1rem 1rem;
      }
      .card-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .method-badge {
        margin-right: 0;
        font-size: 11px;
      }
      pre {
        padding: 0.65rem;
        font-size: 12px;
        border-radius: 12px;
      }
      ul {
        margin-left: 1rem;
      }
    }

    /* Typography & Code */
    .label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 0.85rem;
      margin-bottom: 0.25rem;
    }
    .desc {
      font-size: 15px;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    pre {
      background-color: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 0.85rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13.5px;
      color: #1F2937;
      overflow-x: auto;
      margin-top: 0.25rem;
      margin-bottom: 0.5rem;
      white-space: pre-wrap;
      word-break: break-all;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13.5px;
      background: var(--code-bg);
      padding: 0.15rem 0.35rem;
      border-radius: 6px;
      border: 1px solid var(--card-border);
    }

    /* Lists */
    ul {
      margin-left: 1.25rem;
      margin-bottom: 0.75rem;
      font-size: 15px;
    }
    li {
      margin-bottom: 0.35rem;
    }

    footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 2.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Fast Notifications by FastHand Studio</h1>
      <p class="lead">Production real-time push notification gateway powered by Cloudflare Workers, Durable Objects, and D1 Database. A superior, FCM-independent alternative to Firebase Messaging.</p>
    </header>

    <!-- Architecture & Lifecycle -->
    <section id="lifecycle" class="card">
      <div class="card-title">
        <span>Architecture &amp; Delivery Lifecycle</span>
      </div>
      <p class="desc">Fast Notifications provides an FCM-independent push architecture designed for high delivery guarantees:</p>
      <ul>
        <li><strong>Online Delivery (Instant WebSocket):</strong> When an app is connected, the per-user <code>NotificationCoordinator</code> Durable Object wakes up and pushes the payload directly via WebSocket.</li>
        <li><strong>Offline Queuing (D1 Database):</strong> If the client is offline or the WebSocket is unreachable, the notification remains in D1 with <code>status: 'pending'</code>.</li>
        <li><strong>Automatic Cleanup on Acknowledgment:</strong> When the client receives and displays the notification, it issues <code>POST /v1/notifications/:id/ack</code>. The record is permanently deleted from D1 to maintain zero storage bloat.</li>
      </ul>
    </section>

    <!-- Authentication -->
    <section class="card">
      <div class="card-title">
        <span>Authentication &amp; Security Best Practices</span>
      </div>
      <p class="desc">We implement multi-layered security to ensure reliable and authorised notification delivery:</p>
      <ul>
        <li><strong>API Authentication:</strong> All server-side push requests must provide a valid Bearer token in the <code>Authorization</code> header. Rotate this key regularly in your Cloudflare dashboard configuration.</li>
        <li><strong>Device Binding:</strong> WebSocket connections are strictly validated against registered devices. An attempt to connect with an unknown <code>deviceId</code> will be rejected with a <code>401 Unauthorized</code> status.</li>
        <li><strong>Payload Sanitization:</strong> All input fields (email, title, body, deviceId) are validated for length and format to prevent injection attacks or database bloating.</li>
        <li><strong>Rate Limiting:</strong> Endpoints are protected by in-memory rate limiting to defend against abuse and excessive API calls.</li>
        <li><strong>Data Minimization:</strong> By acknowledging and deleting notifications immediately after delivery, we prevent unnecessary long-term storage of sensitive notification payloads.</li>
      </ul>
      <div class="label">Backend Auth Header</div>
      <pre>Authorization: Bearer &lt;API_KEY&gt;</pre>
    </section>

    <!-- Endpoints List -->
    <div id="endpoints">

      <!-- 1. Health Check -->
      <section class="card">
        <div class="card-title">
          <span>1. Health Check</span>
          <span class="method-badge method-get">GET /v1/health</span>
        </div>
        <p class="desc">Verifies edge worker status and latency.</p>

        <div class="label">Response (200 OK)</div>
        <pre>{
  "status": "ok",
  "timestamp": 1726756800000
}</pre>
      </section>

      <!-- 2. Device Registration -->
      <section class="card">
        <div class="card-title">
          <span>2. Register Device</span>
          <span class="method-badge method-post">POST /v1/devices/register</span>
        </div>
        <p class="desc">Registers an Android or client device and maps it to the user account.</p>

        <div class="label">Request Body (application/json)</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>email</code></td><td>String</td><td>Yes</td><td>User email address (e.g. <code>seller@fasthandbd.com</code>)</td></tr>
              <tr><td><code>deviceId</code></td><td>String</td><td>Yes</td><td>Unique hardware or installation ID</td></tr>
              <tr><td><code>platform</code></td><td>String</td><td>No</td><td>Platform identifier (defaults to <code>android</code>)</td></tr>
            </tbody>
          </table>
        </div>

        <div class="label">Example Request</div>
        <pre>curl -X POST https://fastnotifications.fasthand.workers.dev/v1/devices/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "seller@fasthandbd.com",
    "deviceId": "and-dev-948210",
    "platform": "android"
  }'</pre>

        <div class="label">Response (200 OK)</div>
        <pre>{
  "success": true,
  "userId": "1d22e4ac-ab74-49b8-8df4-a9e177a458b2"
}</pre>
      </section>

      <!-- 3. De-register Device -->
      <section class="card">
        <div class="card-title">
          <span>3. Delete Device</span>
          <span class="method-badge method-delete">DELETE /v1/devices/:deviceId</span>
        </div>
        <p class="desc">Unregisters a device so it no longer receives pushes.</p>

        <div class="label">Headers</div>
        <pre>X-User-Email: seller@fasthandbd.com</pre>

        <div class="label">Example Request</div>
        <pre>curl -X DELETE https://fastnotifications.fasthand.workers.dev/v1/devices/and-dev-948210 \\
  -H "X-User-Email: seller@fasthandbd.com"</pre>

        <div class="label">Response (200 OK)</div>
        <pre>{
  "success": true
}</pre>
      </section>

      <!-- 4. Dispatch Push -->
      <section class="card">
        <div class="card-title">
          <span>4. Dispatch Push Notification</span>
          <span class="method-badge method-post">POST /v1/push</span>
        </div>
        <p class="desc">Enqueues and sends a notification to all devices belonging to the recipient.</p>

        <div class="label">Headers</div>
        <pre>Authorization: Bearer &lt;API_KEY&gt;
Content-Type: application/json</pre>

        <div class="label">Request Body (application/json)</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>email</code></td><td>String</td><td>Yes</td><td>Recipient email address</td></tr>
              <tr><td><code>title</code></td><td>String</td><td>Yes</td><td>Notification display title</td></tr>
              <tr><td><code>body</code></td><td>String</td><td>Yes</td><td>Notification body message</td></tr>
              <tr><td><code>data</code></td><td>Object</td><td>No</td><td>Custom JSON payload (e.g. orderId, sound, action)</td></tr>
            </tbody>
          </table>
        </div>

        <div class="label">Example Request</div>
        <pre>curl -X POST https://fastnotifications.fasthand.workers.dev/v1/push \\
  -H "Authorization: Bearer test-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "seller@fasthandbd.com",
    "title": "New Order #1042",
    "body": "You have received a new order for ৳ 1,850.00",
    "data": { "orderId": "1042", "sound": "chime" }
  }'</pre>

        <div class="label">Response (200 OK)</div>
        <pre>{
  "success": true,
  "status": "delivered",
  "notificationId": "e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380"
}</pre>
      </section>

      <!-- 5. Fetch Pending Notifications -->
      <section class="card">
        <div class="card-title">
          <span>5. Fetch Pending Notifications</span>
          <span class="method-badge method-get">GET /v1/notifications/pending</span>
        </div>
        <p class="desc">Retrieves all unacknowledged notifications for an account after reconnecting.</p>

        <div class="label">Headers</div>
        <pre>X-User-Email: seller@fasthandbd.com</pre>

        <div class="label">Example Request</div>
        <pre>curl -X GET https://fastnotifications.fasthand.workers.dev/v1/notifications/pending \\
  -H "X-User-Email: seller@fasthandbd.com"</pre>

        <div class="label">Response (200 OK)</div>
        <pre>[
  {
    "id": "e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380",
    "user_id": "1d22e4ac-ab74-49b8-8df4-a9e177a458b2",
    "title": "New Order #1042",
    "body": "You have received a new order for ৳ 1,850.00",
    "data": "{\\"orderId\\":\\"1042\\",\\"sound\\":\\"chime\\"}",
    "status": "pending",
    "created_at": "2026-09-19 09:30:00"
  }
]</pre>
      </section>

      <!-- 6. Acknowledge Notification -->
      <section class="card">
        <div class="card-title">
          <span>6. Acknowledge Notification</span>
          <span class="method-badge method-post">POST /v1/notifications/:id/ack</span>
        </div>
        <p class="desc">Signals successful receipt and display. Permanently deletes the notification from D1 storage.</p>

        <div class="label">Example Request</div>
        <pre>curl -X POST https://fastnotifications.fasthand.workers.dev/v1/notifications/e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380/ack</pre>

        <div class="label">Response (200 OK)</div>
        <pre>{
  "success": true
}</pre>
      </section>

      <!-- 7. WebSocket Stream -->
      <section class="card">
        <div class="card-title">
          <span>7. WebSocket Real-Time Stream</span>
          <span class="method-badge method-ws">WSS /v1/ws</span>
        </div>
        <p class="desc">Persistent duplex connection to the user's Durable Object coordinator with WebSocket hibernation support.</p>

        <div class="label">Connection URL</div>
        <pre>wss://fastnotifications.fasthand.workers.dev/v1/ws?userId=&lt;USER_ID&gt;&amp;deviceId=&lt;DEVICE_ID&gt;</pre>

        <div class="label">Pushed Frame Payload (JSON)</div>
        <pre>{
  "type": "push",
  "id": "e2c608f5-f8c6-4cbf-8b2b-65e3c7ba3380",
  "title": "New Order #1042",
  "body": "You have received a new order for ৳ 1,850.00",
  "data": {
    "orderId": "1042",
    "sound": "chime"
  },
  "timestamp": 1726756800000
}</pre>

        <div class="label">Client Ping / Pong</div>
        <p class="desc">Clients should periodically send a ping frame or text <code>"ping"</code>. The server responds with <code>"pong"</code> to maintain connection vitality.</p>
      </section>

    </div>

    <footer>
      &copy; 2026 Fast Notifications by FastHand Studio
    </footer>
  </div>
</body>
</html>
`;
