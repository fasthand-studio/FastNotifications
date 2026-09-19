package com.fasthand.testapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class PushNotificationService : Service() {
    private val TAG = "PushNotificationService"
    private val BASE_URL = "https://fastnotifications.fasthand.workers.dev"
    private val WS_URL = "wss://fastnotifications.fasthand.workers.dev/v1/ws"

    companion object {
        const val FOREGROUND_CHANNEL_ID = "fast_service_channel"
        const val PUSH_CHANNEL_ID = "fast_loud_alerts_channel"
        const val SERVICE_NOTIF_ID = 9999

        fun start(context: Context) {
            val intent = Intent(context, PushNotificationService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private var activeWebSocket: WebSocket? = null
    private var isRunning = false
    private lateinit var prefs: SharedPreferences
    private var email: String = "seller@fasthandbd.com"

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "PushNotificationService onCreate")
        prefs = getSharedPreferences("fast_notifications_prefs", Context.MODE_PRIVATE)
        createNotificationChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "PushNotificationService onStartCommand")
        startForegroundNotification()

        if (!isRunning) {
            isRunning = true
            initializeAndConnect()
        }

        return START_STICKY
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. Silent Foreground Channel
            val serviceChannel = NotificationChannel(
                FOREGROUND_CHANNEL_ID,
                "Push Notification Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps connection open for instant alerts"
                setShowBadge(false)
            }
            manager.createNotificationChannel(serviceChannel)

            // 2. High-Priority Heads-Up Alerts Channel
            val pushChannel = NotificationChannel(
                PUSH_CHANNEL_ID,
                "Fast Notifications Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Instant notifications from Fast Notifications"
                enableLights(true)
                enableVibration(true)
                // Use Alarm URI to be louder than default notification
                val alarmUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM)
                setSound(alarmUri, android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build())
                // Strong vibration pattern
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
            }
            manager.createNotificationChannel(pushChannel)
        }
    }

    private fun startForegroundNotification() {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, FOREGROUND_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Fast Notifications Active")
            .setContentText("Connected for real-time push alerts")
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(SERVICE_NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(SERVICE_NOTIF_ID, notification)
        }
    }

    private fun initializeAndConnect() {
        this.email = prefs.getString("email", "seller@fasthandbd.com") ?: "seller@fasthandbd.com"
        var deviceId = prefs.getString("deviceId", null)
        if (deviceId.isNullOrEmpty()) {
            deviceId = "and-dev-" + java.util.UUID.randomUUID().toString().take(8)
            prefs.edit().putString("deviceId", deviceId).apply()
        }

        var userId = prefs.getString("userId", null)
        if (!userId.isNullOrEmpty()) {
            connectWebSocket(userId, deviceId)
        } else {
            registerDevice(email, deviceId)
        }
    }

    private fun registerDevice(email: String, deviceId: String) {
        val json = """{"email": "$email", "deviceId": "$deviceId", "platform": "android"}"""
        val body = json.toRequestBody("application/json".toMediaType())
        val request = Request.Builder().url("$BASE_URL/v1/devices/register").post(body).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Device registration failed", e)
                retryInitAfterDelay()
            }

            override fun onResponse(call: Call, response: Response) {
                try {
                    val uid = JSONObject(response.body?.string().orEmpty()).optString("userId", "")
                    if (uid.isNotEmpty()) {
                        prefs.edit().putString("userId", uid).apply()
                        connectWebSocket(uid, deviceId)
                    } else {
                        retryInitAfterDelay()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing register response", e)
                    retryInitAfterDelay()
                }
            }
        })
    }

    private fun connectWebSocket(userId: String, deviceId: String) {
        val url = "$WS_URL?userId=$userId&deviceId=$deviceId"
        val request = Request.Builder().url(url).build()

        activeWebSocket?.close(1000, "Reconnecting")
        activeWebSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected successfully to $url")
                fetchPending(email)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "Received WS Message: $text")
                try {
                    val obj = JSONObject(text)
                    val id = obj.optString("id").ifEmpty { obj.optString("notificationId") }
                    val title = obj.optString("title")
                    val body = obj.optString("body")

                    if (id.isNotEmpty() && title.isNotEmpty()) {
                        playCustomSound()
                        showSystemNotification(id, title, body)
                        ackNotification(id)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse incoming WebSocket message: $text", e)
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.w(TAG, "WebSocket closing: $code / $reason")
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket connection failed, scheduling reconnect...", t)
                retryWebSocketAfterDelay(userId, deviceId)
            }
        })
    }

    private fun retryInitAfterDelay() {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            if (isRunning) initializeAndConnect()
        }, 5000)
    }

    private fun retryWebSocketAfterDelay(userId: String, deviceId: String) {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            if (isRunning) connectWebSocket(userId, deviceId)
        }, 5000)
    }

    private fun showSystemNotification(id: String, title: String, body: String) {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this,
            id.hashCode(),
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(this, PUSH_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        with(NotificationManagerCompat.from(this)) {
            if (ActivityCompat.checkSelfPermission(this@PushNotificationService, android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                notify(id.hashCode(), builder.build())
            }
        }
    }

    private fun fetchPending(email: String) {
        val request = Request.Builder()
            .url("$BASE_URL/v1/notifications/pending")
            .header("X-User-Email", email)
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "fetchPending failed", e)
            }

            override fun onResponse(call: Call, response: Response) {
                try {
                    val arr = JSONArray(response.body?.string().orEmpty())
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        val id = obj.getString("id")
                        val title = obj.getString("title")
                        val body = obj.getString("body")
                        playCustomSound()
                        showSystemNotification(id, title, body)
                        ackNotification(id)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "fetchPending parse error", e)
                }
            }
        })
    }

    private fun ackNotification(notificationId: String) {
        val request = Request.Builder()
            .url("$BASE_URL/v1/notifications/$notificationId/ack")
            .post("".toRequestBody(null))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "ack failed for $notificationId", e)
            }

            override fun onResponse(call: Call, response: Response) {
                Log.d(TAG, "Notification acknowledged & deleted: $notificationId")
            }
        })
    }

    private fun playCustomSound() {
        try {
            val mediaPlayer = MediaPlayer.create(this, R.raw.alert_sound)
            mediaPlayer.isLooping = false
            mediaPlayer.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            var count = 0
            mediaPlayer.setOnCompletionListener { mp ->
                count++
                if (count < 4) {
                    mp.start()
                } else {
                    mp.release()
                }
            }
            mediaPlayer.start()
        } catch (e: Exception) {
            Log.e(TAG, "Error playing custom sound", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        activeWebSocket?.close(1000, "Service destroyed")
    }
}
