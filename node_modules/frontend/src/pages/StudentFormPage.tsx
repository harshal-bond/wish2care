import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  healthRecordPartialSchema, 
  MENTAL_WELLBEING_OPTIONS,
  YES_NO,
  CLASSIFICATION
} from '@wish2care/shared';
import type { HealthRecordPartial } from '@wish2care/shared';
import { fetchApi } from '../lib/api';
import { useAutoSave } from '../hooks/useAutoSave';
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
  ShieldAlert,
  User,
  Heart,
  TrendingDown,
  Eye,
  Activity,
  Smile,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { id: 1, name: 'Student Details', icon: User },
  { id: 2, name: 'Undernutrition', icon: TrendingDown },
  { id: 3, name: 'Overweight', icon: Heart },
  { id: 4, name: 'Anaemia', icon: Activity },
  { id: 5, name: 'Blood Pressure', icon: Activity },
  { id: 6, name: 'Metabolic', icon: Heart },
  { id: 7, name: 'Vision', icon: Eye },
  { id: 8, name: 'Oral Health', icon: Smile },
  { id: 9, name: 'Respiratory', icon: Activity },
  { id: 10, name: 'TB & Mental', icon: ShieldAlert },
  { id: 11, name: 'Review & Submit', icon: CheckCircle2 }
];

export function StudentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = parseInt(id || '0', 10);
  const [activeStep, setActiveStep] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchApi(`/students/${studentId}`)
  });

  const form = useForm<HealthRecordPartial>({
    resolver: zodResolver(healthRecordPartialSchema),
    defaultValues: { studentId },
    mode: 'onTouched'
  });

  const { isSaving, lastSaved, saveError, forceSave } = useAutoSave({
    form,
    studentId
  });

  // Load existing data into form
  useEffect(() => {
    if (data?.data?.healthRecord) {
      form.reset({
        ...data.data.healthRecord,
        studentId
      });
    }
  }, [data, form, studentId]);

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
    // Validate current step fields before going next
    const isValid = await form.trigger();
    if (isValid) {
      setActiveStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const currentValues = form.getValues();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      {/* Top Banner / Header */}
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
            <p className="text-xs text-gray-500 mt-1.5">
              {student.age} yrs • {student.gender === 'M' ? 'Male' : 'Female'} • {student.school?.name}
            </p>
          </div>
        </div>
        
        {/* Autosave Indicator */}
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
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            ) : null}
          </div>
          <Button 
            onClick={() => forceSave()} 
            disabled={isSaving} 
            variant="outline"
            className="rounded-xl font-semibold border-gray-200"
          >
            <Save className="h-4 w-4 mr-2 text-gray-600" />
            Save changes
          </Button>
        </div>
      </div>

      {/* Main Layout: Left Stepper (1/4), Right Form (3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left vertical Stepper Navigation */}
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
                  if (isValid) {
                    setActiveStep(step.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap text-left transition-all duration-150 shrink-0 w-full",
                  isActive 
                    ? "bg-gray-950 text-white shadow-sm" 
                    : "text-gray-500 hover:bg-white hover:text-gray-950 border border-transparent hover:border-gray-100"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-gray-400")} />
                <span className="truncate">{step.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Form panel */}
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
              <Card className="border-gray-100 bg-white shadow-sm rounded-2xl overflow-hidden p-6 md:p-8">
                {/* Step 1: Student Details */}
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
                      <p className="text-sm text-gray-400 mt-1">Review basic student information from the master list.</p>
                    </div>
                    
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-1 bg-gray-50 p-4 rounded-xl">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                        <p className="text-lg font-bold text-gray-900">{student.name}</p>
                      </div>
                      <div className="space-y-1 bg-gray-50 p-4 rounded-xl">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Student Code</label>
                        <p className="text-lg font-bold text-gray-900">{student.studentCode}</p>
                      </div>
                      <div className="space-y-1 bg-gray-50 p-4 rounded-xl">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">School</label>
                        <p className="text-lg font-bold text-gray-900">{student.school?.name}</p>
                      </div>
                      <div className="space-y-1 bg-gray-50 p-4 rounded-xl">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gender & Age</label>
                        <p className="text-lg font-bold text-gray-900">
                          {student.gender === 'M' ? 'Male' : 'Female'} • {student.age} years
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Undernutrition */}
                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">1. Undernutrition</h2>
                      <p className="text-sm text-gray-400 mt-1">Measurements related to stunting and thinness.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Height (cm)</label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 152.0"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950 focus:border-gray-950"
                          {...form.register('height', { valueAsNumber: true })} 
                        />
                        {form.formState.errors.height?.message ? (
                          <p className="text-xs text-red-500 font-medium">{String(form.formState.errors.height.message)}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Weight (kg)</label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 41.5"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950 focus:border-gray-950"
                          {...form.register('weight', { valueAsNumber: true })} 
                        />
                        {form.formState.errors.weight?.message ? (
                          <p className="text-xs text-red-500 font-medium">{String(form.formState.errors.weight.message)}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-semibold text-gray-700">Clinical Classification</label>
                        <Controller
                          name="undernutritionClass"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={Object.values(CLASSIFICATION)}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Choose classification..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Overweight */}
                {activeStep === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">2. Overweight / Obesity</h2>
                      <p className="text-sm text-gray-400 mt-1">Classification check based on WHO Growth charts.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Clinical Classification</label>
                      <Controller
                        name="overweightClass"
                        control={form.control}
                        render={({ field }) => (
                          <SearchableSelect
                            options={Object.values(CLASSIFICATION)}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Choose classification..."
                          />
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Anaemia */}
                {activeStep === 4 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">3. Anaemia</h2>
                      <p className="text-sm text-gray-400 mt-1">Haemoglobin screening measurements.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Haemoglobin (g/dL)</label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 11.2"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950 focus:border-gray-950"
                          {...form.register('hb', { valueAsNumber: true })} 
                        />
                        {form.formState.errors.hb?.message ? (
                          <p className="text-xs text-red-500 font-medium">{String(form.formState.errors.hb.message)}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Clinical Classification</label>
                        <Controller
                          name="anaemiaClass"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={Object.values(CLASSIFICATION)}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Choose classification..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Blood Pressure */}
                {activeStep === 5 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">4. Blood Pressure</h2>
                      <p className="text-sm text-gray-400 mt-1">Pediatric blood pressure screening inputs.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Systolic (mmHg)</label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 110"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('systolic', { valueAsNumber: true })} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Diastolic (mmHg)</label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 72"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('diastolic', { valueAsNumber: true })} 
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-semibold text-gray-700">Clinical Classification</label>
                        <Controller
                          name="bpClass"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={Object.values(CLASSIFICATION)}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Choose classification..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Metabolic */}
                {activeStep === 6 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">5. Metabolic Risk Proxy</h2>
                      <p className="text-sm text-gray-400 mt-1">Assess metabolic risk via waist and family history details.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Waist Circumference (cm)</label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 68.0"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('waistCircumference', { valueAsNumber: true })} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Family History Count (0 - 2)</label>
                        <Input 
                          type="number" 
                          min="0"
                          max="2"
                          placeholder="0, 1, or 2"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('familyHxCount', { valueAsNumber: true })} 
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-semibold text-gray-700">Clinical Classification</label>
                        <Controller
                          name="metabolicRiskClass"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={Object.values(CLASSIFICATION)}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Choose classification..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 7: Vision */}
                {activeStep === 7 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">6. Vision (Refractive error)</h2>
                      <p className="text-sm text-gray-400 mt-1">Enter decimal visual acuity readings.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Right Eye Visual Acuity</label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g. 1.00"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('rightEyeAcuity', { valueAsNumber: true })} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Left Eye Visual Acuity</label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g. 0.80"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('leftEyeAcuity', { valueAsNumber: true })} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 8: Oral */}
                {activeStep === 8 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">7. Oral Health</h2>
                      <p className="text-sm text-gray-400 mt-1">Record decayed/caries count.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Decayed Teeth Count</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 0"
                        className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                        {...form.register('decayedTeethCount', { valueAsNumber: true })} 
                      />
                    </div>
                  </div>
                )}

                {/* Step 9: Respiratory */}
                {activeStep === 9 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">8. Respiratory (Asthma/PEFR)</h2>
                      <p className="text-sm text-gray-400 mt-1">Record symptoms and peak flow metrics.</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Wheeze Symptom</label>
                        <Controller
                          name="wheezeSymptom"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={YES_NO}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select..."
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Measured PEFR (L/min)</label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 320"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('measuredPefr', { valueAsNumber: true })} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Predicted PEFR (L/min)</label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 350"
                          className="h-12 text-base rounded-xl border-gray-200 focus:ring-gray-950"
                          {...form.register('predictedPefr', { valueAsNumber: true })} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 10: TB & Mental */}
                {activeStep === 10 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="border-b border-gray-50 pb-4">
                        <h2 className="text-xl font-bold text-gray-900">Red Flag Screens (TB & Wellbeing)</h2>
                        <p className="text-sm text-gray-400 mt-1">Mandatory clinical escalation screens.</p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 font-medium text-red-950">Active Cough &gt; 2 weeks?</label>
                          <Controller
                            name="tbCough"
                            control={form.control}
                            render={({ field }) => (
                              <SearchableSelect
                                options={YES_NO}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select..."
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 font-medium text-red-950">Unexplained Fever?</label>
                          <Controller
                            name="tbFever"
                            control={form.control}
                            render={({ field }) => (
                              <SearchableSelect
                                options={YES_NO}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select..."
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 font-medium text-red-950">Night Sweats?</label>
                          <Controller
                            name="tbNightSweats"
                            control={form.control}
                            render={({ field }) => (
                              <SearchableSelect
                                options={YES_NO}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select..."
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 font-medium text-red-950">Significant Weight Loss?</label>
                          <Controller
                            name="tbWeightLoss"
                            control={form.control}
                            render={({ field }) => (
                              <SearchableSelect
                                options={YES_NO}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select..."
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Mental Wellbeing Screener</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Sensitive mental health screening result.</p>
                      </div>

                      <div className="space-y-2 max-w-sm">
                        <label className="text-sm font-semibold text-gray-700">Screener Outcome</label>
                        <Controller
                          name="mentalWellbeingResult"
                          control={form.control}
                          render={({ field }) => (
                            <SearchableSelect
                              options={MENTAL_WELLBEING_OPTIONS}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Choose outcome..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 11: Review & Submit */}
                {activeStep === 11 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-50 pb-4">
                      <h2 className="text-xl font-bold text-gray-900">Review Screening Record</h2>
                      <p className="text-sm text-gray-400 mt-1">Ensure everything is correct before final completion.</p>
                    </div>

                    <div className="grid gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 text-sm">
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Height / Weight</span>
                        <span className="font-medium text-gray-900">
                          {currentValues.height ? `${currentValues.height} cm` : '—'} / {currentValues.weight ? `${currentValues.weight} kg` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Undernutrition Class</span>
                        <span className="font-bold text-gray-900">{currentValues.undernutritionClass || '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Overweight Class</span>
                        <span className="font-bold text-gray-900">{currentValues.overweightClass || '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Haemoglobin (Hb)</span>
                        <span className="font-medium text-gray-900">
                          {currentValues.hb ? `${currentValues.hb} g/dL` : '—'} ({currentValues.anaemiaClass || '—'})
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Blood Pressure</span>
                        <span className="font-medium text-gray-900">
                          {currentValues.systolic ? `${currentValues.systolic}/${currentValues.diastolic} mmHg` : '—'} ({currentValues.bpClass || '—'})
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Metabolic Waist / Hx</span>
                        <span className="font-medium text-gray-900">
                          {currentValues.waistCircumference ? `${currentValues.waistCircumference} cm` : '—'} / Hx: {currentValues.familyHxCount ?? '—'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Vision (Right/Left)</span>
                        <span className="font-medium text-gray-900">
                          R: {currentValues.rightEyeAcuity ?? '—'} / L: {currentValues.leftEyeAcuity ?? '—'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">Decayed Teeth</span>
                        <span className="font-medium text-gray-900">{currentValues.decayedTeethCount ?? '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-2.5">
                        <span className="font-semibold text-gray-500">TB Red Flags</span>
                        <span className="font-bold text-red-600">
                          {[currentValues.tbCough, currentValues.tbFever, currentValues.tbNightSweats, currentValues.tbWeightLoss].includes('Yes') ? 'FLAGGED' : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="font-semibold text-gray-500">Mental Wellbeing</span>
                        <span className="font-bold text-gray-900">{currentValues.mentalWellbeingResult || '—'}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={() => navigate('/students')}
                        className="w-full h-12 rounded-xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Complete Screening
                      </Button>
                    </div>
                  </div>
                )}

                {/* Form Nav Buttons */}
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
