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
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const queryClient = useQueryClient();

  // Keep latest form values accessible for unmount flush
  const formRef = useRef(form);
  formRef.current = form;

  const patchStudentCache = useCallback(
    (savedRecord: unknown) => {
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
      // Refresh list counts without refetching the open form
      void queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    [queryClient, studentId]
  );

  const persist = useCallback(async (): Promise<boolean> => {
    // Serialize saves: if one is in flight, queue a follow-up with the latest values
    if (inFlightRef.current) {
      queuedRef.current = true;
      return true;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    let success = true;

    try {
      let guard = 0;
      // Keep writing until the form snapshot matches what we last persisted
      while (guard++ < 25) {
        queuedRef.current = false;

        const values = formRef.current.getValues();
        const payload = JSON.stringify(values);

        if (payload === lastSavedPayloadRef.current) {
          break;
        }

        try {
          const response = await fetchApi(`/health-records/${studentId}`, {
            method: 'PUT',
            body: payload,
          });

          lastSavedPayloadRef.current = payload;
          setLastSaved(new Date());
          patchStudentCache(response?.data);

          // Only clear dirty if the user hasn't typed further during this request
          const latestPayload = JSON.stringify(formRef.current.getValues());
          if (latestPayload === payload) {
            formRef.current.reset(formRef.current.getValues());
          }
        } catch (error: any) {
          console.error('Auto-save failed', error);
          setSaveError(error?.message || 'Save failed');
          success = false;
          break;
        }

        if (
          !queuedRef.current &&
          JSON.stringify(formRef.current.getValues()) === lastSavedPayloadRef.current
        ) {
          break;
        }
      }
    } finally {
      inFlightRef.current = false;
      setIsSaving(false);
    }

    // Edits that arrived after the loop finished but before inFlight cleared
    if (success && queuedRef.current) {
      queuedRef.current = false;
      return persist();
    }

    queuedRef.current = false;
    return success;
  }, [studentId, patchStudentCache]);

  // After server data is loaded into the form, mark that snapshot as "already saved"
  useEffect(() => {
    const currentValues = form.getValues();
    lastSavedPayloadRef.current = JSON.stringify(currentValues);
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((_value, { type }) => {
      // Skip pure resets; allow dirty setValue (remarks / BP class)
      if (type === undefined && !form.formState.isDirty) return;

      const currentPayload = JSON.stringify(form.getValues());
      if (currentPayload === lastSavedPayloadRef.current) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSaveError(null);

      // Always read fresh values at save time — never close over a stale snapshot
      timeoutRef.current = setTimeout(() => {
        void persist();
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      const payload = JSON.stringify(formRef.current.getValues());
      if (payload !== lastSavedPayloadRef.current) {
        void persist();
      }
    };
  }, [studentId, persist]);

  const forceSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    // Wait out any in-flight save, then persist the absolute latest snapshot
    if (inFlightRef.current) {
      queuedRef.current = true;
      while (inFlightRef.current) {
        await new Promise((r) => setTimeout(r, 40));
      }
    }

    return persist();
  };

  return { isSaving, lastSaved, saveError, forceSave };
}
