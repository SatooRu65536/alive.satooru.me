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
  type Point,
} from 'chart.js';

import {
  isHeartRateAlive,
  parseLatestMeasuredAt,
  parseLatestMeasuredAtAttribute,
  type LatestMeasuredAtParseResult,
} from './heartRateLiveness';
import {
  HEART_RATE_RANGES,
  isHeartRateRangeKey,
  type HeartRateRange,
  type HeartRateRangeKey,
} from './heartRateRange';
import { buildHeartRateStatsText, type HeartRateStatsText } from './heartRateStats';
import {
  buildHeartRateStreamUrl,
  buildHeartRateSummariesPath,
  calculateReconnectDelayMs,
} from './heartRateStream';
import { parseHeartRateSummaries, type HeartRateSummary } from './heartRateSummary';
import { formatDisplayTime } from './heartRateTimeFormat';

Chart.register(Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip);

// 新しい心拍が届かなくても時間の経過で警告を出せるよう，この間隔で判定し直す
const ALIVE_CHECK_INTERVAL_MS = 10_000;

/**
 * CSS カスタムプロパティの値を読み取る
 * @param name `--` から始まるプロパティ名
 * @returns body に適用されている値
 */
function readCssVariable(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

/**
 * 集計結果からグラフの 1 系列分の点を作る
 * @param summaries bucketStartedAt 昇順の集計結果
 * @param selectBpm 系列として描く値を集計結果から選ぶ関数
 * @returns x が bucketStartedAt，y が選んだ値の点の配列
 */
function buildPoints({
  summaries,
  selectBpm,
}: {
  summaries: readonly HeartRateSummary[];
  selectBpm: (summary: HeartRateSummary) => number;
}): Point[] {
  return summaries.map((summary) => ({ x: summary.bucketStartedAt, y: selectBpm(summary) }));
}

/**
 * 心拍の集計結果を折れ線グラフとして canvas に描画する
 * @param canvas 描画先
 * @param range 表示期間
 * @param summaries bucketStartedAt 昇順の集計結果
 * @returns 描画したグラフ．updateHeartRateChart で集計結果を差し替えられる
 */
function renderHeartRateChart({
  canvas,
  range,
  summaries,
}: {
  canvas: HTMLCanvasElement;
  range: HeartRateRange;
  summaries: readonly HeartRateSummary[];
}): Chart<'line', Point[]> {
  const lineColor = readCssVariable('--chart-line');
  const bandColor = readCssVariable('--chart-band');
  const gridColor = readCssVariable('--chart-grid');
  const textColor = readCssVariable('--text-muted');
  const formatTime = (epochMs: number) =>
    formatDisplayTime({ epochMs, includesDate: range.includesDate });

  return new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          label: '最大',
          data: buildPoints({ summaries, selectBpm: (summary) => summary.maxBpm }),
          borderWidth: 0,
          backgroundColor: bandColor,
          // 次のデータセット (最小) との間を塗り，ばらつきの幅を帯で示す
          fill: '+1',
        },
        {
          label: '最小',
          data: buildPoints({ summaries, selectBpm: (summary) => summary.minBpm }),
          borderWidth: 0,
          backgroundColor: bandColor,
          fill: false,
        },
        {
          label: '平均',
          data: buildPoints({ summaries, selectBpm: (summary) => summary.averageBpm }),
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
 * グラフの集計結果を差し替えて再描画する
 * @param chart renderHeartRateChart で描画したグラフ
 * @param summaries bucketStartedAt 昇順の集計結果
 */
function updateHeartRateChart({
  chart,
  summaries,
}: {
  chart: Chart<'line', Point[]>;
  summaries: readonly HeartRateSummary[];
}): void {
  // データセットの並びは renderHeartRateChart で定義した最大・最小・平均の順
  const [maxDataset, minDataset, averageDataset] = chart.data.datasets;
  if (maxDataset === undefined || minDataset === undefined || averageDataset === undefined) return;
  // Chart.js はデータセットを差し替えてから update を呼ぶ設計のため，ここでは直接代入する
  maxDataset.data = buildPoints({ summaries, selectBpm: (summary) => summary.maxBpm });
  minDataset.data = buildPoints({ summaries, selectBpm: (summary) => summary.minBpm });
  averageDataset.data = buildPoints({ summaries, selectBpm: (summary) => summary.averageBpm });
  chart.update();
}

/**
 * 最新・最小・最大の表示と，データの有無による表示の切り替えを集計結果に合わせて更新する
 * @param statsText buildHeartRateStatsText の結果．データがない場合は undefined
 */
function updateHeartRateStats(statsText: HeartRateStatsText | undefined): void {
  const content = document.querySelector<HTMLElement>('#heart-rate-content');
  const emptyMessage = document.querySelector<HTMLElement>('#heart-rate-empty');
  if (content === null || emptyMessage === null) return;

  content.hidden = statsText === undefined;
  emptyMessage.hidden = statsText !== undefined;
  if (statsText === undefined) return;
  content.querySelectorAll<HTMLElement>('[data-stat]').forEach((element) => {
    const key = element.dataset.stat;
    if (key === 'latestTime' || key === 'latestBpm' || key === 'minBpm' || key === 'maxBpm') {
      element.textContent = statsText[key];
    }
  });
}

/**
 * 表示期間の最新の集計結果を API から取得する
 * @param rangeKey 表示期間
 * @returns 検証済みの集計結果．取得や検証に失敗した場合はコンソールにエラーを出力して undefined
 */
async function fetchHeartRateSummaries(
  rangeKey: HeartRateRangeKey,
): Promise<readonly HeartRateSummary[] | undefined> {
  try {
    const response = await fetch(buildHeartRateSummariesPath(rangeKey));
    if (!response.ok) {
      console.error('failed to fetch heart rate summaries', { status: response.status });
      return undefined;
    }
    const parseResult = parseHeartRateSummaries(await response.text());
    if (!parseResult.ok) {
      console.error('heart rate summaries response is invalid', parseResult.error);
      return undefined;
    }
    return parseResult.summaries;
  } catch (error) {
    console.error('failed to fetch heart rate summaries', error);
    return undefined;
  }
}

/**
 * 最新の心拍の計測時刻を API から取得する
 * @returns 検証済みの最新の計測時刻．取得や検証に失敗した場合はエラーメッセージ
 */
async function fetchLatestMeasuredAt(): Promise<LatestMeasuredAtParseResult> {
  try {
    const response = await fetch('/api/heart-rates/latest');
    if (!response.ok) return { ok: false, error: `unexpected status ${response.status}` };
    return parseLatestMeasuredAt(await response.text());
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/**
 * 心拍の保存通知を WebSocket で購読する．切断された場合は間隔を空けて再接続し続ける
 * @param onSaved 心拍が保存されたとき，および接続したときに呼び出す関数．接続時はページの描画から接続までや切断中の保存を取りこぼさないよう呼び出す
 */
function subscribeHeartRatesSaved(onSaved: () => void): void {
  let reconnectAttemptCount = 0;

  const connect = (): void => {
    const webSocket = new WebSocket(buildHeartRateStreamUrl(location));
    webSocket.addEventListener('open', () => {
      reconnectAttemptCount = 0;
      onSaved();
    });
    webSocket.addEventListener('message', () => onSaved());
    webSocket.addEventListener('close', () => {
      setTimeout(connect, calculateReconnectDelayMs(reconnectAttemptCount));
      reconnectAttemptCount += 1;
    });
  };
  connect();
}

/**
 * ページ内の canvas に埋め込まれた集計結果でグラフを描画する．データが不正な場合はコンソールにエラーを出力する
 * @returns 描画したグラフと表示期間．canvas がないかデータが不正な場合は undefined
 */
function initializeHeartRateChart():
  | { chart: Chart<'line', Point[]>; rangeKey: HeartRateRangeKey }
  | undefined {
  const canvas = document.querySelector<HTMLCanvasElement>('#heart-rate-chart');
  if (canvas === null) return undefined;

  const { rangeKey, summaries = '' } = canvas.dataset;
  const parseResult = parseHeartRateSummaries(summaries);
  if (!isHeartRateRangeKey(rangeKey) || !parseResult.ok) {
    console.error('heart rate chart data is invalid', { rangeKey, parseResult });
    return undefined;
  }
  const chart = renderHeartRateChart({
    canvas,
    range: HEART_RATE_RANGES[rangeKey],
    summaries: parseResult.summaries,
  });
  return { chart, rangeKey };
}

/**
 * 直近に心拍が届いていない場合の警告を，時間の経過に合わせて表示・非表示にし続ける
 * @returns 最新の計測時刻を差し替えて判定し直す関数．警告の要素がない場合は undefined
 */
function initializeAliveWarning(): ((latestMeasuredAt: number | undefined) => void) | undefined {
  const warning = document.querySelector<HTMLElement>('#heart-rate-alive-warning');
  if (warning === null) return undefined;

  let latestMeasuredAt = parseLatestMeasuredAtAttribute(warning.dataset.latestMeasuredAt);
  const render = (): void => {
    warning.hidden = isHeartRateAlive({ latestMeasuredAt, now: Date.now() });
  };
  render();
  setInterval(render, ALIVE_CHECK_INTERVAL_MS);
  return (nextLatestMeasuredAt) => {
    latestMeasuredAt = nextLatestMeasuredAt;
    render();
  };
}

/**
 * グラフと警告を初期化し，心拍が保存されるたびに最新の集計結果と計測時刻で更新する
 */
function initializeHeartRatePage(): void {
  const chartState = initializeHeartRateChart();
  const updateLatestMeasuredAt = initializeAliveWarning();

  const refreshChart = async (): Promise<void> => {
    if (chartState === undefined) return;
    const latestSummaries = await fetchHeartRateSummaries(chartState.rangeKey);
    if (latestSummaries === undefined) return;
    updateHeartRateChart({ chart: chartState.chart, summaries: latestSummaries });
    updateHeartRateStats(buildHeartRateStatsText(latestSummaries));
  };
  const refreshAliveWarning = async (): Promise<void> => {
    if (updateLatestMeasuredAt === undefined) return;
    const result = await fetchLatestMeasuredAt();
    if (!result.ok) {
      console.error('failed to fetch latest heart rate', result.error);
      return;
    }
    updateLatestMeasuredAt(result.latestMeasuredAt);
  };

  // 通知が続けて届いても取得を並行させず，取得中に届いた分は取得後にまとめて 1 回だけ取り直す
  let isRefreshing = false;
  let hasPendingRefresh = false;
  const refresh = async (): Promise<void> => {
    if (isRefreshing) {
      hasPendingRefresh = true;
      return;
    }
    isRefreshing = true;
    do {
      hasPendingRefresh = false;
      await Promise.all([refreshChart(), refreshAliveWarning()]);
    } while (hasPendingRefresh);
    isRefreshing = false;
  };
  subscribeHeartRatesSaved(() => void refresh());
}

initializeHeartRatePage();
