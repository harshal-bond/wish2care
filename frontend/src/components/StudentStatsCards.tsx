import { Link } from 'react-router-dom';
import { Users, CheckCircle, Clock, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui';

export type StudentStatusFilter = 'complete' | 'in_progress' | 'not_started';

export interface StudentStatsData {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

interface StudentStatsCardsProps {
  stats: StudentStatsData;
  isLoading?: boolean;
  activeStatus?: StudentStatusFilter | null;
  getFilterHref: (status: StudentStatusFilter | null) => string;
  subtitle?: {
    total?: string;
    complete?: string;
    inProgress?: string;
    notStarted?: string;
  };
}

export function StudentStatsCards({
  stats,
  isLoading,
  activeStatus,
  getFilterHref,
  subtitle,
}: StudentStatsCardsProps) {
  const { total, completed, inProgress, pending } = stats;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const statValue = (n: number) => (isLoading ? '—' : n);

  const cardRing = (status: StudentStatusFilter | null) => {
    if (activeStatus !== status) return '';
    if (status === 'complete') return 'ring-2 ring-emerald-200 border-emerald-200';
    if (status === 'in_progress') return 'ring-2 ring-amber-200 border-amber-200';
    if (status === 'not_started') return 'ring-2 ring-orange-200 border-orange-200';
    return 'ring-2 ring-gray-200 border-gray-300';
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Link to={getFilterHref(null)} className="block group">
        <Card
          className={`border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-gray-300 group-hover:shadow-md ${cardRing(null)}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Total Students</CardTitle>
            <div className="p-2 bg-gray-50 rounded-xl">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-gray-900">{statValue(total)}</div>
            <p className="text-xs text-gray-400 mt-1">{subtitle?.total ?? 'View all students'}</p>
          </CardContent>
        </Card>
      </Link>

      <Link to={getFilterHref('complete')} className="block group">
        <Card
          className={`border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-emerald-200 group-hover:shadow-md ${cardRing('complete')}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Fully Complete</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-emerald-600">{statValue(completed)}</div>
            <p className="text-xs text-gray-400 mt-1">{subtitle?.complete ?? 'Physical and mental submitted'}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 shrink-0">{isLoading ? '—' : `${progress}%`}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link to={getFilterHref('in_progress')} className="block group">
        <Card
          className={`border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-amber-200 group-hover:shadow-md ${cardRing('in_progress')}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">In Progress</CardTitle>
            <div className="p-2 bg-amber-50 rounded-xl">
              <UserCheck className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-amber-600">{statValue(inProgress)}</div>
            <p className="text-xs text-gray-400 mt-1">{subtitle?.inProgress ?? 'View started assessments'}</p>
          </CardContent>
        </Card>
      </Link>

      <Link to={getFilterHref('not_started')} className="block group">
        <Card
          className={`border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-orange-200 group-hover:shadow-md ${cardRing('not_started')}`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Not Started</CardTitle>
            <div className="p-2 bg-orange-50 rounded-xl">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-orange-500">{statValue(pending)}</div>
            <p className="text-xs text-gray-400 mt-1">{subtitle?.notStarted ?? 'View awaiting data entry'}</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
