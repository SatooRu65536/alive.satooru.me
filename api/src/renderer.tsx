import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, ViteClient } from 'vite-ssr-components/hono';

// og:image などは絶対 URL で書く
const SITE_URL = 'https://alive.satooru.me';

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>alive.satooru.me</title>
        <meta name="description" content="生きているかを確認できるサイト" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="alive.satooru.me" />
        <meta property="og:description" content="生きているかを確認できるサイト" />
        <meta property="og:image" content={`${SITE_URL}/ogp.webp`} />
        <meta property="og:image:type" content="image/webp" />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="720" />
        <meta property="og:image:alt" content="心拍数の推移を表すグラフ" />
        <meta name="twitter:card" content="summary_large_image" />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
});
