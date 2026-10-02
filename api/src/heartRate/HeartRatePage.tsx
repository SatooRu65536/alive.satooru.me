import { Script } from 'vite-ssr-components/hono';

import { HEART_RATE_RANGE_KEYS, HEART_RATE_RANGES, type HeartRateRangeKey } from './heartRateRange';
import type { HeartRateSummary } from './heartRateSummary';
import { formatDisplayTime } from './heartRateTimeFormat';

export function HeartRatePage({
  rangeKey,
  summaries,
}: {
  rangeKey: HeartRateRangeKey;
  summaries: readonly HeartRateSummary[];
}) {
  const latestSummary = summaries.at(-1);
  return (
    <main class="heart-rate-page">
      <h1>心拍数</h1>
      <nav class="range-tabs" aria-label="表示期間">
        {HEART_RATE_RANGE_KEYS.map((key) => (
          <a href={`/?range=${key}`} aria-current={key === rangeKey ? 'page' : undefined}>
            {HEART_RATE_RANGES[key].label}
          </a>
        ))}
      </nav>
      {latestSummary === undefined ? (
        <p class="empty-message">この期間の心拍データはありません</p>
      ) : (
        <>
          <dl class="stats">
            <div>
              <dt>
                最新 (
                {formatDisplayTime({ epochMs: latestSummary.bucketStartedAt, includesDate: true })})
              </dt>
              <dd>{Math.round(latestSummary.averageBpm)} bpm</dd>
            </div>
            <div>
              <dt>最小</dt>
              <dd>{Math.round(Math.min(...summaries.map((summary) => summary.minBpm)))} bpm</dd>
            </div>
            <div>
              <dt>最大</dt>
              <dd>{Math.round(Math.max(...summaries.map((summary) => summary.maxBpm)))} bpm</dd>
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
          <Script src="/src/heartRate/heartRateChart.ts" />
        </>
      )}
    </main>
  );
}
