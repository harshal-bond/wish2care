import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Card, CardContent, Button } from '../components/ui';
import { ChevronLeft, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { isRecordComplete } from '@wish2care/shared';

const QUESTIONS = [
  "Anxiety and depression are common in college students.",
  "Asking for help does not mean a person is weak.",
  "Doctors and counselors can treat mental health problems.",
  "If a student feels worried or sad, it will pass on its own, without help.",
  "Some students use alcohol or drugs to feel less stressed.",
  "Mental health problems can affect study, sleep, and friendships.",
  "I can tell a close friend if I feel low.",
  "I feel shy if others know I see a counselor.",
  "Asking for mental health help is normal, like asking for medical help.",
  "I would still respect someone who talks about their mental health.",
  "I would still respect a friend who sees a therapist.",
  "Talking openly about mental health reduces shame.",
  "If I feel low, I know what to do first.",
  "I can ask a teacher for help during a hard time.",
  "I can tell a counselor or doctor how I feel.",
  "I will go to my appointment, even if it feels hard.",
  "Asking for help makes things better, not worse.",
  "I would feel too shy to ask for help, even if I really needed it.",
  "I can tell when a friend is struggling.",
  "I know how to start talking with a worried friend.",
  "I know the difference between supporting a friend and being their counselor.",
  "If a friend seems upset, I think it is not my business.",
  "I will talk about mental health, even if it feels hard.",
  "I check on friends who seem to be having a hard time.",
  "I know healthy ways to handle stress, like exercise or sleep.",
  "I can tell the difference between normal stress and something serious.",
  "I know that social media can affect my mental health.",
  "I know how to feel better after a hard or stressful day.",
  "When I feel stressed, I ignore it and hope it goes away.",
  "I think about my mental health often, not just when things go wrong."
];

const OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' }
];

export function MentalHealthFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const studentId = parseInt(id || '0', 10);

  const [responses, setResponses] = useState<Record<string, number>>({});

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchApi(`/students/${studentId}`)
  });

  const submitForm = useMutation({
    mutationFn: (payload: any) =>
      fetchApi(`/students/${studentId}/mental-health`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student', studentId] }),
        queryClient.invalidateQueries({ queryKey: ['students'] }),
      ]);
      const physicalDone = studentData?.data?.healthRecord
        ? isRecordComplete(studentData.data.healthRecord)
        : false;
      if (physicalDone) navigate(`/students/${studentId}`);
      else navigate(`/students/${studentId}/health-record`);
    }
  });

  const student = studentData?.data;

  const handleOptionSelect = (qIndex: number, value: number) => {
    setResponses(prev => ({
      ...prev,
      [`q${qIndex}`]: value
    }));
  };

  const isFormComplete = Object.keys(responses).length === QUESTIONS.length;
  const missingCount = QUESTIONS.length - Object.keys(responses).length;

  const handleSubmit = () => {
    if (!isFormComplete) return;

    const totalScore = Object.values(responses).reduce((acc, val) => acc + val, 0);

    submitForm.mutate({
      date: new Date().toISOString().split('T')[0],
      responses,
      totalScore
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/students/${studentId}`)}
            className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Mental Health Awareness Scale</h1>
            <p className="text-sm text-gray-500 mt-1">Student: <span className="font-semibold text-gray-700">{student?.name}</span> ({student?.studentCode})</p>
          </div>
        </div>
      </div>

      <Card className="border-indigo-100 bg-indigo-50/30 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-indigo-900/80 leading-relaxed">
            <strong>Instructions:</strong> Please read each statement below and indicate how much you agree or disagree with it, based on how you have generally felt or behaved recently. Choose the response that best reflects your honest opinion.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {QUESTIONS.map((question, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02, duration: 0.2 }}
          >
            <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
              <div className="bg-gray-50/50 p-5 border-b border-gray-100 flex items-start gap-3">
                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="font-medium text-gray-900 leading-snug pt-0.5">{question}</p>
              </div>
              <div className="p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  {OPTIONS.map((opt) => {
                    const isSelected = responses[`q${idx}`] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleOptionSelect(idx, opt.value)}
                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg sticky bottom-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div>
          <h3 className="font-bold text-gray-900">Ready to submit?</h3>
          <p className="text-sm text-gray-500">
            {isFormComplete
              ? 'All questions answered.'
              : `You still have ${missingCount} question${missingCount === 1 ? '' : 's'} remaining.`}
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isFormComplete || submitForm.isPending}
          className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full sm:w-auto"
        >
          {submitForm.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 mr-2" />
              Submit Assessment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
