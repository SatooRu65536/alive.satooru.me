package dev.satooru.weardatacollector.heartrate

// API が受け付ける心拍の上限と揃え，1 件の異常値でバッチ全体が拒否されないようにする
private const val MAX_BPM = 300f

data class HeartRateSample(
    val measuredAt: Long,
    val bpm: Float,
)

/**
 * API に送信できる心拍値かどうかを判定する
 * @param bpm センサーから取得した心拍数
 * @return 0 より大きく上限以下の有限値であれば true
 */
fun isValidBpm(bpm: Float): Boolean = bpm.isFinite() && bpm > 0f && bpm <= MAX_BPM
