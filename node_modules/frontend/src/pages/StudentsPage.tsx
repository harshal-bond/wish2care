import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Input, Card, CardContent } from '../components/ui';
import { Search, SearchX, ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['students', searchTerm],
    queryFn: () => fetchApi(`/students?search=${encodeURIComponent(searchTerm)}`)
  });

  const students = data?.data || [];

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1 text-sm">Search and choose a student to start entering measurements.</p>
        </div>
      </div>

      {/* Prominent Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Type name or student code to search..."
          className="pl-12 h-14 text-base bg-white border-gray-200 rounded-2xl shadow-sm focus:ring-gray-950 focus:border-gray-950 transition-all duration-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.03 }}
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
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
                              {student._status.completedDomains}/8 Domains
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
              We couldn't find any students matching "{searchTerm}". Try a different spelling or student code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
