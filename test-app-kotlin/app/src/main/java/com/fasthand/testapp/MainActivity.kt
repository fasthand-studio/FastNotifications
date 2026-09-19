package com.fasthand.testapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import okhttp3.*
import org.json.JSONArray
import java.io.IOException
import java.util.*

data class NotificationItem(
    val id: String,
    val title: String,
    val body: String,
    val status: String
)

class MainActivity : ComponentActivity() {
    private val BASE_URL = "https://fastnotifications.fasthand.workers.dev"
    private val notificationsState = mutableStateListOf<NotificationItem>()
    private val client = OkHttpClient()

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d("MainActivity", "POST_NOTIFICATIONS granted")
            PushNotificationService.start(this)
        } else {
            Log.e("MainActivity", "POST_NOTIFICATIONS denied")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Ensure persistent device ID
        val prefs = getSharedPreferences("fast_notifications_prefs", Context.MODE_PRIVATE)
        if (prefs.getString("deviceId", null).isNullOrEmpty()) {
            val devId = "and-dev-" + UUID.randomUUID().toString().take(8)
            prefs.edit().putString("deviceId", devId).apply()
        }

        // Request permission and start foreground push service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            PushNotificationService.start(this)
        }

        fetchRecentNotifications()

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFFF6F4F0)) {
                    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Text("Fast Notifications", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        Text(
                            "Background service running. You can close or swipe away this app and push notifications will still arrive in real-time.",
                            fontSize = 13.sp,
                            color = Color(0xFF4B5563),
                            modifier = Modifier.padding(vertical = 6.dp)
                        )

                        LazyColumn(
                            modifier = Modifier.weight(1f).padding(vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(notificationsState) { notif ->
                                Card(
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(notif.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        Text(notif.body, fontSize = 13.sp, color = Color(0xFF4B5563))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun fetchRecentNotifications() {
        val prefs = getSharedPreferences("fast_notifications_prefs", Context.MODE_PRIVATE)
        val email = prefs.getString("email", "seller@fasthandbd.com") ?: "seller@fasthandbd.com"

        val request = Request.Builder()
            .url("$BASE_URL/v1/notifications/pending")
            .header("X-User-Email", email)
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {}
            override fun onResponse(call: Call, response: Response) {
                try {
                    val arr = JSONArray(response.body?.string().orEmpty())
                    runOnUiThread {
                        notificationsState.clear()
                        for (i in 0 until arr.length()) {
                            val obj = arr.getJSONObject(i)
                            notificationsState.add(
                                NotificationItem(
                                    obj.getString("id"),
                                    obj.getString("title"),
                                    obj.getString("body"),
                                    "pending"
                                )
                            )
                        }
                    }
                } catch (_: Exception) {}
            }
        })
    }
}
