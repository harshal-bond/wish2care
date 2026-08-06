import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Card, Button } from '../components/ui';
import { ChevronLeft, Loader2, FileText, Smile, User, Heart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = parseInt(id || '0', 10);

  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchApi(`/students/${studentId}`)
  });

  const { data: mhData, isLoading: isLoadingMH } = useQuery({
    queryKey: ['student', studentId, 'mental-health'],
    queryFn: () => fetchApi(`/students/${studentId}/mental-health`)
  });

  if (isLoadingStudent || isLoadingMH) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const student = studentData?.data;
  const healthRecord = student?.healthRecord;
  const mhAssessments = mhData?.data || [];

  if (!student) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-gray-900">Student not found</h3>
        <Button onClick={() => navigate('/students')} className="mt-4">Go back to Students</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/students')} 
            className="rounded-xl border border-gray-100 bg-white"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
              {student.studentCode}
            </span>
            <h1 className="text-2xl font-bold text-gray-950 mt-1 leading-none">{student.name}</h1>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              {student.age} yrs • {student.gender === 'M' ? 'Male' : 'Female'} • {student.school?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate(`/students/${studentId}/health-record`)}
            className="rounded-xl font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Activity className="w-4 h-4 mr-2" />
            {healthRecord ? 'Edit Health Record' : 'Add Health Record'}
          </Button>
          <Button 
            onClick={() => navigate(`/students/${studentId}/mental-health`)}
            className="rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Smile className="w-4 h-4 mr-2" />
            Take Mental Health Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Clinical Health Record Summary */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Student Screening</h2>
              <p className="text-sm text-gray-500">Latest SAFE screening assessment</p>
            </div>
          </div>
          
          {healthRecord ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Height / Weight</p>
                  <p className="font-bold text-gray-900 mt-1">
                    {healthRecord.height ? `${healthRecord.height} cm` : '--'} / {healthRecord.weight ? `${healthRecord.weight} kg` : '--'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold">MUAC / Waist</p>
                  <p className="font-bold text-gray-900 mt-1">
                    {healthRecord.muac != null ? `${healthRecord.muac} cm` : '--'} / {healthRecord.waistCircumference != null ? `${healthRecord.waistCircumference} cm` : '--'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Diet / Lifestyle</p>
                  <p className="font-bold text-gray-900 mt-1">
                    {healthRecord.breakfast || '--'} / {healthRecord.physicalActivity || '--'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Mental Wellness</p>
                  <p className="font-bold text-gray-900 mt-1">
                    {healthRecord.stress || '--'} · {healthRecord.mood || '--'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Chronic Disease / Referral Risk</p>
                <p className={`font-bold ${healthRecord.chronicDisease === 'Yes' || healthRecord.weightLoss === 'Yes' ? 'text-red-600' : 'text-emerald-700'}`}>
                  {healthRecord.chronicDisease === 'Yes' || healthRecord.weightLoss === 'Yes' ? 'FLAGGED' : 'Clear'}
                </p>
              </div>
              <Button onClick={() => navigate(`/students/${studentId}/health-record`)} variant="outline" className="w-full mt-4 rounded-xl">
                View Full Record
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No health record found for this student.</p>
              <Button onClick={() => navigate(`/students/${studentId}/health-record`)} className="rounded-xl">
                Create Record
              </Button>
            </div>
          )}
        </Card>

        {/* Mental Health History */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mental Health Assessments</h2>
              <p className="text-sm text-gray-500">History of mental health screening</p>
            </div>
          </div>

          <div className="space-y-4">
            {mhAssessments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-sm mb-4">No assessments have been recorded yet.</p>
                <Button onClick={() => navigate(`/students/${studentId}/mental-health`)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                  Start First Assessment
                </Button>
              </div>
            ) : (
              mhAssessments.map((assessment: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  key={assessment.id} 
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Assessment #{mhAssessments.length - idx}</p>
                      <p className="text-xs text-gray-500">{new Date(assessment.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Score</p>
                    <p className="text-lg font-bold text-indigo-600">{assessment.totalScore}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
