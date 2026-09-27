import { Circle, CircleCheck, Clock, OctagonAlert, TriangleAlert, Truck, type LucideIcon } from 'lucide-react';
import type { Tone } from '@/lib/types';

export const TONE_ICONS: Record<Tone, LucideIcon> = {
  neutral: Circle,
  info: Clock,
  active: Truck,
  success: CircleCheck,
  warning: TriangleAlert,
  critical: OctagonAlert,
};
