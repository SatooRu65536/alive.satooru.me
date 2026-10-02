const INITIAL_RECONNECT_DELAY_MS = 1_000;

// 端末から送信されない間も再接続が過剰に続かないよう，待ち時間に上限を設けて間隔を空ける
const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * 心拍の保存通知を受け取る WebSocket の URL を作る
 * @param protocol ページの location.protocol
 * @param host ページの location.host
 * @returns https のページでは wss，それ以外では ws の URL
 */
export function buildHeartRateStreamUrl({
  protocol,
  host,
}: {
  protocol: string;
  host: string;
}): string {
  const webSocketProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${webSocketProtocol}//${host}/api/heart-rates/stream`;
}

/**
 * 再接続までの待ち時間を求める
 * @param attemptCount 連続して再接続を試みた回数．初回は 0
 * @returns 試行ごとに倍になり，MAX_RECONNECT_DELAY_MS を上限とする待ち時間 ms
 */
export function calculateReconnectDelayMs(attemptCount: number): number {
  return Math.min(INITIAL_RECONNECT_DELAY_MS * 2 ** attemptCount, MAX_RECONNECT_DELAY_MS);
}
