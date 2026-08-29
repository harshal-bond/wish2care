import { useEffect, useRef, useState, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { buildStudentListStatus } from '@wish2care/shared';
import { fetchApi } from '../lib/api';

/** Manual save only — does not persist on typing, step change, or leaving the page. */
export function useAutoSave({
  form,
  studentId,
}: {
  form: UseFormReturn<any>;
  studentId: number;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedPayloadRef = useRef<string>('');
  const inFlightRef = useRef(false);
  const queryClient = useQueryClient();

  const formRef = useRef(form);
  formRef.current = form;

  const patchStudentCache = useCallback(
    (savedRecord: any) => {
      if (!savedRecord) return;

      queryClient.setQueryData(['student', studentId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            healthRecord: savedRecord,
          },
        };
      });

      queryClient.setQueryData(['students'], (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;
        return {
          ...old,
          data: old.data.map((s: any) =>
            s.id !== studentId
              ? s
              : {
                  ...s,
                  healthRecord: { updatedAt: savedRecord.updatedAt },
                  _status: buildStudentListStatus(
                    savedRecord,
                    s._status?.mentalAssessmentComplete ?? false
                  ),
                }
          ),
        };
      });
    },
    [queryClient, studentId]
  );

  const persist = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return false;

    if (!formRef.current.formState.isDirty) return true;

    const values = formRef.current.getValues();
    const payload = JSON.stringify(values);
    if (payload === lastSavedPayloadRef.current) return true;

    inFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetchApi(`/health-records/${studentId}`, {
        method: 'PUT',
        body: payload,
      });

      lastSavedPayloadRef.current = payload;
      setLastSaved(new Date());
      patchStudentCache(response?.data);
      formRef.current.reset(formRef.current.getValues());
      return true;
    } catch (error: any) {
      console.error('Save failed', error);
      setSaveError(error?.message || 'Save failed');
      return false;
    } finally {
      inFlightRef.current = false;
      setIsSaving(false);
    }
  }, [studentId, patchStudentCache]);

  useEffect(() => {
    lastSavedPayloadRef.current = JSON.stringify(form.getValues());
  }, [form]);

  const forceSave = async () => persist();

  return { isSaving, lastSaved, saveError, forceSave };
}
