package dev.satooru.weardatacollector.heartrate

import java.util.concurrent.CopyOnWriteArraySet

/**
 * 計測サービスの状態
 * @param isMonitoring 計測中かどうか
 * @param lastSentAt 最後に API への送信に成功した日時（epoch ms）．未送信の場合は null
 */
data class HeartRateMonitorState(
    val isMonitoring: Boolean = false,
    val lastSentAt: Long? = null,
)

/**
 * 計測サービスの状態を画面に伝えるための，プロセス内で共有する状態の保持先
 */
object HeartRateMonitorStatus {
    private val listeners = CopyOnWriteArraySet<() -> Unit>()

    @Volatile
    var state = HeartRateMonitorState()
        private set

    /**
     * 状態の変化を購読する．状態を更新したスレッドから呼び出され，複数スレッドからの更新で通知の順序が前後しうるため，呼び出された時点の [state] を読むこと
     * @param listener 状態が変化したときに呼び出す関数
     */
    fun addListener(listener: () -> Unit) {
        listeners.add(listener)
    }

    /**
     * 状態の変化の購読を解除する
     * @param listener [addListener] で登録した関数
     */
    fun removeListener(listener: () -> Unit) {
        listeners.remove(listener)
    }

    /**
     * 計測中かどうかを更新する
     * @param isMonitoring 計測中かどうか
     */
    fun setMonitoring(isMonitoring: Boolean) = update { it.copy(isMonitoring = isMonitoring) }

    /**
     * 送信に成功した日時を記録する
     * @param sentAt 送信に成功した日時（epoch ms）
     */
    fun markSent(sentAt: Long) = update { it.copy(lastSentAt = sentAt) }

    private fun update(transform: (HeartRateMonitorState) -> HeartRateMonitorState) {
        synchronized(this) { state = transform(state) }
        listeners.forEach { it() }
    }
}
