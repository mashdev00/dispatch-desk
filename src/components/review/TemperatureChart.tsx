'use client';

import { formatTemp, formatTempRange } from '@/lib/format';
import { formatTime, toMs } from '@/lib/time';
import type { Trip } from '@/lib/types';
import Card from '@/components/ui/Card';
import styles from './TemperatureChart.module.css';

const WIDTH = 320;
const HEIGHT = 160;
const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

export default function TemperatureChart({ trip }: { trip: Trip }) {
  const band = trip.cargo.tempRangeC;
  const readings = trip.temperatureLog;
  if (!band || readings.length === 0) return null;

  const values = readings.map((r) => r.celsius);
  const yMin = Math.floor(Math.min(band.min, ...values) - 1);
  const yMax = Math.ceil(Math.max(band.max, ...values) + 1);
  const t0 = toMs(readings[0].at);
  const t1 = toMs(readings[readings.length - 1].at);
  const x = (at: string) => PAD.left + ((toMs(at) - t0) / Math.max(1, t1 - t0)) * (WIDTH - PAD.left - PAD.right);
  const y = (c: number) => PAD.top + ((yMax - c) / (yMax - yMin)) * (HEIGHT - PAD.top - PAD.bottom);
  const outside = (c: number) => c < band.min || c > band.max;

  const latest = readings[readings.length - 1];
  // Start of the current run of out-of-range readings, if the latest one is out of range.
  let since: string | null = null;
  for (let i = readings.length - 1; i >= 0 && outside(readings[i].celsius); i--) since = readings[i].at;

  const summary =
    `Now ${formatTemp(latest.celsius)}. Allowed ${formatTempRange(band)}.` +
    (since ? ` Out of range since ${formatTime(since)}.` : ' Within range.');

  const path = readings.map((r, i) => `${i ? 'L' : 'M'}${x(r.at).toFixed(1)},${y(r.celsius).toFixed(1)}`).join(' ');

  return (
    <Card title="Temperature">
      <figure className={styles.figure}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.chart} role="img" aria-label={summary}>
          <rect
            x={PAD.left}
            y={y(band.max)}
            width={WIDTH - PAD.left - PAD.right}
            height={y(band.min) - y(band.max)}
            className={styles.band}
          />
          <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={HEIGHT - PAD.bottom} className={styles.axis} />
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} className={styles.axis} />
          {[band.max, band.min].map((value) => (
            <text key={value} x={PAD.left - 6} y={y(value) + 4} textAnchor="end" className={styles.label}>
              {value}°
            </text>
          ))}
          <text x={PAD.left} y={HEIGHT - 6} className={styles.label}>
            {formatTime(readings[0].at)}
          </text>
          <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className={styles.label}>
            {formatTime(latest.at)}
          </text>
          <path d={path} className={styles.line} />
          {readings.map((r) => (
            <circle
              key={r.at}
              cx={x(r.at)}
              cy={y(r.celsius)}
              r={outside(r.celsius) ? 3.5 : 2}
              className={outside(r.celsius) ? styles.pointOut : styles.point}
            />
          ))}
        </svg>
        <figcaption className={since ? styles.captionAlert : styles.caption}>{summary}</figcaption>
      </figure>
      <details className={styles.tableToggle}>
        <summary>Show readings as a table</summary>
        <table className={styles.table}>
          <caption className="visually-hidden">Last {Math.min(12, readings.length)} temperature readings</caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Reading</th>
              <th scope="col">In range</th>
            </tr>
          </thead>
          <tbody>
            {readings
              .slice(-12)
              .reverse()
              .map((r) => (
                <tr key={r.at}>
                  <td>{formatTime(r.at)}</td>
                  <td>{formatTemp(r.celsius)}</td>
                  <td>{outside(r.celsius) ? 'No' : 'Yes'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </Card>
  );
}
