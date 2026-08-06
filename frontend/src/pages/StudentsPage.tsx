import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Input, Card, CardContent, Button } from '../components/ui';
import { Search, SearchX, ArrowRight, GraduationCap, UserPlus, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AddStudentModal } from '../components/forms/AddStudentModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

type StatusFilter = 'complete' | 'in_progress' | 'not_started';

const STATUS_LABELS: Record<StatusFilter, string> = {
  complete: 'Fully Complete',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

function matchesStatus(student: any, status: StatusFilter) {
  const isComplete = !!student._status?.isComplete;
  const domains = student._status?.completedDomains ?? 0;
  if (status === 'complete') return isComplete;
  if (status === 'in_progress') return !isComplete && domains > 0;
  return !isComplete && domains === 0;
}

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

  // Load the school-scoped list once; filter locally so typing stays snappy
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['students'],
    queryFn: () => fetchApi('/students'),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const deferredSearch = useDeferredValue(useDebouncedValue(searchTerm, 150));
  const q = deferredSearch.trim().toLowerCase();

  const students = useMemo(() => {
    let list = data?.data || [];
    if (statusFilter) {
      list = list.filter((s: any) => matchesStatus(s, statusFilter));
    }
    if (!q) return list;
    return list.filter(
      (s: { name?: string; studentCode?: string }) =>
        s.name?.toLowerCase().includes(q) || s.studentCode?.toLowerCase().includes(q)
    );
  }, [data?.data, q, statusFilter]);

  const clearStatusFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    setSearchParams(next, { replace: true });
  };

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
              ? `${students.length} student${students.length === 1 ? '' : 's'} in this status — search within the list below.`
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
            Clear filter
          </Button>
        )}
      </div>

      {statusFilter && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSearchParams({ status: key }, { replace: true })}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors ${
                statusFilter === key
                  ? key === 'complete'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : key === 'in_progress'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {STATUS_LABELS[key]}
            </button>
          ))}
        </div>
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student: any, idx: number) => {
            const lastSavedDate = student.healthRecord?.updatedAt 
              ? new Date(student.healthRecord.updatedAt).toLocaleDateString()
              : 'Never';

            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12, delay: Math.min(idx, 12) * 0.02 }}
                key={student.id}
                className="h-full"
              >
                <Link to={`/students/${student.id}`} className="block h-full">
                  <Card className="hover:border-gray-900 hover:shadow-md transition-all duration-200 cursor-pointer h-full border border-gray-100 bg-white rounded-2xl flex flex-col">
                    <CardContent className="p-6 flex flex-col justify-between flex-1 space-y-6">
                      <div className="space-y-4">
                        {/* Status + Student Code Header */}
                        <div className="flex justify-between items-start gap-2">
                          <span className="inline-flex items-center rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 tracking-tight">
                            {student.studentCode}
                          </span>
                          
                          {student._status.isComplete ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                              Complete
                            </span>
                          ) : (student._status.completedDomains ?? 0) > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                              {student._status.completedDomains}/8 In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
                              Not Started
                            </span>
                          )}
                        </div>

                        {/* Name + School Info */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-xl text-gray-900 tracking-tight leading-tight group-hover:text-gray-950">
                            {student.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 leading-none pt-1">
                            <GraduationCap className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{student.school?.name}</span>
                          </div>
                        </div>

                        {/* Demographic details */}
                        <div className="flex gap-4 text-xs font-medium text-gray-500 pt-1">
                          <div>
                            <span className="text-gray-400">Gender:</span> {student.gender === 'M' ? 'Male' : 'Female'}
                          </div>
                          <div>
                            <span className="text-gray-400">Age:</span> {student.age} yrs
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer tracking */}
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
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto space-y-4">
          <SearchX className="mx-auto h-12 w-12 text-gray-300" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">No students found</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              {searchTerm
                ? `We couldn't find any students matching "${searchTerm}". Try a different spelling or student code.`
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
          {statusFilter && !searchTerm && (
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
