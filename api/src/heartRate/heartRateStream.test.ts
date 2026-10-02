import { describe, expect, it } from 'vitest';

import { buildHeartRateStreamUrl, calculateReconnectDelayMs } from './heartRateStream';

describe('buildHeartRateStreamUrl', () => {
  it('https のページでは wss の URL を返す', () => {
    expect(buildHeartRateStreamUrl({ protocol: 'https:', host: 'alive.satooru.me' })).toBe(
      'wss://alive.satooru.me/api/heart-rates/stream',
    );
  });

  it('http のページでは ws の URL を返す', () => {
    expect(buildHeartRateStreamUrl({ protocol: 'http:', host: 'localhost:5173' })).toBe(
      'ws://localhost:5173/api/heart-rates/stream',
    );
  });
});

describe('calculateReconnectDelayMs', () => {
  it('試行ごとに待ち時間を倍にする', () => {
    expect([0, 1, 2, 3].map(calculateReconnectDelayMs)).toEqual([1_000, 2_000, 4_000, 8_000]);
  });

  it('待ち時間は 30 秒を上限とする', () => {
    expect(calculateReconnectDelayMs(5)).toBe(30_000);
    expect(calculateReconnectDelayMs(100)).toBe(30_000);
  });
});
