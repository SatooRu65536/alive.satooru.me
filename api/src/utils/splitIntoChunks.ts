/**
 * 配列を指定した件数ごとのチャンクに分割する
 * @param items 分割する配列
 * @param size 1 チャンクあたりの最大件数
 * @returns 元の順序を保ったチャンクの配列
 * @throws size が 1 以上の整数でない場合
 */
export function splitIntoChunks<T>({
  items,
  size,
}: {
  items: readonly T[];
  size: number;
}): readonly (readonly T[])[] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`size must be a positive integer: ${size}`);
  }
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}
