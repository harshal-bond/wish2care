import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import { Input, Button } from '../ui';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Loader2, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { namesLikelySame } from '@wish2care/shared';

// ── Local form schema – plain types, no transforms, avoids shared schema inference issues ──
const addStudentFormSchema = z.object({
  name: z.string().min(1, 'Student name is required'),
  age: z.number({ message: 'Age is required' }).int().gt(1).lt(100),
  gender: z.enum(['M', 'F']),
  schoolId: z.number({ message: 'Please select a school' }).int().positive('Please select a school'),
  studentCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  mobileNo: z.string().optional(),
  fatherMobileNo: z.string().optional(),
  nomineeName: z.string().optional(),
  relationship: z.string().optional(),
  courseName: z.string().optional(),
  collegeStream: z.string().optional(),
  localAddress: z.string().optional(),
  area: z.string().optional(),
});

type FormValues = z.infer<typeof addStudentFormSchema>;

/** Age in completed years from a YYYY-MM-DD (or parseable) date of birth. */
function ageFromDateOfBirth(dob: string): number | null {
  const trimmed = dob?.trim();
  if (!trimmed) return null;

  let birth: Date | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    birth = new Date(y, m - 1, d);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('-').map(Number);
    birth = new Date(y, m - 1, d);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    birth = new Date(y, m - 1, d);
  } else {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) birth = parsed;
  }

  if (!birth || Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function AddStudentModal({
  isOpen,
  onClose,
  initialName,
  user,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  user: any;
  onSuccess: (studentId: number) => void;
}) {
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState<FormValues | null>(null);

  const [checkingDupes, setCheckingDupes] = useState(false);

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => fetchApi('/schools'),
    enabled: isOpen,
  });

  const schools: { id: number; name: string }[] = schoolsData?.data || [];
  const defaultSchoolId =
    user?.role === 'fieldworker' && user?.assignedSchoolId ? user.assignedSchoolId : undefined;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addStudentFormSchema as any),
    defaultValues: {
      name: initialName,
      gender: 'M' as const,
      schoolId: defaultSchoolId,
    },
    mode: 'onTouched',
  });

  const dateOfBirth = useWatch({ control, name: 'dateOfBirth' });

  useEffect(() => {
    const age = ageFromDateOfBirth(dateOfBirth || '');
    if (age == null) return;
    setValue('age', age, { shouldValidate: true, shouldDirty: true });
  }, [dateOfBirth, setValue]);

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await fetchApi('/students', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.success) throw new Error(res.error || 'Failed to add student');
      return res.data;
    },
    onSuccess: (data) => {
      onSuccess(data.id);
      onClose();
    },
  });

  if (!isOpen) return null;

  const submitStudent = (data: FormValues) => {
    addMutation.mutate(data);
    setPendingSubmit(null);
    setDuplicateMatches([]);
  };

  const onSubmit = async (data: FormValues) => {
    setCheckingDupes(true);
    try {
      const res = await fetchApi(`/students/summary?search=${encodeURIComponent(data.name)}&limit=20`);
      const matches = ((res?.data || []) as { id: number; name: string; studentCode: string }[]).filter((s) =>
        namesLikelySame(s.name, data.name)
      );
      if (matches.length > 0) {
        setDuplicateMatches(matches);
        setPendingSubmit(data);
        return;
      }
    } catch {
      // Don't block adding a student if the lookup fails.
    } finally {
      setCheckingDupes(false);
    }
    submitStudent(data);
  };

  const confirmDespiteDuplicates = () => {
    if (pendingSubmit) submitStudent(pendingSubmit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Add Student Manually</h3>
            <p className="text-sm text-gray-500 mt-1">Enter complete student details.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <form id="add-student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Required Fields */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Required Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input {...register('name')} placeholder="e.g. Rahul Kumar" className="rounded-xl h-11" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
                  <Input
                    type="date"
                    {...register('dateOfBirth')}
                    className="rounded-xl h-11"
                  />
                  <p className="text-[11px] text-gray-400">Age fills automatically from DOB.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    {...register('age', { valueAsNumber: true })}
                    placeholder="e.g. 14"
                    className="rounded-xl h-11"
                  />
                  {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('gender')}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                </div>

                <div className="space-y-2 lg:col-span-4">
                  <label className="text-sm font-semibold text-gray-700">
                    School <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="schoolId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={schools.map((s) => ({ value: String(s.id), label: s.name }))}
                        value={field.value != null ? String(field.value) : null}
                        onChange={(val) => field.onChange(val ? Number(val) : undefined)}
                        placeholder="Select a school..."
                      />
                    )}
                  />
                  {errors.schoolId && (
                    <p className="text-xs text-red-500">{errors.schoolId.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Contact Fields */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Contact & Additional Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Student Code</label>
                  <Input
                    {...register('studentCode')}
                    placeholder="Auto-generated if empty"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Blood Group</label>
                  <Input
                    {...register('bloodGroup')}
                    placeholder="e.g. O+"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <Input
                    type="email"
                    {...register('email')}
                    placeholder="student@example.com"
                    className="rounded-xl h-11"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Mobile No.</label>
                  <Input
                    {...register('mobileNo')}
                    placeholder="e.g. 9876543210"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Father's Mobile No.</label>
                  <Input
                    {...register('fatherMobileNo')}
                    placeholder="e.g. 9876543210"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nominee Name</label>
                  <Input
                    {...register('nomineeName')}
                    placeholder="e.g. Sunita Devi"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Relationship</label>
                  <Input
                    {...register('relationship')}
                    placeholder="e.g. Mother"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
            </div>

            {/* Academic & Address */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Academic & Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Course Name</label>
                  <Input
                    {...register('courseName')}
                    placeholder="e.g. Class 10"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">College Stream</label>
                  <Input
                    {...register('collegeStream')}
                    placeholder="e.g. Science"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Local Address</label>
                  <Input
                    {...register('localAddress')}
                    placeholder="Enter full address"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Area</label>
                  <Input
                    {...register('area')}
                    placeholder="e.g. North Zone"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
            </div>
          </form>

          {duplicateMatches.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Possible duplicate student</p>
                  <p className="text-sm text-amber-800 mt-1">
                    These existing profiles may be the same person:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    {duplicateMatches.map((m) => (
                      <li key={m.id}>
                        <span className="font-semibold">{m.name}</span> ({m.studentCode})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDuplicateMatches([]);
                    setPendingSubmit(null);
                  }}
                  className="rounded-xl h-10"
                >
                  Review Name
                </Button>
                <Button
                  type="button"
                  onClick={confirmDespiteDuplicates}
                  className="rounded-xl h-10 bg-amber-700 hover:bg-amber-800 text-white"
                  disabled={addMutation.isPending}
                >
                  Create Anyway
                </Button>
              </div>
            </div>
          )}

          {addMutation.isError && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm font-bold text-red-900">Failed to add student</p>
              <p className="text-sm text-red-700 mt-0.5">{String(addMutation.error)}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-12 px-8 font-semibold border-gray-200 hover:bg-gray-100 text-gray-700"
            disabled={addMutation.isPending || checkingDupes}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-student-form"
            className="rounded-xl h-12 px-8 font-bold bg-gray-950 hover:bg-gray-800 text-white shadow-md disabled:opacity-50"
            disabled={addMutation.isPending || checkingDupes || !isValid}
          >
            {(addMutation.isPending || checkingDupes) && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            {addMutation.isPending ? 'Saving...' : checkingDupes ? 'Checking...' : 'Save Student'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
