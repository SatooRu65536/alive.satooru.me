import { describe, expect, it } from 'vitest';

import { BATCH_DURATION_MS, MAX_SAMPLE_COUNT, parseHeartRateCsv } from './heartRateBatch';

const BASE_TIME = 1_790_000_000_000;

function createCsv(rowCount: number): string {
  return Array.from({ length: rowCount }, (_, index) => `${BASE_TIME + index},72`).join('\n');
}

describe('parseHeartRateCsv', () => {
  it('1 分以内のサンプル列を measuredAt 昇順で返す', () => {
    const result = parseHeartRateCsv(`${BASE_TIME + 1000},72\n${BASE_TIME},70.5\n`);
    expect(result).toEqual({
      ok: true,
      samples: [
        { measuredAt: BASE_TIME, bpm: 70.5 },
        { measuredAt: BASE_TIME + 1000, bpm: 72 },
      ],
    });
  });

  it('CRLF 改行・空行・セル前後の空白を許容する', () => {
    const result = parseHeartRateCsv(`\r\n ${BASE_TIME} , 72 \r\n\r\n${BASE_TIME + 1},73\r\n`);
    expect(result).toEqual({
      ok: true,
      samples: [
        { measuredAt: BASE_TIME, bpm: 72 },
        { measuredAt: BASE_TIME + 1, bpm: 73 },
      ],
    });
  });

  it.each(['', '\n', ' \r\n '])('行がない場合はエラー: %o', (csv) => {
    expect(parseHeartRateCsv(csv).ok).toBe(false);
  });

  it('行数が上限を超える場合はエラー', () => {
    expect(parseHeartRateCsv(createCsv(MAX_SAMPLE_COUNT + 1)).ok).toBe(false);
  });

  it('行数が上限ちょうどの場合は成功', () => {
    expect(parseHeartRateCsv(createCsv(MAX_SAMPLE_COUNT)).ok).toBe(true);
  });

  it.each([
    `${BASE_TIME}`,
    `${BASE_TIME},`,
    `,72`,
    `${BASE_TIME},72,1`,
    'measuredAt,bpm',
    `${BASE_TIME + 0.5},72`,
    '-1,72',
    `${BASE_TIME},0`,
    `${BASE_TIME},301`,
    `${BASE_TIME},abc`,
    `${BASE_TIME},Infinity`,
    '0x10,72',
    `1.79e12,72`,
    `${BASE_TIME},+72`,
    `${BASE_TIME},72.`,
    '-0,72',
    `"${BASE_TIME}","72"`,
  ])('不正な行を含む場合はエラー: %o', (row) => {
    expect(parseHeartRateCsv(row).ok).toBe(false);
  });

  it('bpm が上限ちょうどの場合は成功', () => {
    expect(parseHeartRateCsv(`${BASE_TIME},300`).ok).toBe(true);
  });

  it('サンプルの時間幅が 1 分以上の場合はエラー', () => {
    const result = parseHeartRateCsv(`${BASE_TIME},72\n${BASE_TIME + BATCH_DURATION_MS},72`);
    expect(result.ok).toBe(false);
  });

  it('サンプルの時間幅が 1 分未満の場合は成功', () => {
    const result = parseHeartRateCsv(`${BASE_TIME},72\n${BASE_TIME + BATCH_DURATION_MS - 1},72`);
    expect(result.ok).toBe(true);
  });
});
