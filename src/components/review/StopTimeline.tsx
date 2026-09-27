'use client';

import { Circle, CircleCheck, CircleDot, Navigation, TriangleAlert } from 'lucide-react';
import { getOpenExceptions } from '@/lib/exceptions';
import { stopLabel } from '@/lib/lookups';
import { formatDuration, formatTime, formatWindow, minutesBetween } from '@/lib/time';
import type { Stop, Tone, Trip } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cx } from '@/components/ui/cx';
import styles from './StopTimeline.module.css';

type StopState = 'done' | 'current' | 'upcoming' | 'problem';

const MARKERS = { done: CircleCheck, current: CircleDot, upcoming: Circle, problem: TriangleAlert };
const STATE_TEXT: Record<StopState, string> = {
  done: 'Done',
  current: 'Current stop',
  upcoming: 'Upcoming',
  problem: 'Has a problem',
};

function timing(stop: Stop): { label: string; tone: Tone } | null {
  const reference = stop.arrivedAt ?? stop.eta;
  if (!reference) return null;
  const late = minutesBetween(stop.windowEnd, reference);
  if (late > 0) return { label: `${formatDuration(late)} late`, tone: 'warning' };
  if (minutesBetween(stop.windowStart, reference) < 0) return { label: 'Early', tone: 'info' };
  return { label: 'On time', tone: 'success' };
}

type StopTimelineProps = { trip: Trip; onReschedule: (stopId: string) => void };

export default function StopTimeline({ trip, onReschedule }: StopTimelineProps) {
  const active = trip.status === 'scheduled' || trip.status === 'in_transit';
  const problemStops = new Set(getOpenExceptions(trip).map((e) => e.stopId).filter(Boolean));
  // The truck is either at a stop (arrived, not left) or on the way to the first stop it hasn't reached.
  const atStop = active ? trip.stops.find((s) => s.arrivedAt && !s.departedAt && s !== trip.stops[trip.stops.length - 1]) : undefined;
  const nextStop = active ? trip.stops.find((s) => !s.arrivedAt) : undefined;
  const currentStop = atStop ?? nextStop;
  const lastDeparted = [...trip.stops].reverse().find((s) => s.departedAt);
  const showPosition = active && trip.tracking && !atStop && nextStop && lastDeparted;

  function stateOf(stop: Stop): StopState {
    if (problemStops.has(stop.id)) return 'problem';
    if (stop === currentStop) return 'current';
    if (stop.arrivedAt) return 'done';
    return 'upcoming';
  }

  return (
    <section aria-labelledby="route-title" className={styles.panel}>
      <h2 id="route-title" className={styles.title}>
        Route
      </h2>
      <ol className={styles.list}>
        {trip.stops.map((stop) => {
          const state = stateOf(stop);
          const Marker = MARKERS[state];
          const chip = timing(stop);
          return (
            <li key={stop.id} className={cx(styles.stop, styles[state])}>
              {showPosition && stop === nextStop && trip.tracking && (
                <div className={styles.position}>
                  <Navigation size={14} aria-hidden="true" />
                  <span>
                    Last seen {formatTime(trip.tracking.lastPingAt)} · {trip.tracking.locationLabel} ·{' '}
                    {trip.tracking.speedKph} km/h
                  </span>
                </div>
              )}
              <div className={styles.row}>
                <span className={styles.marker}>
                  <Marker size={20} aria-hidden="true" />
                  <span className="visually-hidden">{STATE_TEXT[state]}: </span>
                </span>
                <div className={styles.body}>
                  <div className={styles.heading}>
                    <h3 className={styles.stopTitle}>{stopLabel(trip, stop)}</h3>
                    {chip && <Badge tone={chip.tone}>{chip.label}</Badge>}
                  </div>
                  <p className={styles.site}>{stop.siteName}</p>
                  <p className={styles.times}>
                    <span>Window {formatWindow(stop.windowStart, stop.windowEnd)}</span>
                    {stop.arrivedAt && <span>Arrived {formatTime(stop.arrivedAt)}</span>}
                    {stop.departedAt && <span>Left {formatTime(stop.departedAt)}</span>}
                    {stop === atStop && !stop.departedAt && <span>At the stop now</span>}
                    {!stop.arrivedAt && stop.eta && <span>ETA {formatTime(stop.eta)}</span>}
                    {!stop.arrivedAt && !stop.eta && trip.status === 'in_transit' && <span>No ETA</span>}
                  </p>
                </div>
                {active && !stop.arrivedAt && (
                  <Button size="sm" variant="ghost" onClick={() => onReschedule(stop.id)} className={styles.reschedule}>
                    Reschedule<span className="visually-hidden"> {stopLabel(trip, stop)}</span>
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
