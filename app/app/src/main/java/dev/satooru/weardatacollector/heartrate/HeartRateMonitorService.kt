package dev.satooru.weardatacollector.heartrate

import android.annotation.SuppressLint
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import dev.satooru.weardatacollector.BuildConfig
import dev.satooru.weardatacollector.R
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private const val TAG = "HeartRateMonitorService"
private const val NOTIFICATION_CHANNEL_ID = "heart_rate_monitor"
private const val NOTIFICATION_ID = 1
private const val NANOSECONDS_PER_MILLISECOND = 1_000_000L

/**
 * 心拍センサーの値を収集し，画面で設定した間隔ごとにまとめて API に送信するフォアグラウンドサービス
 */
class HeartRateMonitorService : Service(), SensorEventListener {
    private val uploadExecutor = Executors.newSingleThreadScheduledExecutor()
    private val apiClient = HeartRateApiClient(BuildConfig.API_BASE_URL, BuildConfig.API_TOKEN)
    private val uploader = HeartRateUploader { samples ->
        apiClient.send(samples).also {
            if (it == UploadResult.SENT) HeartRateMonitorStatus.markSent(System.currentTimeMillis())
        }
    }
    private lateinit var sensorManager: SensorManager
    private lateinit var wakeLock: PowerManager.WakeLock
    private var isMonitoring = false

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(SensorManager::class.java)
        // 画面消灯中も計測と定期的な送信を続けるため CPU のスリープを抑止する
        wakeLock = getSystemService(PowerManager::class.java)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "$packageName:$TAG")
    }

    // WakeLock は計測中ずっと保持し，onDestroy で解放するためタイムアウトを設けない
    // scheduleAtFixedRate はキャッシュ状態から復帰した際に連続実行されうるが，計測中はフォアグラウンドサービスのためキャッシュ状態にならず，
    // 連続実行されてもバッファが空なら送信しない
    @SuppressLint("WakelockTimeout", "DiscouragedApi")
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 起動済みの状態で再度呼ばれた場合にセンサー登録や送信予約を重複させない
        if (isMonitoring) return START_NOT_STICKY

        // startForegroundService で起動されたため，すぐ停止する場合も先に startForeground を呼ばないと例外になる
        startForegroundWithNotification()
        if (BuildConfig.API_BASE_URL.isBlank()) {
            Log.e(TAG, "API base URL is not configured. Set the aliveApiBaseUrl Gradle property")
            stopSelf()
            return START_NOT_STICKY
        }
        // 空のトークンは API が Authorization ヘッダーを不正として 400 を返し，再送不可としてデータを捨ててしまうため，計測を始めない
        if (BuildConfig.API_TOKEN.isBlank()) {
            Log.e(TAG, "API token is not configured. Set the aliveApiToken Gradle property")
            stopSelf()
            return START_NOT_STICKY
        }
        val heartRateSensor = sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE)
        if (heartRateSensor == null) {
            Log.e(TAG, "heart rate sensor is not available")
            stopSelf()
            return START_NOT_STICKY
        }

        isMonitoring = true
        HeartRateMonitorStatus.setMonitoring(true)
        wakeLock.acquire()
        sensorManager.registerListener(this, heartRateSensor, SensorManager.SENSOR_DELAY_NORMAL)
        // 画面で開始前に保存した間隔を使う．送信にかかった時間で間隔がずれないよう，固定レートで実行する
        val uploadIntervalMs = UploadIntervalStore(this).load().millis
        uploadExecutor.scheduleAtFixedRate(
            ::uploadBufferedSamples,
            uploadIntervalMs,
            uploadIntervalMs,
            TimeUnit.MILLISECONDS,
        )
        // 権限がない状態でシステムに再起動されると例外になるため，自動再起動はさせない
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        HeartRateMonitorStatus.setMonitoring(false)
        sensorManager.unregisterListener(this)
        // 停止までに溜まった分を送り終えてから WakeLock を解放し，送信中に CPU がスリープしないようにする
        uploadExecutor.execute {
            uploadBufferedSamples()
            if (wakeLock.isHeld) wakeLock.release()
        }
        uploadExecutor.shutdown()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onSensorChanged(event: SensorEvent) {
        // 装着されていないなど，センサーが計測できていない間の値は送らない
        if (event.accuracy == SensorManager.SENSOR_STATUS_NO_CONTACT ||
            event.accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE
        ) {
            return
        }
        val bpm = event.values.firstOrNull() ?: return
        if (!isValidBpm(bpm)) return
        uploader.record(HeartRateSample(measuredAt = toEpochMillis(event.timestamp), bpm = bpm))
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

    private fun uploadBufferedSamples() {
        // 例外で scheduleAtFixedRate の以降の実行が止まらないよう，ここで握りつぶす
        try {
            uploader.uploadBufferedSamples()
        } catch (exception: Exception) {
            Log.e(TAG, "unexpected error while uploading heart rate samples", exception)
        }
    }

    // SensorEvent.timestamp は起動からの経過時間基準のため，現在時刻との差分から epoch ms に換算する
    private fun toEpochMillis(sensorTimestampNanos: Long): Long {
        val elapsedSinceEventMillis =
            (SystemClock.elapsedRealtimeNanos() - sensorTimestampNanos) / NANOSECONDS_PER_MILLISECOND
        return System.currentTimeMillis() - elapsedSinceEventMillis
    }

    private fun startForegroundWithNotification() {
        val notificationManager = NotificationManagerCompat.from(this)
        notificationManager.createNotificationChannel(
            NotificationChannelCompat.Builder(NOTIFICATION_CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_LOW)
                .setName(getString(R.string.heart_rate_notification_channel_name))
                .build(),
        )
        val notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(getString(R.string.heart_rate_notification_title))
            .setOngoing(true)
            .build()
        // health 種別は API 34 で追加されたため，それ未満では種別を指定しない
        val foregroundServiceType =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH else 0
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, foregroundServiceType)
    }
}
