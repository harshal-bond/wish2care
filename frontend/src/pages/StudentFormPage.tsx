import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  healthRecordPartialSchema,
  YES_NO,
  YES_PARTIAL_NO,
  BREAKFAST_OPTIONS,
  FRUIT_INTAKE_OPTIONS,
  VEGETABLES_OPTIONS,
  PROTEIN_INTAKE_OPTIONS,
  JUNK_FOOD_OPTIONS,
  SUGARY_DRINKS_OPTIONS,
  WATER_INTAKE_OPTIONS,
  PHYSICAL_ACTIVITY_OPTIONS,
  SCREEN_TIME_OPTIONS,
  OUTDOOR_PLAY_OPTIONS,
  SLEEP_HOURS_OPTIONS,
  SMOKING_OPTIONS,
  ALCOHOL_OPTIONS,
  STRESS_OPTIONS,
  MOOD_OPTIONS,
  CONCENTRATION_OPTIONS,
  HAND_HYGIENE_OPTIONS,
  isRecordComplete,
  computeScreeningScores,
  computeBpClass,
} from '@wish2care/shared';
import type { HealthRecordPartial } from '@wish2care/shared';
import { fetchApi } from '../lib/api';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAuth } from '../hooks/useAuth';
import { Card, Input, Button } from '../components/ui';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { cn } from '../lib/utils';
import {
  ChevronLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Ruler,
  Apple,
  Dumbbell,
  Stethoscope,
  Brain,
  Eye,
  ShieldCheck,
  ClipboardCheck,
  AlertCircle,
  Lock,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { id: 1, name: 'Student Details', icon: User },
  { id: 2, name: 'Anthropometry', icon: Ruler },
  { id: 3, name: 'Blood Pressure', icon: Activity },
  { id: 4, name: 'Diet', icon: Apple },
  { id: 5, name: 'Lifestyle', icon: Dumbbell },
  { id: 6, name: 'Medical History', icon: Stethoscope },
  { id: 7, name: 'Mental Wellness', icon: Brain },
  { id: 8, name: 'Clinical', icon: Eye },
  { id: 9, name: 'Preventive', icon: ShieldCheck },
  { id: 10, name: 'Review & Scores', icon: ClipboardCheck },
];

type FormControl = ReturnType<typeof useForm<HealthRecordPartial>>['control'];
type FormSetValue = ReturnType<typeof useForm<HealthRecordPartial>>['setValue'];

function FieldSelect({
  label,
  name,
  control,
  options,
}: {
  label: string;
  name: keyof HealthRecordPartial;
  control: FormControl;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <SearchableSelect
            options={[...options]}
            value={field.value as string | null | undefined}
            onChange={field.onChange}
            placeholder="Select..."
          />
        )}
      />
    </div>
  );
}

/** Yes/No (or Yes/Partial/No) field with Remarks shown only when answer is Yes */
function YesNoFieldWithRemarks({
  label,
  name,
  control,
  setValue,
  options = YES_NO,
}: {
  label: string;
  name: keyof HealthRecordPartial;
  control: FormControl;
  setValue: FormSetValue;
  options?: readonly string[];
}) {
  const answer = useWatch({ control, name });
  const remarksMap = useWatch({ control, name: 'yesNoRemarks' }) || {};
  const showRemarks = answer === 'Yes';
  const remarkKey = String(name);

  return (
    <div className="space-y-2 sm:col-span-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <SearchableSelect
            options={[...options]}
            value={field.value as string | null | undefined}
            onChange={(val) => {
              field.onChange(val);
              if (val !== 'Yes') {
                const next = { ...(remarksMap as Record<string, string>) };
                delete next[remarkKey];
                setValue('yesNoRemarks', Object.keys(next).length ? next : null, {
                  shouldDirty: true,
                });
              }
            }}
            placeholder="Select..."
          />
        )}
      />
      {showRemarks && (
        <div className="pt-1">
          <label className="text-xs font-semibold text-gray-500">Remarks / Comments</label>
          <textarea
            className="mt-1 flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm min-h-[72px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
            placeholder="Add remarks for this Yes response..."
            value={(remarksMap as Record<string, string>)[remarkKey] || ''}
            onChange={(e) => {
              const next = {
                ...(remarksMap as Record<string, string>),
                [remarkKey]: e.target.value,
              };
              setValue('yesNoRemarks', next, { shouldDirty: true });
            }}
          />
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value, accent }: { label: string; value: number | string | null; accent?: string }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={cn('text-lg font-bold mt-1', accent || 'text-gray-900')}>
        {value == null || value === '' ? '—' : value}
      </p>
    </div>
  );
}

export function StudentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = parseInt(id || '0', 10);
  const [activeStep, setActiveStep] = useState(1);
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchApi(`/students/${studentId}`),
  });

  const form = useForm<HealthRecordPartial>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(healthRecordPartialSchema as any),
    defaultValues: { studentId, yesNoRemarks: {} },
    mode: 'onTouched',
  });

  const { isSaving, lastSaved, saveError, forceSave } = useAutoSave({
    form,
    studentId,
  });

  useEffect(() => {
    if (data?.data?.healthRecord) {
      form.reset({
        ...data.data.healthRecord,
        studentId,
        yesNoRemarks: data.data.healthRecord.yesNoRemarks || {},
      });
    }
  }, [data, form, studentId]);

  const watched = useWatch({ control: form.control });
  const scores = useMemo(() => computeScreeningScores(watched || {}), [watched]);

  // Auto-populate BP Class from systolic / diastolic
  useEffect(() => {
    const next = computeBpClass(watched?.systolic, watched?.diastolic);
    const current = watched?.bpClass ?? null;
    if (next !== current && (next != null || current != null)) {
      form.setValue('bpClass', next, { shouldDirty: true });
    }
  }, [watched?.systolic, watched?.diastolic, watched?.bpClass, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="text-center py-12 max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">Record not found</h3>
        <Button onClick={() => navigate('/students')}>Go back to Students</Button>
      </div>
    );
  }

  const student = data.data;
  const today = new Date().toISOString().split('T')[0];

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const isSubmitted =
    !!data?.data?.healthRecord &&
    isRecordComplete(data.data.healthRecord) &&
    user?.role === 'fieldworker';

  const riskAccent =
    scores.riskCategory?.startsWith('Green')
      ? 'text-emerald-700'
      : scores.riskCategory?.startsWith('Light Green')
        ? 'text-lime-700'
        : scores.riskCategory?.startsWith('Yellow')
          ? 'text-amber-600'
          : scores.riskCategory?.startsWith('Orange')
            ? 'text-orange-600'
            : scores.riskCategory?.startsWith('Red')
              ? 'text-red-600'
              : undefined;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {isSubmitted && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Record Submitted & Locked</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              This health record is complete and has been submitted. It can no longer be edited by a field worker.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/students/${studentId}`)}
            className="rounded-xl border border-gray-100 bg-white"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
              {student.studentCode}
            </span>
            <h1 className="text-2xl font-bold text-gray-950 mt-1 leading-none">{student.name}</h1>
            <p className="text-xs text-gray-500 mt-1.5">
              {student.age} yrs • {student.gender === 'M' ? 'Male' : 'Female'} • {student.school?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            {saveError ? (
              <span className="text-red-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {saveError}
              </span>
            ) : isSaving ? (
              <span className="text-gray-500 flex items-center gap-1.5 font-medium animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved{' '}
                {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            ) : null}
          </div>
          <Button
            onClick={() => forceSave()}
            disabled={isSaving || isSubmitted}
            variant="outline"
            className="rounded-xl font-semibold border-gray-200"
          >
            <Save className="h-4 w-4 mr-2 text-gray-600" />
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-4 lg:pb-0 scrollbar-none border-b lg:border-b-0 lg:border-r border-gray-100 pr-0 lg:pr-6">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (isValid) setActiveStep(step.id);
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap text-left transition-all duration-150 shrink-0 w-full',
                  isActive
                    ? 'bg-gray-950 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-white hover:text-gray-950 border border-transparent hover:border-gray-100'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
                <span className="truncate">{step.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="lg:col-span-3">
          <input type="hidden" {...form.register('date')} value={form.watch('date') || today} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="border-gray-100 bg-white shadow-sm rounded-2xl p-6 md:p-8">
                <fieldset disabled={isSubmitted} className="min-w-0">
                  {activeStep === 1 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Student Registration</h2>
                        <p className="text-sm text-gray-400 mt-1">Demographics from the student master list.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        {[
                          ['Full Name', student.name],
                          ['Student Code', student.studentCode],
                          ['School', student.school?.name],
                          ['Gender & Age', `${student.gender === 'M' ? 'Male' : 'Female'} • ${student.age} years`],
                          ['Date of Birth', student.dateOfBirth || '—'],
                          ['Blood Group', student.bloodGroup || '—'],
                          ['Parent / Nominee', student.nomineeName || '—'],
                          ['Parent Mobile', student.fatherMobileNo || student.mobileNo || '—'],
                        ].map(([label, value]) => (
                          <div key={label as string} className="space-y-1 bg-gray-50 p-4 rounded-xl">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              {label}
                            </label>
                            <p className="text-lg font-bold text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Section A — Anthropometry</h2>
                        <p className="text-sm text-gray-400 mt-1">Height, weight, MUAC and waist. BMI is calculated automatically.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Height (cm)</label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 155"
                            className="h-12 text-base rounded-xl border-gray-200"
                            {...form.register('height', { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Weight (kg)</label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 45"
                            className="h-12 text-base rounded-xl border-gray-200"
                            {...form.register('weight', { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">MUAC (cm)</label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 22"
                            className="h-12 text-base rounded-xl border-gray-200"
                            {...form.register('muac', { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Waist Circumference (cm)</label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 60"
                            className="h-12 text-base rounded-xl border-gray-200"
                            {...form.register('waistCircumference', { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 pt-2">
                        <ScorePill label="BMI (auto)" value={scores.bmi} />
                        <ScorePill label="BMI Category (auto)" value={scores.bmiCategory} />
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Blood Pressure & Random Blood Sugar</h2>
                        <p className="text-sm text-gray-400 mt-1">
                          Enter BP readings and classification. BP Subscore is calculated automatically.
                        </p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Systolic (mmHg)</label>
                          <Input
                            type="number"
                            placeholder="e.g. 108"
                            className="h-12 text-base rounded-xl border-gray-200"
                            {...form.register('systolic', { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Diastolic (mmHg)</label>
                          <Input
                            type="number"
                            placeholder="e.g. 70"
                            className="h-12 text-base rounded-xl border-gray-200"
                            {...form.register('diastolic', { valueAsNumber: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Random Blood Sugar (mg/dL)</label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 92"
                            className="h-12 text-base rounded-xl border-gray-200"
                            {...form.register('randomBloodSugar', { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Normal range: Systolic 120–140 mmHg · Diastolic 80–100 mmHg. BP Class is calculated automatically.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2 pt-2">
                        <ScorePill label="BP Class (auto)" value={scores.bpClass} />
                        <ScorePill label="BP Subscore (auto)" value={scores.bpSubscore} />
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Section B — Diet</h2>
                        <p className="text-sm text-gray-400 mt-1">Diet quality screening responses.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FieldSelect label="Breakfast" name="breakfast" control={form.control} options={BREAKFAST_OPTIONS} />
                        <FieldSelect label="Fruit Intake" name="fruitIntake" control={form.control} options={FRUIT_INTAKE_OPTIONS} />
                        <FieldSelect label="Vegetables" name="vegetables" control={form.control} options={VEGETABLES_OPTIONS} />
                        <FieldSelect label="Protein Intake" name="proteinIntake" control={form.control} options={PROTEIN_INTAKE_OPTIONS} />
                        <FieldSelect label="Junk Food" name="junkFood" control={form.control} options={JUNK_FOOD_OPTIONS} />
                        <FieldSelect label="Sugary Drinks" name="sugaryDrinks" control={form.control} options={SUGARY_DRINKS_OPTIONS} />
                        <FieldSelect label="Water Intake" name="waterIntake" control={form.control} options={WATER_INTAKE_OPTIONS} />
                      </div>
                    </div>
                  )}

                  {activeStep === 5 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Section C — Lifestyle</h2>
                        <p className="text-sm text-gray-400 mt-1">Activity, screen time, sleep and substance use.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FieldSelect label="Physical Activity" name="physicalActivity" control={form.control} options={PHYSICAL_ACTIVITY_OPTIONS} />
                        <FieldSelect label="Screen Time" name="screenTime" control={form.control} options={SCREEN_TIME_OPTIONS} />
                        <FieldSelect label="Outdoor Play" name="outdoorPlay" control={form.control} options={OUTDOOR_PLAY_OPTIONS} />
                        <FieldSelect label="Sleep Hours" name="sleepHours" control={form.control} options={SLEEP_HOURS_OPTIONS} />
                        <FieldSelect label="Smoking" name="smoking" control={form.control} options={SMOKING_OPTIONS} />
                        <FieldSelect label="Alcohol" name="alcohol" control={form.control} options={ALCOHOL_OPTIONS} />
                      </div>
                    </div>
                  )}

                  {activeStep === 6 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Section D — Medical History</h2>
                        <p className="text-sm text-gray-400 mt-1">Yes/No medical history flags. Remarks appear when Yes is selected.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <YesNoFieldWithRemarks label="Chronic Disease" name="chronicDisease" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Frequent Fever" name="frequentFever" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Weight Loss" name="weightLoss" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Poor Appetite" name="poorAppetite" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Repeated Infection" name="repeatedInfection" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Hospitalisation" name="hospitalisation" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Medication" name="medication" control={form.control} setValue={form.setValue} />
                      </div>
                    </div>
                  )}

                  {activeStep === 7 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Section E — Mental Wellness</h2>
                        <p className="text-sm text-gray-400 mt-1">Stress, mood, concentration and bullying screen.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FieldSelect label="Stress" name="stress" control={form.control} options={STRESS_OPTIONS} />
                        <FieldSelect label="Mood" name="mood" control={form.control} options={MOOD_OPTIONS} />
                        <FieldSelect label="Concentration" name="concentration" control={form.control} options={CONCENTRATION_OPTIONS} />
                        <YesNoFieldWithRemarks label="Bullying" name="bullying" control={form.control} setValue={form.setValue} />
                      </div>
                    </div>
                  )}

                  {activeStep === 8 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Section F — Clinical Observation</h2>
                        <p className="text-sm text-gray-400 mt-1">Observed clinical findings (Yes/No). Remarks appear when Yes is selected.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <YesNoFieldWithRemarks label="Pallor" name="pallor" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Dental Caries" name="dentalCaries" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Poor Oral Hygiene" name="poorOralHygiene" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Vision Problem" name="visionProblem" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Hair Changes" name="hairChanges" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Skin Changes" name="skinChanges" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Clubbing" name="clubbing" control={form.control} setValue={form.setValue} />
                      </div>
                    </div>
                  )}

                  {activeStep === 9 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Section G — Preventive Health</h2>
                        <p className="text-sm text-gray-400 mt-1">Vaccination, deworming, hygiene and check-ups. Remarks appear when Yes is selected.</p>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <YesNoFieldWithRemarks
                          label="Vaccination Complete"
                          name="vaccinationComplete"
                          control={form.control}
                          setValue={form.setValue}
                          options={YES_PARTIAL_NO}
                        />
                        <YesNoFieldWithRemarks
                          label="Deworming"
                          name="deworming"
                          control={form.control}
                          setValue={form.setValue}
                          options={YES_PARTIAL_NO}
                        />
                        <FieldSelect label="Hand Hygiene" name="handHygiene" control={form.control} options={HAND_HYGIENE_OPTIONS} />
                        <YesNoFieldWithRemarks label="Dental Check-up" name="dentalCheckup" control={form.control} setValue={form.setValue} />
                        <YesNoFieldWithRemarks label="Vision Screening" name="visionScreening" control={form.control} setValue={form.setValue} />
                      </div>
                    </div>
                  )}

                  {activeStep === 10 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Review & Automated Scores</h2>
                        <p className="text-sm text-gray-400 mt-1">
                          Scores follow the Excel formulas (domain averages ×20, overall weighted sum).
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <ScorePill label="Growth & Anthropometry" value={scores.growthAnthropometryScore} />
                        <ScorePill label="BP Subscore" value={scores.bpSubscore} />
                        <ScorePill label="Diet Score" value={scores.dietScore} />
                        <ScorePill label="Lifestyle Score" value={scores.lifestyleScore} />
                        <ScorePill label="Medical History Score" value={scores.medicalHistoryScore} />
                        <ScorePill label="Clinical Score" value={scores.clinicalScore} />
                        <ScorePill label="Mental Wellness Score" value={scores.mentalWellnessScore} />
                        <ScorePill label="Preventive Score" value={scores.preventiveScore} />
                        <ScorePill label="Nutrition Score" value={scores.nutritionScore} />
                        <ScorePill label="Undernutrition Risk" value={scores.undernutritionRiskScore} />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                        <ScorePill label="Overall Health Score" value={scores.overallHealthScore} accent="text-gray-950" />
                        <ScorePill label="Risk Category" value={scores.riskCategory} accent={riskAccent} />
                        <ScorePill
                          label="Need Referral"
                          value={scores.needReferral}
                          accent={scores.needReferral === 'Yes' ? 'text-red-600' : 'text-emerald-700'}
                        />
                        <ScorePill
                          label="Need Doctor Review"
                          value={scores.needDoctorReview}
                          accent={scores.needDoctorReview === 'Yes' ? 'text-orange-600' : 'text-emerald-700'}
                        />
                      </div>

                      <div className="grid gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 text-sm">
                        <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                          <span className="font-semibold text-gray-500">Height / Weight / BMI</span>
                          <span className="font-medium text-gray-900">
                            {watched.height ?? '—'} cm / {watched.weight ?? '—'} kg
                            {scores.bmi != null ? ` · BMI ${scores.bmi} (${scores.bmiCategory})` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                          <span className="font-semibold text-gray-500">BP / RBS</span>
                          <span className="font-medium text-gray-900">
                            {watched.systolic ?? '—'}/{watched.diastolic ?? '—'} mmHg ({scores.bpClass || '—'})
                            {' · '}
                            RBS: {watched.randomBloodSugar != null ? `${watched.randomBloodSugar} mg/dL` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                          <span className="font-semibold text-gray-500">MUAC / Waist</span>
                          <span className="font-medium text-gray-900">
                            {watched.muac ?? '—'} cm / {watched.waistCircumference ?? '—'} cm
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                          <span className="font-semibold text-gray-500">Chronic Disease / Clubbing</span>
                          <span className="font-medium text-gray-900">
                            {watched.chronicDisease || '—'} / {watched.clubbing || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="font-semibold text-gray-500">Mental (Stress / Mood)</span>
                          <span className="font-bold text-gray-900">
                            {watched.stress || '—'} / {watched.mood || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={() => navigate(`/students/${studentId}`)}
                          className="w-full h-12 rounded-xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Complete Screening
                        </Button>
                      </div>
                    </div>
                  )}
                </fieldset>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={activeStep === 1}
                    className="rounded-xl border-gray-200 font-semibold"
                  >
                    Back
                  </Button>

                  {activeStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="rounded-xl font-bold bg-gray-950 hover:bg-gray-800 text-white flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : null}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
