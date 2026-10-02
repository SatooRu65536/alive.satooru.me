package dev.satooru.weardatacollector.heartrate

// API が 1 リクエストで受け付ける期間と件数の上限
const val BATCH_DURATION_MS = 60_000L
const val MAX_SAMPLE_COUNT_PER_BATCH = 600

/**
 * 心拍サンプル列を API が 1 リクエストで受け付けられる単位に分割する
 * @param samples 分割する心拍サンプル列
 * @return measuredAt 昇順に並べ，各バッチの期間が [BATCH_DURATION_MS] 未満かつ件数が [MAX_SAMPLE_COUNT_PER_BATCH] 以下になるよう分割したバッチ列
 */
fun splitIntoBatches(samples: List<HeartRateSample>): List<List<HeartRateSample>> {
    val batches = mutableListOf<List<HeartRateSample>>()
    var currentBatch = mutableListOf<HeartRateSample>()
    // 端末時刻の補正で measuredAt が逆行することがあるため，期間の判定前に並べ替える
    for (sample in samples.sortedBy { it.measuredAt }) {
        val batchStartedAt = currentBatch.firstOrNull()?.measuredAt
        val isBatchFull = currentBatch.size >= MAX_SAMPLE_COUNT_PER_BATCH
        if (batchStartedAt != null && (isBatchFull || sample.measuredAt - batchStartedAt >= BATCH_DURATION_MS)) {
            batches.add(currentBatch)
            currentBatch = mutableListOf()
        }
        currentBatch.add(sample)
    }
    if (currentBatch.isNotEmpty()) batches.add(currentBatch)
    return batches
}
