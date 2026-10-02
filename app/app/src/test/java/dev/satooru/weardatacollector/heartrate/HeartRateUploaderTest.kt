package dev.satooru.weardatacollector.heartrate

import org.junit.Assert.assertEquals
import org.junit.Test

class HeartRateUploaderTest {
    private val sample = HeartRateSample(0, 60f)

    @Test
    fun sendsNothingWhenNoSamplesAreRecorded() {
        val sentBatches = mutableListOf<List<HeartRateSample>>()
        val uploader = HeartRateUploader { sentBatches.add(it); UploadResult.SENT }

        uploader.uploadBufferedSamples()

        assertEquals(emptyList<List<HeartRateSample>>(), sentBatches)
    }

    @Test
    fun sendsRecordedSamplesOnlyOnce() {
        val sentBatches = mutableListOf<List<HeartRateSample>>()
        val uploader = HeartRateUploader { sentBatches.add(it); UploadResult.SENT }

        uploader.record(sample)
        uploader.uploadBufferedSamples()
        uploader.uploadBufferedSamples()

        assertEquals(listOf(listOf(sample)), sentBatches)
    }

    @Test
    fun resendsFailedBatchBeforeNewSamples() {
        val sentBatches = mutableListOf<List<HeartRateSample>>()
        val results = ArrayDeque(listOf(UploadResult.FAILED, UploadResult.SENT, UploadResult.SENT))
        val uploader = HeartRateUploader { sentBatches.add(it); results.removeFirst() }
        val laterSample = HeartRateSample(BATCH_DURATION_MS * 2, 61f)

        uploader.record(sample)
        uploader.uploadBufferedSamples()
        uploader.record(laterSample)
        uploader.uploadBufferedSamples()

        assertEquals(listOf(listOf(sample), listOf(sample), listOf(laterSample)), sentBatches)
    }

    @Test
    fun keepsBatchWhenSendingThrows() {
        val sentBatches = mutableListOf<List<HeartRateSample>>()
        var shouldThrow = true
        val uploader = HeartRateUploader {
            sentBatches.add(it)
            if (shouldThrow) throw IllegalStateException("unexpected")
            UploadResult.SENT
        }

        uploader.record(sample)
        runCatching { uploader.uploadBufferedSamples() }
        shouldThrow = false
        uploader.uploadBufferedSamples()

        assertEquals(listOf(listOf(sample), listOf(sample)), sentBatches)
    }

    @Test
    fun dropsRejectedBatch() {
        val sentBatches = mutableListOf<List<HeartRateSample>>()
        val uploader = HeartRateUploader { sentBatches.add(it); UploadResult.REJECTED }

        uploader.record(sample)
        uploader.uploadBufferedSamples()
        uploader.uploadBufferedSamples()

        assertEquals(listOf(listOf(sample)), sentBatches)
    }

    @Test
    fun dropsOldestBatchesWhenPendingBatchesExceedLimit() {
        val sentBatches = mutableListOf<List<HeartRateSample>>()
        var isServerAvailable = false
        val uploader = HeartRateUploader {
            sentBatches.add(it)
            if (isServerAvailable) UploadResult.SENT else UploadResult.FAILED
        }

        // 1 回の送信につき 1 バッチずつ溜まるよう，期間をずらして 61 回失敗させる
        repeat(61) { minute ->
            uploader.record(HeartRateSample(minute * BATCH_DURATION_MS, 60f))
            uploader.uploadBufferedSamples()
        }
        sentBatches.clear()
        isServerAvailable = true
        uploader.uploadBufferedSamples()

        assertEquals(60, sentBatches.size)
        assertEquals(BATCH_DURATION_MS, sentBatches.first().single().measuredAt)
    }
}
