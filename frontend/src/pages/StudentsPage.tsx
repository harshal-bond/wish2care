import { useState, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Input, Card, CardContent, Button } from '../components/ui';
import { Search, SearchX, ArrowRight, GraduationCap, UserPlus, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AddStudentModal } from '../components/forms/AddStudentModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { nameMatchesQuery, formatGender, formatAge } from '@wish2care/shared';
import { StudentStatusBadges } from '../components/StudentStatusBadges';
import { ClassSectionFilter, type ClassSectionFilterOptions } from '../components/ClassSectionFilter';
import { StudentStatsCards, type StudentStatusFilter } from '../components/StudentStatsCards';

type StatusFilter = StudentStatusFilter;

const STATUS_LABELS: Record<StatusFilter, string> = {
  complete: 'Completed',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

const PAGE_SIZE = 48;

export function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const rawStatus = searchParams.get('status');
  const statusFilter: StatusFilter | null =
    rawStatus === 'complete' || rawStatus === 'in_progress' || rawStatus === 'not_started'
      ? rawStatus
      : null;
  const classFilter = searchParams.get('className') || '';
  const sectionFilter = searchParams.get('section') || '';

  const { data: filterOptions, isLoading: filterOptionsLoading } = useQuery({
    queryKey: ['students-class-sections'],
    queryFn: () => fetchApi('/students/class-sections'),
    staleTime: 300_000,
  });

  const filterData: ClassSectionFilterOptions | undefined = filterOptions?.data;
  const classNames: string[] = filterData?.classNames ?? [];

  const deferredSearch = useDebouncedValue(searchTerm, 200);
  const q = deferredSearch.trim();
  const serverSearch = q.length >= 2 ? q : '';

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['students', 'stats', classFilter, sectionFilter, serverSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (classFilter) params.set('className', classFilter);
      if (sectionFilter) params.set('section', sectionFilter);
      if (serverSearch) params.set('search', serverSearch);
      const qs = params.toString();
      return fetchApi(`/students/stats${qs ? `?${qs}` : ''}`);
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const stats = statsData?.data;
  const statsCards = {
    total: stats?.total ?? 0,
    completed: stats?.completed ?? 0,
    inProgress: stats?.inProgress ?? 0,
    pending: stats?.pending ?? 0,
  };

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['students', serverSearch, statusFilter, classFilter, sectionFilter],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(pageParam));
      if (serverSearch) params.set('search', serverSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (classFilter) params.set('className', classFilter);
      if (sectionFilter) params.set('section', sectionFilter);
      return fetchApi(`/students/summary?${params.toString()}`);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.hasMore) return undefined;
      return allPages.reduce((n, p) => n + (p.data?.length || 0), 0);
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const students = useMemo(() => {
    const list = data?.pages.flatMap((p) => p.data || []) ?? [];
    if (serverSearch || !q) return list;
    const lower = q.toLowerCase();
    return list.filter(
      (s: { name?: string; studentCode?: string }) =>
        nameMatchesQuery(s.name, q) || s.studentCode?.toLowerCase().includes(lower)
    );
  }, [data?.pages, q, serverSearch]);

  const total = data?.pages[0]?.total ?? students.length;

  const clearStatusFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    setSearchParams(next, { replace: true });
  };

  const setClassFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('className', value);
    else next.delete('className');
    next.delete('section');
    setSearchParams(next, { replace: true });
  };

  const setSectionFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('section', value);
    else next.delete('section');
    setSearchParams(next, { replace: true });
  };

  const clearClassSectionFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('className');
    next.delete('section');
    setSearchParams(next, { replace: true });
  };

  const hasClassSectionFilter = Boolean(classFilter || sectionFilter);

  const filterSummary = hasClassSectionFilter
    ? [classFilter, sectionFilter ? `Sec ${sectionFilter}` : null].filter(Boolean).join(' · ')
    : null;

  const scopeLabel = [filterSummary, serverSearch ? `"${serverSearch}"` : null].filter(Boolean).join(' · ');
  const hasActiveScope = Boolean(scopeLabel);

  const getFilterHref = (status: StatusFilter | null) => {
    const params = new URLSearchParams(searchParams);
    if (status) params.set('status', status);
    else params.delete('status');
    const qs = params.toString();
    return qs ? `/students?${qs}` : '/students';
  };

  const statsSubtitle = hasActiveScope
    ? {
        total: scopeLabel ? `In ${scopeLabel}` : undefined,
        complete: 'Completed in current filter',
        inProgress: 'Started in current filter',
        notStarted: 'Awaiting data in current filter',
      }
    : undefined;

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {statusFilter ? STATUS_LABELS[statusFilter] : 'Students'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {statusFilter
              ? `${total} student${total === 1 ? '' : 's'} in this status — search within the list below.`
              : filterSummary
                ? `${total} student${total === 1 ? '' : 's'} in ${filterSummary}.`
                : 'Search and choose a student to start entering measurements.'}
          </p>
        </div>
        {statusFilter && (
          <Button
            variant="outline"
            onClick={clearStatusFilter}
            className="rounded-xl border-gray-200 font-semibold h-10 px-4 self-start sm:self-center"
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear status
          </Button>
        )}
      </div>

      <StudentStatsCards
        stats={statsCards}
        isLoading={statsLoading}
        activeStatus={statusFilter}
        getFilterHref={getFilterHref}
        subtitle={statsSubtitle}
      />

      {(classNames.length > 0 || hasClassSectionFilter || filterOptionsLoading) && (
        <ClassSectionFilter
          classFilter={classFilter}
          sectionFilter={sectionFilter}
          options={filterData}
          isLoading={filterOptionsLoading}
          onClassChange={setClassFilter}
          onSectionChange={setSectionFilter}
          onClear={clearClassSectionFilters}
        />
      )}

      {/* Prominent Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Type name or student code to search..."
          className="pl-12 h-14 text-base bg-white border-gray-200 rounded-2xl shadow-sm focus:ring-gray-950 focus:border-gray-950 transition-all duration-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isFetching && !isLoading ? (
          <div className="absolute right-4 top-4 h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : null}
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        </div>
      ) : students.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student: any) => {
              const lastSavedDate = student.healthRecord?.updatedAt
                ? new Date(student.healthRecord.updatedAt).toLocaleDateString()
                : 'Never';

              return (
                <Link key={student.id} to={`/students/${student.id}`} className="block h-full">
                  <Card className="hover:border-gray-900 hover:shadow-md transition-all duration-200 cursor-pointer h-full border border-gray-100 bg-white rounded-2xl flex flex-col">
                    <CardContent className="p-6 flex flex-col justify-between flex-1 space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <span className="inline-flex items-center rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 tracking-tight">
                            {student.studentCode}
                          </span>
                          <StudentStatusBadges status={student._status} />
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-xl text-gray-900 tracking-tight leading-tight group-hover:text-gray-950">
                            {student.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 leading-none pt-1">
                            <GraduationCap className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">
                              {student.className
                                ? `${student.className}${student.section ? ` · Sec ${student.section}` : ''}`
                                : student.school?.name}
                            </span>
                          </div>
                          {student.className && student.school?.name && (
                            <p className="text-[11px] text-gray-400 line-clamp-1">{student.school.name}</p>
                          )}
                        </div>

                        <div className="flex gap-4 text-xs font-medium text-gray-500 pt-1">
                          <div>
                            <span className="text-gray-400">Gender:</span> {formatGender(student.gender)}
                          </div>
                          <div>
                            <span className="text-gray-400">Age:</span> {formatAge(student.age)}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span>Last saved: {lastSavedDate}</span>
                        <span className="font-semibold text-gray-900 group-hover:text-gray-950 inline-flex items-center gap-1">
                          Edit
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-xl border-gray-200 font-semibold h-11 px-6"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more students'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto space-y-4">
          <SearchX className="mx-auto h-12 w-12 text-gray-300" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">No students found</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              {searchTerm
                ? `We couldn't find any students matching "${searchTerm}". Try a different spelling or student code.`
                : hasClassSectionFilter
                  ? `No students match ${filterSummary}. Try a different class or section.`
                  : statusFilter
                    ? `No students are currently in “${STATUS_LABELS[statusFilter]}”.`
                    : 'No students in this list yet.'}
            </p>
          </div>
          {searchTerm && (
            <div className="pt-4">
              <Button onClick={() => setShowAddModal(true)} className="rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-sm flex items-center justify-center gap-2 mx-auto h-12 px-6 font-semibold">
                <UserPlus className="h-4 w-4" />
                Add "{searchTerm}" Manually
              </Button>
            </div>
          )}
          {hasClassSectionFilter && !searchTerm && (
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={clearClassSectionFilters}
                className="rounded-xl border-gray-200 font-semibold h-10 px-4"
              >
                Clear class / section filters
              </Button>
            </div>
          )}
          {statusFilter && !searchTerm && !hasClassSectionFilter && (
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={clearStatusFilter}
                className="rounded-xl border-gray-200 font-semibold h-10 px-4"
              >
                Show all students
              </Button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddStudentModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            initialName={searchTerm}
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
