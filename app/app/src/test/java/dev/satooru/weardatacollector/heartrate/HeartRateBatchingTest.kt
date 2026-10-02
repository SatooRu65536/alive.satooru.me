package dev.satooru.weardatacollector.heartrate

import org.junit.Assert.assertEquals
import org.junit.Test

class HeartRateBatchingTest {
    @Test
    fun returnsNoBatchesForEmptySamples() {
        assertEquals(emptyList<List<HeartRateSample>>(), splitIntoBatches(emptyList()))
    }

    // 期待値は API 側の制約と食い違ったときに検知できるよう，アプリの定数ではなくリテラルで書く
    @Test
    fun keepsSamplesWithinBatchDurationInOneBatch() {
        val samples = listOf(HeartRateSample(0, 60f), HeartRateSample(59_999, 61f))

        assertEquals(listOf(samples), splitIntoBatches(samples))
    }

    @Test
    fun splitsWhenBatchDurationIsReached() {
        val first = HeartRateSample(0, 60f)
        val second = HeartRateSample(60_000, 61f)

        assertEquals(listOf(listOf(first), listOf(second)), splitIntoBatches(listOf(first, second)))
    }

    @Test
    fun keepsSamplesUpToCountLimitInOneBatch() {
        val samples = (0 until 600).map { HeartRateSample(it.toLong(), 60f) }

        assertEquals(listOf(600), splitIntoBatches(samples).map { it.size })
    }

    @Test
    fun splitsWhenSampleCountExceedsLimit() {
        val samples = (0 until 601).map { HeartRateSample(it.toLong(), 60f) }

        assertEquals(listOf(600, 1), splitIntoBatches(samples).map { it.size })
    }

    @Test
    fun sortsSamplesByMeasuredAt() {
        val later = HeartRateSample(2_000, 61f)
        val earlier = HeartRateSample(1_000, 60f)

        assertEquals(listOf(listOf(earlier, later)), splitIntoBatches(listOf(later, earlier)))
    }
}
