package dev.satooru.weardatacollector.heartrate

// 短すぎると送信のたびに通信が発生して電池を消費するため下限を設ける
const val MIN_UPLOAD_INTERVAL_MS = 5_000L

// 送信できない間に保持するバッチ数の上限（約 1 時間分）に，1 回の送信で作られるバッチが余裕をもって収まるよう上限を設ける
const val MAX_UPLOAD_INTERVAL_MS = 30 * 60_000L

enum class UploadIntervalUnit(val millis: Long) {
    SECONDS(1_000L),
    MINUTES(60_000L),
}

/**
 * 心拍を API に送信する間隔
 * @param value 間隔の数値
 * @param unit 間隔の単位
 */
data class UploadInterval(
    val value: Int,
    val unit: UploadIntervalUnit,
) {
    val millis: Long get() = value * unit.millis

    /**
     * 送信間隔として受け付けられる範囲内かどうか
     * @return [MIN_UPLOAD_INTERVAL_MS] 以上 [MAX_UPLOAD_INTERVAL_MS] 以下なら true
     */
    fun isValid(): Boolean = millis in MIN_UPLOAD_INTERVAL_MS..MAX_UPLOAD_INTERVAL_MS

    companion object {
        val DEFAULT = UploadInterval(1, UploadIntervalUnit.MINUTES)
    }
}
