import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import { nameMatchesQuery, formatGender } from '@wish2care/shared';
import { Input, Button, Card } from '../components/ui';
import {
  Search,
  Loader2,
  SmilePlus,
  Heart,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BarChart2,
  Building2,
  Brain,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

function getMHLabel(score: number | null | undefined) {
  if (score == null) return { label: 'Not Assessed', color: 'gray' };
  if (score >= 120) return { label: 'High Awareness', color: 'emerald' };
  if (score >= 90) return { label: 'Moderate Awareness', color: 'indigo' };
  if (score >= 60) return { label: 'Low Awareness', color: 'amber' };
  return { label: 'At Risk', color: 'red' };
}

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800',
  indigo:  'bg-indigo-100 text-indigo-800',
  amber:   'bg-amber-100 text-amber-800',
  red:     'bg-red-100 text-red-800',
  gray:    'bg-gray-100 text-gray-500',
};

export function StudentDataPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'assessed' | 'not-assessed' | 'flagged'>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['students-data-all'],
    queryFn: () => fetchApi('/students/mental-health/all'),
    staleTime: 30_000,
  });

  const allStudents: any[] = data?.data || [];

  // Extract unique schools
  const schools = Array.from(
    new Map(allStudents.filter(s => s.school).map(s => [s.school.id, s.school])).values()
  );

  const filtered = allStudents.filter(student => {
    // Text search
    if (search) {
      const q = search.trim();
      if (!nameMatchesQuery(student.name, q) && !student.studentCode?.toLowerCase().includes(q.toLowerCase())) return false;
    }
    // School filter
    if (schoolFilter !== 'all' && String(student.schoolId) !== schoolFilter) return false;

    const latestMH = student.mentalHealthAssessments?.[0];
    const riskFlagged = ['chronicDisease', 'weightLoss', 'poorAppetite'].some(
      k => student.healthRecord?.[k] === 'Yes'
    );

    if (filter === 'assessed' && !latestMH) return false;
    if (filter === 'not-assessed' && latestMH) return false;
    if (filter === 'flagged' && !riskFlagged) return false;

    return true;
  });

  // Summary stats
  const assessed = allStudents.filter(s => s.mentalHealthAssessments?.length > 0).length;
  const tbFlagged = allStudents.filter(s =>
    ['chronicDisease', 'weightLoss', 'poorAppetite'].some(k => s.healthRecord?.[k] === 'Yes')
  ).length;
  const avgScore = (() => {
    const scores = allStudents
      .map(s => s.mentalHealthAssessments?.[0]?.totalScore)
      .filter(n => n != null);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <BarChart2 className="h-7 w-7 text-indigo-600" />
          Student Data Overview
        </h1>
        <p className="text-gray-500 mt-1 text-sm">All students with health and mental health assessment data.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Students',
            value: allStudents.length,
            icon: Brain,
            color: 'bg-gray-900 text-white',
            iconColor: 'text-white',
          },
          {
            label: 'MH Assessed',
            value: `${assessed}`,
            sub: `${allStudents.length ? Math.round((assessed / allStudents.length) * 100) : 0}%`,
            icon: SmilePlus,
            color: 'bg-indigo-50 text-indigo-900',
            iconColor: 'text-indigo-500',
          },
          {
            label: 'Avg MH Score',
            value: avgScore != null ? avgScore : '—',
            sub: 'out of 150',
            icon: Activity,
            color: 'bg-emerald-50 text-emerald-900',
            iconColor: 'text-emerald-500',
          },
          {
            label: 'TB Flagged',
            value: tbFlagged,
            icon: AlertTriangle,
            color: 'bg-red-50 text-red-900',
            iconColor: 'text-red-500',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25 }}
          >
            <Card className={`p-5 rounded-2xl border-0 shadow-sm ${stat.color}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                <stat.icon className={`h-5 w-5 ${stat.iconColor} opacity-80`} />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              {stat.sub && <p className="text-xs opacity-60 mt-0.5">{stat.sub}</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name or code..."
            className="pl-10 h-11 rounded-xl border-gray-200 bg-white"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={schoolFilter}
          onChange={e => setSchoolFilter(e.target.value)}
        >
          <option value="all">All Schools</option>
          {schools.map((s: any) => (
            <option key={s.id} value={String(s.id)}>{s.name}</option>
          ))}
        </select>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          {(['all', 'assessed', 'not-assessed', 'flagged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'assessed' ? 'MH Assessed' : f === 'not-assessed' ? 'Not Assessed' : 'TB Flagged'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">School</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Health Record</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">MH Assessment</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Risk Flags</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No students match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((student: any, idx: number) => {
                    const latestMH = student.mentalHealthAssessments?.[0];
                    const mhLabel = getMHLabel(latestMH?.totalScore);
                    const hasTbFlag = ['chronicDisease', 'weightLoss', 'poorAppetite'].some(
                      k => student.healthRecord?.[k] === 'Yes'
                    );
                    const hasHealthRecord = !!student.healthRecord;

                    return (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        {/* Student */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {student.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-400">{student.studentCode} • {formatGender(student.gender)}, {student.age}y</p>
                            </div>
                          </div>
                        </td>

                        {/* School */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm">{student.school?.name || '—'}</span>
                          </div>
                        </td>

                        {/* Health Record */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          {hasHealthRecord ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Heart className="h-3 w-3 text-emerald-500" />
                                {student.healthRecord.height ? `${student.healthRecord.height}cm` : '—'} / {student.healthRecord.weight ? `${student.healthRecord.weight}kg` : '—'}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Activity className="h-3 w-3 text-blue-500" />
                                MUAC: {student.healthRecord.muac != null ? `${student.healthRecord.muac} cm` : '—'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No record</span>
                          )}
                        </td>

                        {/* MH Assessment */}
                        <td className="px-5 py-4">
                          {latestMH ? (
                            <div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${COLOR_MAP[mhLabel.color]}`}>
                                <SmilePlus className="h-3 w-3" />
                                {mhLabel.label}
                              </span>
                              <p className="text-xs text-gray-400 mt-1">
                                Score: <span className="font-bold text-gray-700">{latestMH.totalScore}</span>
                                {' · '}
                                {student.mentalHealthAssessments.length} test{student.mentalHealthAssessments.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-dashed border-gray-200">
                              Not assessed
                            </span>
                          )}
                        </td>

                        {/* TB Screen */}
                        <td className="px-5 py-4 hidden sm:table-cell">
                          {hasHealthRecord ? (
                            hasTbFlag ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                                <AlertTriangle className="h-3 w-3" />
                                FLAGGED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <CheckCircle2 className="h-3 w-3" />
                                Clear
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                              <XCircle className="h-3.5 w-3.5" />—
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {allStudents.length} students
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
