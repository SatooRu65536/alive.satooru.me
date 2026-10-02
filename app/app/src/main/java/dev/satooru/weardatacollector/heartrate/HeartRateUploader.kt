package dev.satooru.weardatacollector.heartrate

// 送信失敗が続いた場合に保持するバッチ数の上限．1 分ごとにおおむね 1 バッチできるため，約 1 時間分を超えた古いものから破棄する
private const val MAX_PENDING_BATCH_COUNT = 60

enum class UploadResult {
    SENT,

    // 再送しても受け付けられない
    REJECTED,

    // 時間をおいて再送すれば受け付けられる可能性がある
    FAILED,
}

/**
 * 心拍サンプルを溜めておき，まとめて送信する
 * @param sendBatch 1 バッチを送信し，その結果を返す関数
 */
class HeartRateUploader(
    private val sendBatch: (List<HeartRateSample>) -> UploadResult,
) {
    private val bufferedSamplesLock = Any()
    private val bufferedSamples = mutableListOf<HeartRateSample>()
    private val pendingBatches = ArrayDeque<List<HeartRateSample>>()

    /**
     * 心拍サンプルを次回の送信対象に加える
     * @param sample 追加する心拍サンプル
     */
    fun record(sample: HeartRateSample) {
        synchronized(bufferedSamplesLock) { bufferedSamples.add(sample) }
    }

    /**
     * 溜まっている心拍サンプルと前回までに送信できなかったバッチを古い順に送信する．送信に失敗した時点で中断し，残りは次回に持ち越す
     */
    @Synchronized
    fun uploadBufferedSamples() {
        // 送信中も record を止めないよう，ロックは取り出しの間だけ保持する
        val samples = synchronized(bufferedSamplesLock) {
            bufferedSamples.toList().also { bufferedSamples.clear() }
        }
        pendingBatches.addAll(splitIntoBatches(samples))
        while (pendingBatches.size > MAX_PENDING_BATCH_COUNT) pendingBatches.removeFirst()

        while (pendingBatches.isNotEmpty()) {
            when (sendBatch(pendingBatches.first())) {
                UploadResult.SENT, UploadResult.REJECTED -> pendingBatches.removeFirst()
                UploadResult.FAILED -> return
            }
        }
    }
}
