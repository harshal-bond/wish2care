import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Input, Card, CardContent, Button } from '../components/ui';
import { Search, SearchX, ArrowRight, Building2, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AddStaffModal } from '../components/forms/AddStaffModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['staff'],
    queryFn: () => fetchApi('/staff'),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const deferredSearch = useDeferredValue(useDebouncedValue(searchTerm, 150));
  const q = deferredSearch.trim().toLowerCase();

  const staffList = useMemo(() => {
    const list = data?.data || [];
    if (!q) return list;
    return list.filter(
      (s: { name?: string; staffCode?: string }) =>
        s.name?.toLowerCase().includes(q) || s.staffCode?.toLowerCase().includes(q)
    );
  }, [data?.data, q]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff</h1>
          <p className="text-gray-500 mt-1 text-sm">
            College staff assessments — search and open a profile to continue.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-gray-950 hover:bg-gray-800 text-white h-10 px-4 font-semibold self-start"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add Staff
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Type name or staff code to search..."
          className="pl-12 h-14 text-base bg-white border-gray-200 rounded-2xl shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isFetching && !isLoading ? (
          <div className="absolute right-4 top-4 h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        </div>
      ) : staffList.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((member: any, idx: number) => {
            const lastSavedDate = member.assessment?.updatedAt
              ? new Date(member.assessment.updatedAt).toLocaleDateString()
              : 'Never';

            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12, delay: Math.min(idx, 12) * 0.02 }}
                key={member.id}
                className="h-full"
              >
                <Link to={`/staff/${member.id}`} className="block h-full">
                  <Card className="hover:border-gray-900 hover:shadow-md transition-all duration-200 cursor-pointer h-full border border-gray-100 bg-white rounded-2xl flex flex-col">
                    <CardContent className="p-6 flex flex-col justify-between flex-1 space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <span className="inline-flex items-center rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 tracking-tight">
                            {member.staffCode}
                          </span>
                          {member._status?.isComplete ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                              Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                              Not Started
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-xl text-gray-900 tracking-tight leading-tight">
                            {member.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 leading-none pt-1">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{member.school?.name}</span>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs font-medium text-gray-500 pt-1">
                          <div>
                            <span className="text-gray-400">Role:</span>{' '}
                            {member.designation || '—'}
                          </div>
                          <div>
                            <span className="text-gray-400">Age:</span> {member.age} yrs
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                        <span>Last saved: {lastSavedDate}</span>
                        <span className="font-semibold text-gray-900 inline-flex items-center gap-1">
                          Open
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
            <h3 className="text-lg font-bold text-gray-900">No staff found</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              {searchTerm
                ? `No staff matching "${searchTerm}".`
                : 'No staff members yet. Add one to get started.'}
            </p>
          </div>
          <div className="pt-4">
            <Button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-gray-950 hover:bg-gray-800 text-white shadow-sm flex items-center justify-center gap-2 mx-auto h-12 px-6 font-semibold"
            >
              <UserPlus className="h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddStaffModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            initialName={searchTerm}
            user={user}
            onSuccess={(newId) => {
              queryClient.invalidateQueries({ queryKey: ['staff'] });
              navigate(`/staff/${newId}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
