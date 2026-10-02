/// <reference lib="dom" />
import {
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

import { HEART_RATE_RANGES, isHeartRateRangeKey, type HeartRateRange } from './heartRateRange';
import { parseHeartRateSummaries, type HeartRateSummary } from './heartRateSummary';
import { formatDisplayTime } from './heartRateTimeFormat';

Chart.register(Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip);

/**
 * CSS カスタムプロパティの値を読み取る
 * @param name `--` から始まるプロパティ名
 * @returns body に適用されている値
 */
function readCssVariable(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

/**
 * 心拍の集計結果を折れ線グラフとして canvas に描画する
 * @param canvas 描画先
 * @param range 表示期間
 * @param summaries bucketStartedAt 昇順の集計結果
 */
function renderHeartRateChart({
  canvas,
  range,
  summaries,
}: {
  canvas: HTMLCanvasElement;
  range: HeartRateRange;
  summaries: readonly HeartRateSummary[];
}): void {
  const lineColor = readCssVariable('--chart-line');
  const bandColor = readCssVariable('--chart-band');
  const gridColor = readCssVariable('--chart-grid');
  const textColor = readCssVariable('--text-muted');
  const toPoints = (selectBpm: (summary: HeartRateSummary) => number) =>
    summaries.map((summary) => ({ x: summary.bucketStartedAt, y: selectBpm(summary) }));
  const formatTime = (epochMs: number) =>
    formatDisplayTime({ epochMs, includesDate: range.includesDate });

  new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          label: '最大',
          data: toPoints((summary) => summary.maxBpm),
          borderWidth: 0,
          backgroundColor: bandColor,
          // 次のデータセット (最小) との間を塗り，ばらつきの幅を帯で示す
          fill: '+1',
        },
        {
          label: '最小',
          data: toPoints((summary) => summary.minBpm),
          borderWidth: 0,
          backgroundColor: bandColor,
          fill: false,
        },
        {
          label: '平均',
          data: toPoints((summary) => summary.averageBpm),
          borderColor: lineColor,
          backgroundColor: lineColor,
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      interaction: { mode: 'index', intersect: false },
      elements: { point: { radius: 0, hoverRadius: 4 }, line: { tension: 0.2 } },
      datasets: {
        // 計測していない時間帯を線で結ばないよう，集計単位 2 つ分を超える間隔では線を途切れさせる
        line: { spanGaps: range.bucketMs * 2 },
      },
      scales: {
        x: {
          type: 'linear',
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            maxTicksLimit: 8,
            callback: (value) => formatTime(Number(value)),
          },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor },
          title: { display: true, text: 'bpm', color: textColor },
        },
      },
      plugins: {
        legend: { labels: { color: textColor, filter: (item) => item.text === '平均' } },
        tooltip: {
          callbacks: {
            title: (items) => formatTime(items[0]?.parsed.x ?? 0),
            label: (item) => `${item.dataset.label}: ${Math.round(item.parsed.y ?? 0)} bpm`,
          },
        },
      },
    },
  });
}

/**
 * ページ内の canvas に埋め込まれた集計結果を読み取り，グラフを描画する．データが不正な場合はコンソールにエラーを出力する
 */
function initializeHeartRateChart(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#heart-rate-chart');
  if (canvas === null) return;

  const { rangeKey, summaries = '' } = canvas.dataset;
  const parseResult = parseHeartRateSummaries(summaries);
  if (!isHeartRateRangeKey(rangeKey) || !parseResult.ok) {
    console.error('heart rate chart data is invalid', { rangeKey, parseResult });
    return;
  }
  renderHeartRateChart({
    canvas,
    range: HEART_RATE_RANGES[rangeKey],
    summaries: parseResult.summaries,
  });
}

initializeHeartRateChart();
