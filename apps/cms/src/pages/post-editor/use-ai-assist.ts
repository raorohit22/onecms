import { useState } from 'react';
import { apiClient as api } from '../../api/client';
import { toast } from 'sonner';

export interface SeoExtractionResult {
  title: string;
  description: string;
  tags?: string[];
}

/**
 * useAiAssist Hook
 * 
 * Coordinates background AI jobs (Draft Generation & SEO extraction) via BullMQ polling.
 * Encapsulates polling lifecycle, interval cleanup, and error toast feedback.
 */
export function useAiAssist() {
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isExtractingSeo, setIsExtractingSeo] = useState(false);

  const pollJob = <T>(
    jobId: string,
    onSuccess: (result: T) => void,
    onError: (reason?: string) => void
  ) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await api.get(`/ai/job/${jobId}`);
        const { state, result, failedReason } = statusRes.data;

        if (state === 'completed') {
          clearInterval(pollInterval);
          onSuccess(result);
        } else if (state === 'failed') {
          clearInterval(pollInterval);
          onError(failedReason);
        }
      } catch {
        clearInterval(pollInterval);
        onError('Network error while checking job status');
      }
    }, 2000);
  };

  const generateDraft = async (onContentGenerated: (draft: string) => void) => {
    const prompt = window.prompt("What should the draft be about? (e.g. '5 reasons to use React in 2026')");
    if (!prompt) return;

    setIsGeneratingDraft(true);
    try {
      const res = await api.post('/ai/generate-draft', { prompt });
      const jobId = res.data.jobId;

      pollJob<string>(
        jobId,
        (draft) => {
          onContentGenerated(draft);
          toast.success('Draft generated successfully');
          setIsGeneratingDraft(false);
        },
        (reason) => {
          toast.error(reason || 'Failed to generate draft');
          setIsGeneratingDraft(false);
        }
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start draft generation');
      setIsGeneratingDraft(false);
    }
  };

  const extractSeo = async (
    content: string,
    onSeoExtracted: (result: SeoExtractionResult) => void
  ) => {
    if (!content || content.length < 50) {
      toast.error('Not enough content to analyze for SEO (minimum 50 characters required)');
      return;
    }

    setIsExtractingSeo(true);
    try {
      const res = await api.post('/ai/extract-seo', { content });
      const jobId = res.data.jobId;

      pollJob<SeoExtractionResult>(
        jobId,
        (result) => {
          onSeoExtracted(result);
          if (result.tags && result.tags.length > 0) {
            toast.success(`SEO extracted! Suggested tags: ${result.tags.join(', ')}`);
          } else {
            toast.success('SEO metadata extracted successfully');
          }
          setIsExtractingSeo(false);
        },
        (reason) => {
          toast.error(reason || 'Failed to extract SEO');
          setIsExtractingSeo(false);
        }
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start SEO extraction');
      setIsExtractingSeo(false);
    }
  };

  return {
    isGeneratingDraft,
    isExtractingSeo,
    generateDraft,
    extractSeo,
  };
}
