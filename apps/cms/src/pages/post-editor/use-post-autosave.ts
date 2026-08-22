import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface UsePostAutosaveOptions<T extends Record<string, any>> {
  form: UseFormReturn<T>;
  isEditing: boolean;
  onSave: (data: T) => Promise<void>;
  delayMs?: number;
}

/**
 * usePostAutosave Hook
 * 
 * Manages debounced silent autosaving for the Post Editor.
 * Listens for form changes, validates on dirty state, and triggers background persistence.
 */
export function usePostAutosave<T extends Record<string, any>>({
  form,
  isEditing,
  onSave,
  delayMs = 5000,
}: UsePostAutosaveOptions<T>) {
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only autosave for existing posts to prevent unexpected route redirects for new drafts
    if (!isEditing) return;

    const subscription = form.watch(() => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(async () => {
        if (form.formState.isDirty) {
          const isValid = await form.trigger();
          if (isValid) {
            try {
              const values = form.getValues();
              await onSave(values as T);
              form.reset(values, { keepValues: true, keepDirty: false });
              toast.success('Autosaved', { position: 'bottom-right' });
            } catch (err: any) {
              toast.error(err?.message || 'Autosave failed', { position: 'bottom-right' });
            }
          }
        }
      }, delayMs);
    });

    return () => {
      subscription.unsubscribe();
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [form, isEditing, onSave, delayMs]);
}
