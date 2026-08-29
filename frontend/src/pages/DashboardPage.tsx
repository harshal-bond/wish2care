import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { Users, CheckCircle, Clock, Search, ArrowRight, UserCheck, Calendar, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { AddStudentModal } from '../components/forms/AddStudentModal';
import { Button } from '../components/ui';
import { screeningStatusLabel, StudentStatusBadges } from '../components/StudentStatusBadges';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const debouncedSearch = useDebouncedValue(search, 250);
  const searchQ = debouncedSearch.trim();

  const { data, isLoading } = useQuery({
    queryKey: ['students', 'stats'],
    queryFn: async () => {
      try {
        const res = await fetchApi('/students/stats');
        if (res?.data && typeof res.data.total === 'number') return res;
      } catch {
        // Older backends have no /stats — use the unbounded COUNT from /summary.
      }
      const summary = await fetchApi('/students/summary?limit=1');
      return {
        success: true,
        data: {
          total: Number(summary?.total) || 0,
          completed: 0,
          inProgress: 0,
          pending: Number(summary?.total) || 0,
          recent: summary?.data || [],
        },
      };
    },
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ['students', 'search', searchQ],
    queryFn: () => fetchApi(`/students/summary?search=${encodeURIComponent(searchQ)}&limit=8`),
    enabled: searchQ.length >= 2,
    staleTime: 30_000,
  });

  const stats = data?.data;
  const total = stats?.total ?? 0;
  const completed = stats?.completed ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const pending = stats?.pending ?? Math.max(0, total - completed - inProgress);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const recent = stats?.recent ?? [];
  const lastEditedStudent = recent[0];
  const searchResults = searchData?.data || [];

  const hours = new Date().getHours();
  let greet = 'Good morning';
  if (hours >= 12 && hours < 17) greet = 'Good afternoon';
  else if (hours >= 17) greet = 'Good evening';

  const statValue = (n: number) => (isLoading ? '—' : n);

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{greet}, Wish2Care</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            className="pl-10 h-11 bg-white border-gray-200 rounded-xl shadow-sm text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
              {search.trim().length < 2 ? (
                <div className="p-3 text-center text-sm text-gray-400">Type at least 2 characters</div>
              ) : searching ? (
                <div className="p-3 text-center text-sm text-gray-400">Searching…</div>
              ) : searchResults.length > 0 ? (
                searchResults.slice(0, 4).map((s: any) => (
                  <Link
                    key={s.id}
                    to={`/students/${s.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.studentCode}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))
              ) : (
                <div className="p-3 text-center bg-gray-50/50">
                  <p className="text-sm text-gray-500 mb-2">No students found.</p>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="outline"
                    className="w-full text-xs font-semibold h-8 rounded-lg shadow-sm bg-white hover:bg-gray-50 text-gray-700"
                  >
                    <UserPlus className="h-3 w-3 mr-1.5" />
                    Add "{search}" Manually
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Cards — click a status to open that filtered student list */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/students" className="block group">
          <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-gray-300 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Total Students</CardTitle>
              <div className="p-2 bg-gray-50 rounded-xl">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-gray-900">{statValue(total)}</div>
              <p className="text-xs text-gray-400 mt-1">View all students</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students?status=complete" className="block group">
          <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-emerald-200 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Fully Complete</CardTitle>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-emerald-600">{statValue(completed)}</div>
              <p className="text-xs text-gray-400 mt-1">Physical and mental submitted</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 shrink-0">{isLoading ? '—' : `${progress}%`}</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students?status=in_progress" className="block group">
          <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-amber-200 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">In Progress</CardTitle>
              <div className="p-2 bg-amber-50 rounded-xl">
                <UserCheck className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-amber-600">{statValue(inProgress)}</div>
              <p className="text-xs text-gray-400 mt-1">View started assessments</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students?status=not_started" className="block group">
          <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-200 group-hover:border-orange-200 group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Not Started</CardTitle>
              <div className="p-2 bg-orange-50 rounded-xl">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-orange-500">{statValue(pending)}</div>
              <p className="text-xs text-gray-400 mt-1">View awaiting data entry</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Continue Last Student Card */}
        <div className="md:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Activity</h2>
          {isLoading ? (
            <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl p-6 text-center text-gray-400 text-sm">
              Loading recent activity…
            </Card>
          ) : lastEditedStudent ? (
            <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden relative group hover:border-gray-300 transition-all duration-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <UserCheck className="h-3.5 w-3.5" />
                    Last Updated
                  </div>
                  <span className="text-xs text-gray-400">
                    {lastEditedStudent.healthRecord?.updatedAt ? new Date(lastEditedStudent.healthRecord.updatedAt).toLocaleDateString() : ''}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-950 transition-colors">
                    {lastEditedStudent.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{lastEditedStudent.studentCode}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-1">{lastEditedStudent.school?.name}</p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    {screeningStatusLabel(lastEditedStudent._status)}
                  </span>
                  <Link
                    to={`/students/${lastEditedStudent.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Continue
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl p-6 text-center text-gray-400 text-sm">
              No recent activity. Select a student to start.
            </Card>
          )}
        </div>

        {/* Recent Work list */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Screenings</h2>
            <Link to="/students" className="text-xs font-semibold text-gray-900 hover:underline">View all students</Link>
          </div>

          <div className="space-y-3">
            {recent.slice(0, 5).map((student: any) => (
              <Link
                key={student.id}
                to={`/students/${student.id}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-1.5 min-w-0 pr-4">
                  <p className="font-semibold text-gray-900 truncate leading-none">{student.name}</p>
                  <p className="text-xs text-gray-400">
                    {student.studentCode} • <span className="text-gray-500">{student.school?.name}</span>
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <StudentStatusBadges status={student._status} />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}

            {!isLoading && recent.length === 0 && (
              <p className="text-center text-gray-400 py-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
                No students registered yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddStudentModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            initialName={search}
            user={user}
            onSuccess={(newId) => {
              queryClient.invalidateQueries({ queryKey: ['students'] });
              navigate(`/students/${newId}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
