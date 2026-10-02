package dev.satooru.weardatacollector.heartrate

import org.junit.Assert.assertEquals
import org.junit.Test

class HeartRateApiClientTest {
    @Test
    fun treatsSuccessStatusAsSent() {
        assertEquals(UploadResult.SENT, toUploadResult(201))
    }

    @Test
    fun treatsInvalidRequestStatusAsRejected() {
        listOf(400, 413, 422).forEach { assertEquals(UploadResult.REJECTED, toUploadResult(it)) }
    }

    @Test
    fun treatsOtherStatusAsFailedToRetry() {
        listOf(401, 403, 404, 408, 429, 500, 503).forEach { assertEquals(UploadResult.FAILED, toUploadResult(it)) }
    }
}
