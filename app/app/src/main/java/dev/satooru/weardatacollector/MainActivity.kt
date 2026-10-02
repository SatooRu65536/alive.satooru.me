package dev.satooru.weardatacollector

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import dev.satooru.weardatacollector.heartrate.HeartRateMonitorService

// Android 16 以降は心拍センサーの権限が BODY_SENSORS から健康データ用の権限に置き換わる
private val HEART_RATE_PERMISSION =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.BAKLAVA) {
        "android.permission.health.READ_HEART_RATE"
    } else {
        Manifest.permission.BODY_SENSORS
    }

/**
 * 心拍の計測・送信の開始と停止を操作する画面
 */
class MainActivity : AppCompatActivity() {
    private lateinit var statusText: TextView

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { results ->
            if (results[HEART_RATE_PERMISSION] == true) {
                startMonitoring()
            } else {
                statusText.setText(R.string.heart_rate_permission_denied)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusText = findViewById(R.id.status_text)
        findViewById<Button>(R.id.start_button).setOnClickListener { requestPermissionsAndStart() }
        findViewById<Button>(R.id.stop_button).setOnClickListener { stopMonitoring() }
    }

    private fun requestPermissionsAndStart() {
        // 通知権限はフォアグラウンドサービスの通知表示にのみ使うため，拒否されても計測は開始する
        val permissions = buildList {
            add(HEART_RATE_PERMISSION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val isAllGranted = permissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
        if (isAllGranted) {
            startMonitoring()
        } else {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun startMonitoring() {
        ContextCompat.startForegroundService(this, Intent(this, HeartRateMonitorService::class.java))
        statusText.setText(R.string.heart_rate_monitoring)
    }

    private fun stopMonitoring() {
        stopService(Intent(this, HeartRateMonitorService::class.java))
        statusText.setText(R.string.heart_rate_stopped)
    }
}
