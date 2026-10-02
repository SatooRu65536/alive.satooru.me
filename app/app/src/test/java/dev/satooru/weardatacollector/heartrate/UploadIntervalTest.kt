package dev.satooru.weardatacollector.heartrate

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UploadIntervalTest {
    @Test
    fun convertsValueAndUnitToMillis() {
        assertEquals(30_000L, UploadInterval(30, UploadIntervalUnit.SECONDS).millis)
        assertEquals(120_000L, UploadInterval(2, UploadIntervalUnit.MINUTES).millis)
    }

    @Test
    fun acceptsIntervalWithinRange() {
        assertTrue(UploadInterval(5, UploadIntervalUnit.SECONDS).isValid())
        assertTrue(UploadInterval(30, UploadIntervalUnit.MINUTES).isValid())
        assertTrue(UploadInterval.DEFAULT.isValid())
    }

    @Test
    fun rejectsIntervalOutOfRange() {
        assertFalse(UploadInterval(4, UploadIntervalUnit.SECONDS).isValid())
        assertFalse(UploadInterval(0, UploadIntervalUnit.MINUTES).isValid())
        assertFalse(UploadInterval(-1, UploadIntervalUnit.SECONDS).isValid())
        assertFalse(UploadInterval(31, UploadIntervalUnit.MINUTES).isValid())
        assertFalse(UploadInterval(1801, UploadIntervalUnit.SECONDS).isValid())
    }

    @Test
    fun doesNotOverflowWithLargeValue() {
        assertFalse(UploadInterval(Int.MAX_VALUE, UploadIntervalUnit.MINUTES).isValid())
    }
}
