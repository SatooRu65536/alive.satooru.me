import { DurableObject } from 'cloudflare:workers';

export const HEART_RATES_SAVED_MESSAGE = 'heart-rates-saved';

// 全クライアントの接続を 1 つのインスタンスに集めて通知できるよう，常に同じ名前で取得する
const BROADCASTER_NAME = 'global';

/**
 * 心拍の保存をページに通知する Durable Object を取得する
 * @param env Worker のバインディング
 * @returns 全クライアントで共有する単一のインスタンス
 */
export function getHeartRateBroadcaster(
  env: CloudflareBindings,
): DurableObjectStub<HeartRateBroadcaster> {
  return env.HEART_RATE_BROADCASTER.getByName(BROADCASTER_NAME);
}

/**
 * ページを開いているクライアントと WebSocket で接続し，心拍が保存されたことを通知する
 */
export class HeartRateBroadcaster extends DurableObject<CloudflareBindings> {
  /**
   * WebSocket のアップグレード要求を受け付ける．アップグレード要求であることは呼び出し側で確認すること
   * @param _request アップグレード要求
   * @returns 101 Switching Protocols
   */
  override async fetch(_request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();
    // Hibernation API で受け付け，通知を待つ間は Durable Object を休止させて実行時間の課金を抑える
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * 接続中の全クライアントに心拍が保存されたことを通知する
   */
  notifySaved(): void {
    for (const webSocket of this.ctx.getWebSockets()) {
      try {
        webSocket.send(HEART_RATES_SAVED_MESSAGE);
      } catch (error) {
        // 切断処理中の接続への送信は失敗しうるが，他のクライアントへの通知は続ける
        console.warn('failed to notify heart rates saved', error);
      }
    }
  }

  /**
   * クライアントから切断されたときに，同じコードと理由で接続を閉じ返す
   * @param webSocket 切断された接続
   * @param code クライアントが送ったクローズコード
   * @param reason クライアントが送ったクローズ理由
   */
  override async webSocketClose(webSocket: WebSocket, code: number, reason: string): Promise<void> {
    // 既に閉じている場合や，1005 など送信できない予約済みのコードでは例外になるが，接続は閉じているため記録だけ残す
    try {
      webSocket.close(code, reason);
    } catch (error) {
      console.warn('failed to close heart rate websocket', error);
    }
  }
}
