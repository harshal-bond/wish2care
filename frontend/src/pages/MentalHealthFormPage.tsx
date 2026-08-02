import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Card, CardContent, Button } from '../components/ui';
import { ChevronLeft, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const QUESTIONS = [
  "Needing professional support for stress or emotional difficulties is a sign of personal weakness.",
  "I rarely think about my mental health unless something has already gone wrong.",
  "When I'm stressed, I tend to just ignore it rather than do anything about it.",
  "I believe talking openly about mental health reduces shame and isolation.",
  "I know several healthy strategies I can use to manage stress (e.g., exercise, sleep, social connection, relaxation practices).",
  "If a friend seemed withdrawn or upset, I would probably assume it wasn't my place to say anything.",
  "I would feel confident asking a professor, advisor, or staff member for support or flexibility during a difficult time.",
  "I would rather avoid a conversation about mental health with a peer than risk saying the wrong thing.",
  "Substance use is sometimes used by students to cope with underlying stress, anxiety, or low mood.",
  "I would feel confident explaining what I am experiencing to a counselor or health provider.",
  "I feel confident I could recognize when a friend or classmate might be struggling emotionally.",
  "I would feel comfortable telling a close friend if I were struggling emotionally.",
  "I would be concerned about being judged if others knew I was seeing a counselor or therapist.",
  "I would feel too anxious or embarrassed to ask for help, even if I genuinely needed it.",
  "I believe reaching out for help would actually make things better, not worse.",
  "I understand the difference between supporting a friend and trying to act as their counselor.",
  "I would know how to start a supportive conversation with a peer I was worried about.",
  "I can tell the difference between everyday stress and something that may need professional attention.",
  "Mental health conditions can be effectively managed or treated, similar to other health conditions.",
  "Seeking help for a mental health concern is as reasonable as seeking help for a physical health concern.",
  "If I were struggling emotionally, I would know the first step to take.",
  "I check in on friends who seem to be going through a hard time.",
  "I believe most people would think less of someone who disclosed a mental health condition.",
  "I am aware that certain online content or social media use patterns can affect my mental health.",
  "Anxiety and depression are among the most common health conditions experienced by college students.",
  "Most students who feel anxious or low will eventually \"snap out of it\" on their own, without any kind of support.",
  "I know how to help myself \"reset\" after a difficult day or a period of high stress.",
  "I would follow through on making an appointment for support, even if it felt uncomfortable.",
  "Mental health difficulties can affect a student's academic performance, sleep, and relationships at the same time.",
  "I would think less of a friend who told me they were seeing a therapist."
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
  const studentId = parseInt(id || '0', 10);
  
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    onSuccess: () => {
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assessment Completed</h1>
        <p className="text-gray-500">Thank you for submitting the mental health awareness scale.</p>
        <Button onClick={() => navigate(`/students/${studentId}`)} className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12">
          Back to Student Profile
        </Button>
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
