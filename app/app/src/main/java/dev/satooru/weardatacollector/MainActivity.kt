package dev.satooru.weardatacollector

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.text.format.DateFormat
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import dev.satooru.weardatacollector.heartrate.HeartRateMonitorService
import dev.satooru.weardatacollector.heartrate.HeartRateMonitorStatus

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
    private lateinit var lastSentText: TextView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button
    private var isPermissionDenied = false

    // 状態は送信用のスレッドからも更新されるため，メインスレッドに切り替えてから画面に反映する
    private val statusListener: () -> Unit = { runOnUiThread(::render) }

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { results ->
            if (results[HEART_RATE_PERMISSION] == true) {
                startMonitoring()
            } else {
                isPermissionDenied = true
                render()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusText = findViewById(R.id.status_text)
        lastSentText = findViewById(R.id.last_sent_text)
        startButton = findViewById(R.id.start_button)
        stopButton = findViewById(R.id.stop_button)
        startButton.setOnClickListener { requestPermissionsAndStart() }
        stopButton.setOnClickListener { stopMonitoring() }
    }

    override fun onStart() {
        super.onStart()
        HeartRateMonitorStatus.addListener(statusListener)
        // 画面を表示していない間の変化を反映する
        render()
    }

    override fun onStop() {
        HeartRateMonitorStatus.removeListener(statusListener)
        super.onStop()
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

    // 計測中の表示はサービスが計測を始めた時点で状態の変化として反映される
    private fun startMonitoring() {
        isPermissionDenied = false
        ContextCompat.startForegroundService(this, Intent(this, HeartRateMonitorService::class.java))
    }

    private fun stopMonitoring() {
        stopService(Intent(this, HeartRateMonitorService::class.java))
    }

    private fun render() {
        val state = HeartRateMonitorStatus.state
        statusText.setText(
            when {
                state.isMonitoring -> R.string.heart_rate_monitoring
                isPermissionDenied -> R.string.heart_rate_permission_denied
                else -> R.string.heart_rate_stopped
            },
        )
        val lastSentAt = state.lastSentAt
        lastSentText.text = getString(
            R.string.heart_rate_last_sent,
            if (lastSentAt == null) getString(R.string.heart_rate_not_sent_yet) else DateFormat.format("M/d HH:mm:ss", lastSentAt),
        )
        lastSentText.visibility = if (state.isMonitoring) View.VISIBLE else View.GONE
        startButton.visibility = if (state.isMonitoring) View.GONE else View.VISIBLE
        stopButton.visibility = if (state.isMonitoring) View.VISIBLE else View.GONE
    }
}
