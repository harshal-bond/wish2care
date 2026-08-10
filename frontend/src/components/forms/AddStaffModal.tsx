import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import { Input, Button } from '../ui';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';

const addStaffFormSchema = z.object({
  name: z.string().min(1, 'Staff name is required'),
  age: z.number({ message: 'Age is required' }).int().gt(1).lt(100),
  gender: z.enum(['M', 'F']),
  schoolId: z.number({ message: 'Please select a school' }).int().positive('Please select a school'),
  staffCode: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  mobileNo: z.string().optional(),
});

type FormValues = z.infer<typeof addStaffFormSchema>;

export function AddStaffModal({
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
  onSuccess: (staffId: number) => void;
}) {
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
    formState: { errors, isValid },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addStaffFormSchema as any),
    defaultValues: {
      name: initialName,
      gender: 'M' as const,
      schoolId: defaultSchoolId,
    },
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      fetchApi('/staff', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          email: values.email || null,
        }),
      }),
    onSuccess: (res) => {
      if (res?.data?.id) onSuccess(res.data.id);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Add Staff Member</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-50 text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="p-6 space-y-4 overflow-y-auto"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <Input className="h-11 rounded-xl" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Age</label>
              <Input
                type="number"
                className="h-11 rounded-xl"
                {...register('age', { valueAsNumber: true })}
              />
              {errors.age && <p className="text-xs text-red-600">{errors.age.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Gender</label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={['M', 'F']}
                    value={field.value}
                    onChange={(v) => field.onChange(v || 'M')}
                  />
                )}
              />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">School / College</label>
              <Controller
                name="schoolId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={schools.map((s) => ({ value: String(s.id), label: s.name }))}
                    value={field.value != null ? String(field.value) : null}
                    onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    placeholder="Select school..."
                    error={!!errors.schoolId}
                  />
                )}
              />
              {errors.schoolId && <p className="text-xs text-red-600">{errors.schoolId.message}</p>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Designation</label>
              <Input className="h-11 rounded-xl" placeholder="e.g. Lecturer" {...register('designation')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Department</label>
              <Input className="h-11 rounded-xl" placeholder="e.g. Science" {...register('department')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <Input className="h-11 rounded-xl" type="email" {...register('email')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Mobile</label>
              <Input className="h-11 rounded-xl" {...register('mobileNo')} />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">{(mutation.error as Error)?.message || 'Failed to add staff'}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || mutation.isPending}
              className="flex-1 h-11 rounded-xl bg-gray-950 text-white"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Staff'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
