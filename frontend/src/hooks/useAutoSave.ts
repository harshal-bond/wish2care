import { useEffect, useRef, useState, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL, fetchApi } from '../lib/api';

export function useAutoSave({
  form,
  studentId,
  delay = 800,
}: {
  form: UseFormReturn<any>;
  studentId: number;
  delay?: number;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSavedPayloadRef = useRef<string>('');
  const savingRef = useRef(false);
  const queryClient = useQueryClient();

  // Keep latest form values accessible for unmount flush
  const formRef = useRef(form);
  formRef.current = form;

  const persist = useCallback(
    async (payload?: string) => {
      const currentValues = formRef.current.getValues();
      const currentPayload = payload ?? JSON.stringify(currentValues);

      if (currentPayload === lastSavedPayloadRef.current) {
        return true;
      }

      if (savingRef.current) {
        // Wait briefly if a save is already in flight, then retry once
        await new Promise((r) => setTimeout(r, 300));
      }

      try {
        savingRef.current = true;
        setIsSaving(true);
        setSaveError(null);

        await fetchApi(`/health-records/${studentId}`, {
          method: 'PUT',
          body: currentPayload,
        });

        lastSavedPayloadRef.current = currentPayload;
        setLastSaved(new Date());

        // Clear dirty so a refetch won't fight in-progress typing incorrectly
        formRef.current.reset(formRef.current.getValues());

        // Keep lists/other users' next load fresh
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['student', studentId] }),
          queryClient.invalidateQueries({ queryKey: ['students'] }),
        ]);

        return true;
      } catch (error: any) {
        console.error('Auto-save failed', error);
        setSaveError(error?.message || 'Save failed');
        return false;
      } finally {
        savingRef.current = false;
        setIsSaving(false);
      }
    },
    [studentId, queryClient]
  );

  // After server data is loaded into the form, mark that snapshot as "already saved"
  useEffect(() => {
    const currentValues = form.getValues();
    lastSavedPayloadRef.current = JSON.stringify(currentValues);
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((_value, { type }) => {
      // Skip pure resets; allow dirty setValue (remarks / BP class)
      if (type === undefined && !form.formState.isDirty) return;

      const currentValues = form.getValues();
      const currentPayload = JSON.stringify(currentValues);

      if (currentPayload === lastSavedPayloadRef.current) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSaveError(null);

      timeoutRef.current = setTimeout(() => {
        void persist(currentPayload);
      }, delay);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [form, delay, persist]);

  // Flush pending edits when leaving the page / closing the tab
  useEffect(() => {
    const flush = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      const payload = JSON.stringify(formRef.current.getValues());
      if (payload === lastSavedPayloadRef.current) return;

      // keepalive fetch for tab close
      const token = localStorage.getItem('token');
      try {
        fetch(`${API_URL}/health-records/${studentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: payload,
          keepalive: true,
        });
        lastSavedPayloadRef.current = payload;
      } catch {
        // ignore — best effort on unload
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      // Also flush when navigating away within the SPA
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      const payload = JSON.stringify(formRef.current.getValues());
      if (payload !== lastSavedPayloadRef.current) {
        void persist(payload);
      }
    };
  }, [studentId, persist]);

  const forceSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    return persist();
  };

  return { isSaving, lastSaved, saveError, forceSave };
}
