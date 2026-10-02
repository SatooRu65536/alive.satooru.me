package dev.satooru.weardatacollector.heartrate

// 送信失敗が続いた場合に保持するバッチ数の上限．未送信分は送信間隔によらず 1 分ごとにおおむね 1 バッチに分割し直すため，約 1 時間分を超えた古いものから破棄する
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
    // 前回までに送信できなかったサンプル．measuredAt 昇順で保持する
    private val pendingSamples = mutableListOf<HeartRateSample>()

    /**
     * 心拍サンプルを次回の送信対象に加える
     * @param sample 追加する心拍サンプル
     */
    fun record(sample: HeartRateSample) {
        synchronized(bufferedSamplesLock) { bufferedSamples.add(sample) }
    }

    /**
     * 溜まっている心拍サンプルと前回までに送信できなかったサンプルをバッチに分割し，古い順に送信する．送信に失敗した時点で中断し，残りは次回に持ち越す
     */
    @Synchronized
    fun uploadBufferedSamples() {
        // 送信中も record を止めないよう，ロックは取り出しの間だけ保持する
        val samples = synchronized(bufferedSamplesLock) {
            bufferedSamples.toList().also { bufferedSamples.clear() }
        }
        // 送信間隔が短いと 1 回分のバッチが小さくなるため，未送信分とまとめて分割し直し，保持できる期間が送信間隔に左右されないようにする
        val batches = ArrayDeque(splitIntoBatches(pendingSamples + samples))
        while (batches.size > MAX_PENDING_BATCH_COUNT) batches.removeFirst()
        // sendBatch が例外を投げても未送信分を失わないよう，送信前に全件を保持しておく
        pendingSamples.clear()
        batches.forEach { pendingSamples.addAll(it) }

        while (batches.isNotEmpty()) {
            when (sendBatch(batches.first())) {
                UploadResult.SENT, UploadResult.REJECTED -> pendingSamples.subList(0, batches.removeFirst().size).clear()
                UploadResult.FAILED -> return
            }
        }
    }
}
