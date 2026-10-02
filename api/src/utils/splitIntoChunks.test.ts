import { describe, expect, it } from 'vitest';

import { splitIntoChunks } from './splitIntoChunks';

describe('splitIntoChunks', () => {
  it('指定した件数ごとに分割し，端数は最後のチャンクにまとめる', () => {
    expect(splitIntoChunks({ items: [1, 2, 3, 4, 5], size: 2 })).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('割り切れる場合は同じ件数のチャンクになる', () => {
    expect(splitIntoChunks({ items: [1, 2, 3, 4], size: 2 })).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('size が要素数より大きい場合は 1 チャンクになる', () => {
    expect(splitIntoChunks({ items: [1, 2], size: 50 })).toEqual([[1, 2]]);
  });

  it('size が 1 の場合は 1 件ずつのチャンクになる', () => {
    expect(splitIntoChunks({ items: [1, 2], size: 1 })).toEqual([[1], [2]]);
  });

  it('空配列の場合は空配列を返す', () => {
    expect(splitIntoChunks({ items: [], size: 2 })).toEqual([]);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'size が正の整数でない場合は例外を投げる: %d',
    (size) => {
      expect(() => splitIntoChunks({ items: [1], size })).toThrow(RangeError);
    },
  );
});
