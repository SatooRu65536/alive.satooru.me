package dev.satooru.weardatacollector.heartrate

import android.content.Context
import androidx.core.content.edit

private const val PREFERENCES_NAME = "heart_rate_settings"
private const val KEY_UPLOAD_INTERVAL_VALUE = "upload_interval_value"
private const val KEY_UPLOAD_INTERVAL_UNIT = "upload_interval_unit"

/**
 * 画面で設定した送信間隔を次回の起動時にも使えるよう保存する
 * @param context SharedPreferences の取得に使う Context
 */
class UploadIntervalStore(context: Context) {
    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

    /**
     * 保存されている送信間隔を読み込む
     * @return 保存されている送信間隔．未保存または不正な値の場合は [UploadInterval.DEFAULT]
     */
    fun load(): UploadInterval {
        val value = preferences.getInt(KEY_UPLOAD_INTERVAL_VALUE, UploadInterval.DEFAULT.value)
        val unit = UploadIntervalUnit.entries.find { it.name == preferences.getString(KEY_UPLOAD_INTERVAL_UNIT, null) }
            ?: UploadInterval.DEFAULT.unit
        return UploadInterval(value, unit).takeIf { it.isValid() } ?: UploadInterval.DEFAULT
    }

    /**
     * 送信間隔を保存する
     * @param interval 保存する送信間隔
     */
    fun save(interval: UploadInterval) {
        preferences.edit {
            putInt(KEY_UPLOAD_INTERVAL_VALUE, interval.value)
            putString(KEY_UPLOAD_INTERVAL_UNIT, interval.unit.name)
        }
    }
}
