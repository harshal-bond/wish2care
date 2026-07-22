import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { fetchApi } from '../lib/api';

export function useAutoSave({
  form,
  studentId,
  delay = 2500,
}: {
  form: UseFormReturn<any>;
  studentId: number;
  delay?: number;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  
  // Track last saved payload string to compare deeply
  const lastSavedPayloadRef = useRef<string>('');

  // Initialize the last saved payload once form has values loaded
  useEffect(() => {
    const currentValues = form.getValues();
    lastSavedPayloadRef.current = JSON.stringify(currentValues);
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((_value, { type }) => {
      // type is undefined if programmatic change, skip auto-save on programmatic
      if (type === undefined) return;
      
      const currentValues = form.getValues();
      const currentPayload = JSON.stringify(currentValues);

      // 1. Only save if data actually changed
      if (currentPayload === lastSavedPayloadRef.current) {
        return;
      }
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      setSaveError(null);

      timeoutRef.current = setTimeout(async () => {
        // 2. Only save if validation passes
        const isValid = await form.trigger();
        if (!isValid) {
          setSaveError("Validation failed");
          return;
        }

        try {
          setIsSaving(true);
          setSaveError(null);
          await fetchApi(`/health-records/${studentId}`, {
            method: 'PUT',
            body: currentPayload
          });
          
          lastSavedPayloadRef.current = currentPayload;
          setLastSaved(new Date());
        } catch (error: any) {
          console.error("Auto-save failed", error);
          setSaveError("Save failed");
        } finally {
          setIsSaving(false);
        }
      }, delay);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [form, studentId, delay]);

  const forceSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const isValid = await form.trigger();
      if (!isValid) {
        setSaveError("Validation failed");
        setIsSaving(false);
        return false;
      }

      const currentValues = form.getValues();
      const currentPayload = JSON.stringify(currentValues);

      await fetchApi(`/health-records/${studentId}`, {
        method: 'PUT',
        body: currentPayload
      });
      lastSavedPayloadRef.current = currentPayload;
      setLastSaved(new Date());
      return true;
    } catch (error: any) {
      console.error("Force save failed", error);
      setSaveError(error.message || "Save failed");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, lastSaved, saveError, forceSave };
}

