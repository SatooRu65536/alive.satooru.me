import { Script } from 'vite-ssr-components/hono';

import { HEART_RATE_RANGE_KEYS, HEART_RATE_RANGES, type HeartRateRangeKey } from './heartRateRange';
import { buildHeartRateStatsText } from './heartRateStats';
import type { HeartRateSummary } from './heartRateSummary';

export function HeartRatePage({
  rangeKey,
  summaries,
  latestMeasuredAt,
  isAlive,
}: {
  rangeKey: HeartRateRangeKey;
  summaries: readonly HeartRateSummary[];
  latestMeasuredAt: number | undefined;
  isAlive: boolean;
}) {
  const statsText = buildHeartRateStatsText(summaries);
  return (
    <main class="heart-rate-page">
      {/* 時間の経過だけで表示が変わるため，ブラウザ側で最新の計測時刻から判定し直す */}
      <p
        id="heart-rate-alive-warning"
        class="alive-warning"
        role="alert"
        hidden={isAlive}
        data-latest-measured-at={latestMeasuredAt}
      >
        生きていない可能性があります
      </p>
      <h1>心拍数</h1>
      <nav class="range-tabs" aria-label="表示期間">
        {HEART_RATE_RANGE_KEYS.map((key) => (
          <a href={`/?range=${key}`} aria-current={key === rangeKey ? 'page' : undefined}>
            {HEART_RATE_RANGES[key].label}
          </a>
        ))}
      </nav>
      {/* 新しい心拍が届いたときにブラウザ側で切り替えられるよう，データの有無によらず両方を描画しておく */}
      <p id="heart-rate-empty" class="empty-message" hidden={statsText !== undefined}>
        この期間の心拍データはありません
      </p>
      <div id="heart-rate-content" hidden={statsText === undefined}>
        <dl class="stats">
          <div>
            <dt>
              最新 (<span data-stat="latestTime">{statsText?.latestTime}</span>)
            </dt>
            <dd>
              <span data-stat="latestBpm">{statsText?.latestBpm}</span> bpm
            </dd>
          </div>
          <div>
            <dt>最小</dt>
            <dd>
              <span data-stat="minBpm">{statsText?.minBpm}</span> bpm
            </dd>
          </div>
          <div>
            <dt>最大</dt>
            <dd>
              <span data-stat="maxBpm">{statsText?.maxBpm}</span> bpm
            </dd>
          </div>
        </dl>
        <div class="chart-container">
          <canvas
            id="heart-rate-chart"
            data-range-key={rangeKey}
            data-summaries={JSON.stringify(summaries)}
            aria-label={`直近${HEART_RATE_RANGES[rangeKey].label}の心拍数の推移`}
          />
        </div>
      </div>
      <Script src="/src/heartRate/heartRateChart.ts" />
    </main>
  );
}
