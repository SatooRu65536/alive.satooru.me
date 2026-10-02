package dev.satooru.weardatacollector.heartrate

/**
 * 心拍送信 API のリクエストボディを生成する
 * @param samples 送信する心拍サンプル列
 * @return `{"samples":[{"measuredAt":<epoch ms>,"bpm":<心拍数>}]}` 形式の JSON 文字列
 */
fun createHeartRateRequestBody(samples: List<HeartRateSample>): String =
    // 数値のみで構成されエスケープが不要なため，org.json を使わず組み立ててローカルテストで検証できるようにする
    samples.joinToString(separator = ",", prefix = """{"samples":[""", postfix = "]}") { sample ->
        """{"measuredAt":${sample.measuredAt},"bpm":${sample.bpm}}"""
    }
