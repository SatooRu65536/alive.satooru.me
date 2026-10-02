import { timingSafeEqual } from 'hono/utils/buffer';

/**
 * 心拍送信 API へのリクエストのトークンが，サーバーに設定したトークンと一致するか判定する
 * @param token リクエストの Authorization ヘッダーから取り出したトークン
 * @param expectedToken サーバーに設定したトークン．文字列以外は未設定とみなす
 * @returns 一致する場合は true．サーバーのトークンが未設定または空の場合は常に false
 */
export async function verifyHeartRateApiToken({
  token,
  expectedToken,
}: {
  token: string;
  expectedToken: unknown;
}): Promise<boolean> {
  // シークレットの設定漏れで誰でも送信できる状態にならないよう，未設定時は拒否する
  if (typeof expectedToken !== 'string' || expectedToken === '') {
    console.error('HEART_RATE_API_TOKEN is not configured');
    return false;
  }
  return timingSafeEqual(token, expectedToken);
}
