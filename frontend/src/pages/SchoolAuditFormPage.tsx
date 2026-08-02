import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Card, Button, Input } from '../components/ui';
import { ChevronLeft, Loader2, CheckCircle2, Building2, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const AUDIT_SECTIONS = [
  {
    title: "Governance & Policy",
    questions: [
      "Health & Safety Policy Available",
      "Student Health Policy Available",
      "Mental Health Policy Available",
      "Child Protection Policy Available",
      "Anti-Bullying Policy Available",
      "POSH Committee Functional",
      "Internal Complaints Committee Functional",
      "Emergency Management Policy Available",
      "Disaster Management Plan Available",
      "Health Committee Constituted"
    ]
  },
  {
    title: "Campus Health Infrastructure",
    questions: [
      "Dedicated Medical Room",
      "Examination Bed Available",
      "Wash Basin Available",
      "Medical Storage Cabinet",
      "Wheelchair Available",
      "Stretcher Available",
      "Privacy Maintained",
      "Running Water Available",
      "Emergency Contact Display",
      "Medical Room Signage"
    ]
  },
  {
    title: "First Aid & Emergency Response",
    questions: [
      "First Aid Box Available",
      "First Aid Box Fully Stocked",
      "CPR Kit Available",
      "Emergency SOP Display",
      "Emergency Contacts Displayed",
      "First Aid Trained Staff",
      "CPR Trained Staff",
      "Ambulance Tie-up",
      "Mock Drills Conducted",
      "Incident Reporting System"
    ]
  },
  {
    title: "Fire & Disaster Safety",
    questions: [
      "Fire NOC Available",
      "Fire Extinguishers Installed",
      "Extinguishers Valid",
      "Emergency Exit Signage",
      "Evacuation Maps Displayed",
      "Assembly Area Identified",
      "Fire Drill Conducted",
      "Disaster Team Formed",
      "Earthquake Preparedness Plan",
      "Emergency Lighting Available"
    ]
  },
  {
    title: "Student Health Management",
    questions: [
      "Health Records Maintained",
      "Digital Health Records",
      "Medical History Available",
      "Allergy Records Available",
      "Special Needs Register",
      "Parent Consent Available",
      "Annual Health Screening Conducted",
      "Referral System Available",
      "Parent Communication System",
      "Follow-up Mechanism Available"
    ]
  },
  {
    title: "Mental Health & Well-being",
    questions: [
      "Counsellor Available",
      "Mental Health Policy",
      "Anti-Bullying Program",
      "Substance Abuse Prevention",
      "Stress Management Program",
      "Exam Anxiety Program",
      "Wellness Sessions Conducted",
      "Suicide Prevention Awareness",
      "Parent Awareness Sessions",
      "Referral Support Available"
    ]
  },
  {
    title: "Sanitation & Hygiene",
    questions: [
      "Clean Drinking Water",
      "Water Testing Records",
      "Separate Toilets",
      "Accessible Toilet",
      "Handwashing Stations",
      "Soap Available",
      "Menstrual Hygiene Facilities",
      "Waste Disposal System",
      "Pest Control Records",
      "Housekeeping SOP"
    ]
  },
  {
    title: "Nutrition & Food Safety",
    questions: [
      "FSSAI Compliance",
      "Canteen License Available",
      "Kitchen Hygiene",
      "Food Handler Health Check",
      "Nutrition Awareness Program",
      "Healthy Food Options",
      "Safe Food Storage",
      "Expiry Monitoring System",
      "Water Quality Monitoring",
      "Food Safety Documentation"
    ]
  },
  {
    title: "Sports & Physical Safety",
    questions: [
      "Sports Ground Safety",
      "Equipment Safety",
      "Physical Education Program",
      "Sports First Aid Kit",
      "Injury Reporting System",
      "Sports Coach Available",
      "Fitness Assessment",
      "Hydration Facilities",
      "Heat Stroke Prevention",
      "Emergency Sports SOP"
    ]
  },
  {
    title: "SAFE™ Compliance & Accreditation",
    questions: [
      "Health Committee Functional",
      "Emergency Team Functional",
      "Annual Health Calendar",
      "Parent Engagement Program",
      "Teacher Wellness Program",
      "Awareness Programs Conducted",
      "Emergency Training Conducted",
      "Recommendations Implemented",
      "Compliance Documentation",
      "Continuous Improvement Plan"
    ]
  }
];

const CRITICAL_NON_COMPLIANCE = [
  "No Medical Room",
  "No First Aid Facility",
  "No Fire NOC",
  "No Emergency Plan",
  "No Student Health Records",
  "No Emergency Contacts",
  "No Fire Extinguishers",
  "No Mock Drills",
  "Unsafe Drinking Water",
  "Major Structural Safety Concern"
];

function getSafeGradeAndStatus(score: number) {
  if (score >= 91) return { grade: 'Platinum', status: 'Accredited' };
  if (score >= 81) return { grade: 'Gold', status: 'Accredited' };
  if (score >= 71) return { grade: 'Silver', status: 'Provisionally Accredited' };
  if (score >= 61) return { grade: 'Bronze', status: 'Reassessment Required' };
  return { grade: 'None', status: 'Not Accredited' };
}

export function SchoolAuditFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const schoolId = parseInt(id || '0', 10);
  
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [criticalItems, setCriticalItems] = useState<string[]>([]);
  const [textFields, setTextFields] = useState({
    auditorName: '',
    strengths: '',
    areasOfImprovement: '',
    correctiveActions: '',
    recommendations: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: schoolData, isLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => fetchApi(`/schools`),
  });

  const school = schoolData?.data?.find((s: any) => s.id === schoolId);

  const submitForm = useMutation({
    mutationFn: (payload: any) =>
      fetchApi(`/schools/${schoolId}/audit`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const handleSelect = (question: string, value: boolean) => {
    setResponses(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handleCriticalToggle = (item: string) => {
    setCriticalItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Calculate score (each Yes is 1 point, out of 100)
  const overallScore = Object.values(responses).filter(Boolean).length;
  const { grade, status } = getSafeGradeAndStatus(overallScore);

  const handleSubmit = () => {
    submitForm.mutate({
      dateOfAudit: new Date().toISOString().split('T')[0],
      auditorName: textFields.auditorName || 'Unknown Auditor',
      responses,
      criticalNonCompliance: criticalItems,
      strengths: textFields.strengths,
      areasOfImprovement: textFields.areasOfImprovement,
      correctiveActions: textFields.correctiveActions,
      recommendations: textFields.recommendations,
      overallScore,
      safeGrade: grade,
      accreditationStatus: status
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Submitted Successfully</h1>
        <p className="text-gray-500">The S.A.F.E. Programme audit for {school?.name} has been recorded.</p>
        <div className="bg-gray-50 p-6 rounded-2xl inline-block text-left mt-4 border border-gray-100 shadow-inner">
          <p className="text-gray-500 text-sm">Score: <span className="font-bold text-gray-900 text-xl">{overallScore}/100</span></p>
          <p className="text-gray-500 text-sm mt-2">Grade: <span className="font-bold text-indigo-700">{grade}</span></p>
          <p className="text-gray-500 text-sm mt-2">Status: <span className="font-bold text-gray-900">{status}</span></p>
        </div>
        <div>
          <Button onClick={() => navigate('/schools')} className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12">
            Back to Schools
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-32 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/schools')} 
            className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Master Audit Checklist</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {school?.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Live Score</p>
          <p className="text-3xl font-bold text-indigo-700">{overallScore}<span className="text-xl text-gray-400">/100</span></p>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Audit Details</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Auditor Name</label>
              <Input 
                value={textFields.auditorName}
                onChange={e => setTextFields(prev => ({ ...prev, auditorName: e.target.value }))}
                placeholder="Enter your full name"
                className="rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Date of Audit</label>
              <Input 
                type="date"
                value={new Date().toISOString().split('T')[0]}
                disabled
                className="rounded-xl h-11 bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {AUDIT_SECTIONS.map((section, sIdx) => {
          const sectionScore = section.questions.filter(q => responses[q]).length;
          
          return (
            <motion.div
              key={sIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.05, duration: 0.3 }}
            >
              <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/80 p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg">Section {sIdx + 1}: {section.title}</h3>
                  <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold">
                    {sectionScore}/10
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {section.questions.map((question, qIdx) => {
                    const isYes = !!responses[question];
                    return (
                      <div key={qIdx} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                        <span className="text-gray-700 font-medium text-sm sm:text-base leading-snug pr-4">{question}</span>
                        <div className="flex bg-gray-100/80 rounded-lg p-1 shrink-0 shadow-inner">
                          <button
                            onClick={() => handleSelect(question, true)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${isYes ? 'bg-white text-emerald-600 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleSelect(question, false)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${responses[question] === false ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border border-red-100 bg-red-50/30 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-red-50 p-5 border-b border-red-100">
          <h3 className="font-bold text-red-900 text-lg">Critical Non-Compliance Assessment</h3>
          <p className="text-red-700 text-sm mt-1">Select any critical issues observed during the audit.</p>
        </div>
        <div className="p-6 grid gap-3 sm:grid-cols-2">
          {CRITICAL_NON_COMPLIANCE.map((item, idx) => {
            const isChecked = criticalItems.includes(item);
            return (
              <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleCriticalToggle(item)} />
                <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors ${isChecked ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300 group-hover:border-red-400'}`}>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm font-medium ${isChecked ? 'text-red-900' : 'text-gray-700 group-hover:text-gray-900'}`}>{item}</span>
              </label>
            );
          })}
        </div>
      </Card>

      <Card className="border border-gray-100 shadow-sm rounded-2xl">
        <div className="bg-gray-50 p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Final Auditor Observations</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Strengths</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              value={textFields.strengths}
              onChange={e => setTextFields(prev => ({ ...prev, strengths: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Areas of Improvement</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              value={textFields.areasOfImprovement}
              onChange={e => setTextFields(prev => ({ ...prev, areasOfImprovement: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Corrective Actions</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              value={textFields.correctiveActions}
              onChange={e => setTextFields(prev => ({ ...prev, correctiveActions: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Recommendations</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              value={textFields.recommendations}
              onChange={e => setTextFields(prev => ({ ...prev, recommendations: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xl sticky bottom-6 flex flex-col sm:flex-row items-center justify-between gap-6 z-10">
        <div className="flex gap-6 items-center">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Final Score</p>
            <p className="text-2xl font-bold text-gray-900">{overallScore}/100</p>
          </div>
          <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Grade</p>
            <p className="text-xl font-bold text-indigo-700">{grade}</p>
          </div>
          <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
          <div className="hidden md:block">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Status</p>
            <p className="text-sm font-bold text-gray-900">{status}</p>
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={submitForm.isPending || !textFields.auditorName.trim() || Object.keys(responses).length < 100}
          className="h-14 px-8 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-bold w-full sm:w-auto shadow-lg"
        >
          {submitForm.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Finalize Audit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
