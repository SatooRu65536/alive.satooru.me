package dev.satooru.weardatacollector.heartrate

/**
 * 心拍送信 API のリクエストボディを生成する
 * @param samples 送信する心拍サンプル列
 * @return 1 行 1 サンプルで `<epoch ms>,<心拍数>` を並べたヘッダーなしの CSV 文字列
 */
fun createHeartRateRequestBody(samples: List<HeartRateSample>): String =
    samples.joinToString(separator = "\n") { sample -> "${sample.measuredAt},${sample.bpm}" }
