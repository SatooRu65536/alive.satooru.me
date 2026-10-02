package dev.satooru.weardatacollector

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.text.format.DateFormat
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import dev.satooru.weardatacollector.heartrate.HeartRateMonitorService
import dev.satooru.weardatacollector.heartrate.HeartRateMonitorStatus
import dev.satooru.weardatacollector.heartrate.MAX_UPLOAD_INTERVAL_MS
import dev.satooru.weardatacollector.heartrate.MIN_UPLOAD_INTERVAL_MS
import dev.satooru.weardatacollector.heartrate.UploadInterval
import dev.satooru.weardatacollector.heartrate.UploadIntervalStore
import dev.satooru.weardatacollector.heartrate.UploadIntervalUnit

// Android 16 以降は心拍センサーの権限が BODY_SENSORS から健康データ用の権限に置き換わる
private val HEART_RATE_PERMISSION =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.BAKLAVA) {
        "android.permission.health.READ_HEART_RATE"
    } else {
        Manifest.permission.BODY_SENSORS
    }

/**
 * 心拍の計測・送信の開始と停止，送信間隔の設定を操作する画面
 */
class MainActivity : AppCompatActivity() {
    private lateinit var statusText: TextView
    private lateinit var lastSentText: TextView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button
    private lateinit var uploadIntervalRow: View
    private lateinit var uploadIntervalValueInput: EditText
    private lateinit var uploadIntervalSecondsButton: RadioButton
    private lateinit var uploadIntervalMinutesButton: RadioButton
    private lateinit var uploadIntervalStore: UploadIntervalStore
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
        uploadIntervalRow = findViewById(R.id.upload_interval_row)
        uploadIntervalValueInput = findViewById(R.id.upload_interval_value)
        uploadIntervalSecondsButton = findViewById(R.id.upload_interval_unit_seconds)
        uploadIntervalMinutesButton = findViewById(R.id.upload_interval_unit_minutes)
        uploadIntervalStore = UploadIntervalStore(this)
        // 画面の再生成時は入力途中の値を View 自身が復元するため，保存済みの値は初回表示時のみ反映する
        if (savedInstanceState == null) showUploadInterval(uploadIntervalStore.load())
        // エラー表示は数値を書き換えたときにしか消えないため，単位を切り替えたときも消す
        findViewById<RadioGroup>(R.id.upload_interval_unit).setOnCheckedChangeListener { _, _ ->
            uploadIntervalValueInput.error = null
        }
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
        // 権限の確認ダイアログを出す前に入力の誤りを伝える
        if (readUploadInterval() == null) return
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
        // サービスは保存済みの送信間隔を読むため，起動前に保存する
        val uploadInterval = readUploadInterval() ?: return
        uploadIntervalStore.save(uploadInterval)
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
        // 送信間隔は計測開始時にのみ反映されるため，計測中は表示しない
        uploadIntervalRow.visibility = if (state.isMonitoring) View.GONE else View.VISIBLE
    }

    // 入力欄は inputType="number" で ASCII の数字として読み取るため，ロケールに合わせた数字表記にはしない
    @SuppressLint("SetTextI18n")
    private fun showUploadInterval(interval: UploadInterval) {
        uploadIntervalValueInput.setText(interval.value.toString())
        when (interval.unit) {
            UploadIntervalUnit.SECONDS -> uploadIntervalSecondsButton.isChecked = true
            UploadIntervalUnit.MINUTES -> uploadIntervalMinutesButton.isChecked = true
        }
    }

    /**
     * 入力された送信間隔を読み取る
     * @return 入力された送信間隔．範囲外や未入力の場合は入力欄にエラーを表示して null
     */
    private fun readUploadInterval(): UploadInterval? {
        val unit = if (uploadIntervalSecondsButton.isChecked) UploadIntervalUnit.SECONDS else UploadIntervalUnit.MINUTES
        val interval = uploadIntervalValueInput.text.toString().toIntOrNull()?.let { UploadInterval(it, unit) }
        if (interval == null || !interval.isValid()) {
            uploadIntervalValueInput.error = getString(
                R.string.heart_rate_upload_interval_invalid,
                MIN_UPLOAD_INTERVAL_MS / UploadIntervalUnit.SECONDS.millis,
                MAX_UPLOAD_INTERVAL_MS / UploadIntervalUnit.MINUTES.millis,
            )
            return null
        }
        return interval
    }
}
