import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { Users, CheckCircle, Clock, Search, ArrowRight, UserCheck, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => fetchApi('/students')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  const students = data?.data || [];
  const completed = students.filter((s: any) => s._status.isComplete).length;
  const pending = students.length - completed;
  const progress = students.length > 0 ? Math.round((completed / students.length) * 100) : 0;

  // Filter students for quick search
  const filteredStudents = students.filter((student: any) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 4);

  // Greet message based on local time
  const hours = new Date().getHours();
  let greet = 'Good morning';
  if (hours >= 12 && hours < 17) greet = 'Good afternoon';
  else if (hours >= 17) greet = 'Good evening';

  // Last edited student (most recently modified with health records)
  const sortedByEdit = [...students].sort((a: any, b: any) => {
    const timeA = a.healthRecord?.updatedAt ? new Date(a.healthRecord.updatedAt).getTime() : 0;
    const timeB = b.healthRecord?.updatedAt ? new Date(b.healthRecord.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  const lastEditedStudent = sortedByEdit[0];

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{greet}, {user?.name.split(' ')[0]}</h1>
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
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s: any) => (
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
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No students found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Total Students</CardTitle>
            <div className="p-2 bg-gray-50 rounded-xl">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-gray-900">{students.length}</div>
            <p className="text-xs text-gray-400 mt-1">Screening master list</p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Completed</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-emerald-600">{completed}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 shrink-0">{progress}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-400">Pending Screenings</CardTitle>
            <div className="p-2 bg-orange-50 rounded-xl">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight text-orange-500">{pending}</div>
            <p className="text-xs text-gray-400 mt-1">Awaiting data entry</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Continue Last Student Card */}
        <div className="md:col-span-1 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Activity</h2>
          {lastEditedStudent ? (
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
                    {lastEditedStudent._status.isComplete ? 'Complete' : `${lastEditedStudent._status.completedDomains}/8 Domains Filled`}
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
            {students.slice(0, 5).map((student: any, idx: number) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.05 }}
                key={student.id}
              >
                <Link 
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
                    {student._status.isComplete ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                        {student._status.completedDomains}/8 Domains
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {students.length === 0 && (
              <p className="text-center text-gray-400 py-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
                No students registered yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
