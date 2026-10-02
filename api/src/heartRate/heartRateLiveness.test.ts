import { describe, expect, it } from 'vitest';

import {
  ALIVE_THRESHOLD_MS,
  isHeartRateAlive,
  parseLatestMeasuredAt,
  parseLatestMeasuredAtAttribute,
} from './heartRateLiveness';

describe('isHeartRateAlive', () => {
  const now = Date.UTC(2026, 9, 3, 0, 0);

  it('心拍が 1 件もない場合は false を返す', () => {
    expect(isHeartRateAlive({ latestMeasuredAt: undefined, now })).toBe(false);
  });

  it('最新の心拍がちょうど 5 分前までなら true を返す', () => {
    expect(isHeartRateAlive({ latestMeasuredAt: now - ALIVE_THRESHOLD_MS, now })).toBe(true);
  });

  it('最新の心拍が 5 分より前なら false を返す', () => {
    expect(isHeartRateAlive({ latestMeasuredAt: now - ALIVE_THRESHOLD_MS - 1, now })).toBe(false);
  });

  it('端末の時計が進んでいて未来の時刻でも true を返す', () => {
    expect(isHeartRateAlive({ latestMeasuredAt: now + 1_000, now })).toBe(true);
  });
});

describe('parseLatestMeasuredAt', () => {
  it('数値の latestMeasuredAt を返す', () => {
    expect(parseLatestMeasuredAt('{"latestMeasuredAt":1790956270000}')).toEqual({
      ok: true,
      latestMeasuredAt: 1790956270000,
    });
  });

  it('null は心拍がないことを表す undefined として返す', () => {
    expect(parseLatestMeasuredAt('{"latestMeasuredAt":null}')).toEqual({
      ok: true,
      latestMeasuredAt: undefined,
    });
  });

  it.each([
    'not json',
    '[]',
    'null',
    '{}',
    '{"latestMeasuredAt":"1"}',
    '{"latestMeasuredAt":1e999}',
  ])('不正なレスポンス %s を拒否する', (json) => {
    expect(parseLatestMeasuredAt(json).ok).toBe(false);
  });
});

describe('parseLatestMeasuredAtAttribute', () => {
  it('数値の文字列を数値として返す', () => {
    expect(parseLatestMeasuredAtAttribute('1790956270000')).toBe(1790956270000);
  });

  it.each([undefined, '', 'abc', 'Infinity'])(
    '数値として読めない値 %s は undefined を返す',
    (value) => {
      expect(parseLatestMeasuredAtAttribute(value)).toBeUndefined();
    },
  );
});
