package dev.satooru.weardatacollector.heartrate

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HeartRateRequestBodyTest {
    @Test
    fun createsRequestBodyMatchingApiSchema() {
        val samples = listOf(HeartRateSample(1_700_000_000_000, 72f), HeartRateSample(1_700_000_001_000, 73.5f))

        assertEquals(
            "1700000000000,72.0\n1700000001000,73.5",
            createHeartRateRequestBody(samples),
        )
    }

    @Test
    fun acceptsBpmWithinApiRange() {
        assertTrue(isValidBpm(0.1f))
        assertTrue(isValidBpm(300f))
    }

    @Test
    fun rejectsBpmOutsideApiRange() {
        assertFalse(isValidBpm(0f))
        assertFalse(isValidBpm(300.1f))
        assertFalse(isValidBpm(Float.NaN))
        assertFalse(isValidBpm(Float.POSITIVE_INFINITY))
    }
}
