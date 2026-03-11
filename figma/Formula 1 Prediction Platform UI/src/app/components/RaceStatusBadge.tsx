import { CheckCircle2, Clock, Zap } from 'lucide-react';

interface RaceStatusBadgeProps {
  status: 'upcoming' | 'live' | 'completed';
}

export function RaceStatusBadge({ status }: RaceStatusBadgeProps) {
  if (status === 'live') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-600/20 border border-red-600 rounded text-xs text-red-600">
        <Zap className="w-3 h-3 fill-red-600" />
        <span className="uppercase tracking-wide telemetry-text">LIVE</span>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-600/20 border border-green-600 rounded text-xs text-green-600">
        <CheckCircle2 className="w-3 h-3" />
        <span className="uppercase tracking-wide telemetry-text">COMPLETED</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-600/20 border border-blue-600 rounded text-xs text-blue-600">
      <Clock className="w-3 h-3" />
      <span className="uppercase tracking-wide telemetry-text">UPCOMING</span>
    </div>
  );
}
