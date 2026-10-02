package dev.satooru.weardatacollector.heartrate

import android.util.Log
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

private const val TAG = "HeartRateApiClient"
private const val TIMEOUT_MS = 10_000

/**
 * 心拍送信 API のクライアント
 * @param baseUrl API のベース URL
 */
class HeartRateApiClient(private val baseUrl: String) {
    /**
     * 心拍サンプルのバッチを API に送信する．ネットワーク通信を行うためメインスレッドから呼び出してはならない
     * @param samples 送信する心拍サンプルのバッチ
     * @return 送信結果
     */
    fun send(samples: List<HeartRateSample>): UploadResult {
        var connection: HttpURLConnection? = null
        return try {
            connection = URL("${baseUrl.trimEnd('/')}/heart-rates").openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = TIMEOUT_MS
            connection.readTimeout = TIMEOUT_MS
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            connection.outputStream.use { it.write(createHeartRateRequestBody(samples).toByteArray()) }
            val statusCode = connection.responseCode
            toUploadResult(statusCode).also {
                if (it != UploadResult.SENT) Log.e(TAG, "failed to send heart rate samples: status=$statusCode")
            }
        } catch (exception: IOException) {
            Log.w(TAG, "failed to send heart rate samples", exception)
            UploadResult.FAILED
        } finally {
            connection?.disconnect()
        }
    }
}

/**
 * 心拍送信 API のレスポンスのステータスコードを送信結果に変換する
 * @param statusCode HTTP ステータスコード
 * @return 2xx は送信済み，リクエスト内容自体が受け付けられない 400・413・422 は再送不可，それ以外は再送対象
 */
fun toUploadResult(statusCode: Int): UploadResult = when (statusCode) {
    in 200..299 -> UploadResult.SENT
    // 404 や 401 などは URL や設定を直せば受け付けられるため，データを捨てずに再送対象にする
    400, 413, 422 -> UploadResult.REJECTED
    else -> UploadResult.FAILED
}
