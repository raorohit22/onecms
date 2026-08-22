import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePost } from '../hooks/use-posts';
import { useAuth } from '../auth/auth-context';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@onecms/ui/components/button';
import { Input } from '@onecms/ui/components/input';
import { GlobalLoader } from '@onecms/ui/components/loader';
import { Label } from '@onecms/ui/components/label';
import { Textarea } from '@onecms/ui/components/textarea';
import { ArrowLeft, Sparkles, Loader2, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell, PageShellHeader, PageShellTitle, PageShellContent } from '../components/page-shell';
import { apiClient as api } from '../api/client';
import { queryKeys } from '../api/query-keys';

import { postFormSchema, type PostFormData, type PostRevisionItem } from './post-editor/post-editor.types';
import { usePostAutosave } from './post-editor/use-post-autosave';
import { useAiAssist } from './post-editor/use-ai-assist';
import { PostPublishingSidebar } from './post-editor/PostPublishingSidebar';
import { PostMediaSidebar } from './post-editor/PostMediaSidebar';
import { PostTaxonomySidebar } from './post-editor/PostTaxonomySidebar';
import { PostSeoSidebar } from './post-editor/PostSeoSidebar';
import { PostRevisionHistory } from './post-editor/PostRevisionHistory';

const QuillEditor = React.lazy(() =>
  import('@onecms/ui/components/rich-text-editor').then((module) => ({ default: module.RichTextEditor }))
);

function ContentStats({ control }: { control: any }) {
  const currentContent = useWatch({ control, name: 'content' });
  const extractText = (htmlString: string): string => {
    if (!htmlString || typeof htmlString !== 'string') return '';
    return htmlString.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  };
  const textOnly = extractText(currentContent);
  const wordCount = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <span className="text-xs text-muted-foreground flex items-center gap-2">
      <span className="inline-flex items-center gap-1 font-mono">
        <FileText className="h-3 w-3" />
        {wordCount} words
      </span>
      <span>•</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {readTimeMinutes} min read
      </span>
    </span>
  );
}

/**
 * PostEditor Page Component
 * 
 * Orchestrates full-featured post authoring, including:
 * - Rich text content editing with image and video embeds
 * - Thumbnail image and YouTube embed links
 * - Categories and Tags taxonomy multi-selection
 * - Comprehensive SEO metadata, Google SERP & Social Card previews
 * - Real-time autosave, AI draft generation, and revision history tracking.
 */
export function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditing = Boolean(id && id !== 'new');
  const { query, createMutation, updateMutation } = usePost(id);
  const { isGeneratingDraft, isExtractingSeo, generateDraft, extractSeo } = useAiAssist();

  // Fetch revisions for existing post
  const { data: revisions } = useQuery<PostRevisionItem[]>({
    queryKey: queryKeys.posts.revisions(id),
    queryFn: async () => {
      const res = await api.get(`/post/${id}/revisions`);
      return res.data;
    },
    enabled: isEditing,
  });

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'DRAFT',
      authorId: user?.id || '',
      categoryIds: [],
      tagIds: [],
      featuredImage: '',
      youtubeUrl: '',
      seo: {
        metaTitle: '',
        metaDescription: '',
        canonicalUrl: '',
        ogImage: '',
        keywords: '',
        noIndex: false,
      },
    },
  });

  // Form hook initialization


  // Populate initial values when post data is loaded
  useEffect(() => {
    if (isEditing && query.data) {
      const post = query.data;
      form.reset({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        status: post.status || 'DRAFT',
        authorId: typeof post.authorId === 'string' ? post.authorId : post.authorId?._id || user?.id || '',
        categoryIds: (post.categoryIds || []).map((c: any) => (typeof c === 'string' ? c : c._id || c.id)),
        tagIds: (post.tagIds || []).map((t: any) => (typeof t === 'string' ? t : t._id || t.id)),
        featuredImage: post.featuredImage || '',
        youtubeUrl: post.youtubeUrl || '',
        seo: {
          metaTitle: post.seo?.metaTitle || '',
          metaDescription: post.seo?.metaDescription || '',
          canonicalUrl: post.seo?.canonicalUrl || '',
          ogImage: post.seo?.ogImage || post.featuredImage || '',
          keywords: post.seo?.keywords || '',
          noIndex: post.seo?.noIndex || false,
        },
      });
    }
  }, [isEditing, query.data, form, user]);

  // Setup debounced autosaving
  usePostAutosave({
    form,
    isEditing,
    onSave: async (data) => {
      const payload = { ...data, authorId: user?.id };
      await updateMutation.mutateAsync({ id: id!, payload });
    },
  });

  const onSubmit = async (data: PostFormData) => {
    try {
      const payload = { ...data, authorId: user?.id };
      if (!isEditing) {
        await createMutation.mutateAsync(payload);
        toast.success('Post created successfully');
      } else {
        await updateMutation.mutateAsync({ id: id!, payload });
        toast.success('Post updated successfully');
      }
      navigate('/posts');
    } catch (err: any) {
      if (err?.status === 409) {
        form.setError('slug', { message: 'A post with this slug already exists' });
      } else {
        toast.error(err?.message || 'Failed to save post');
      }
    }
  };

  const handleRestoreRevision = (revision: PostRevisionItem) => {
    if (!window.confirm('Restore this revision? Unsaved changes will be replaced.')) return;
    const snap = revision.metadata?.snapshot;
    if (snap) {
      form.reset({
        ...form.getValues(),
        title: snap.title || '',
        content: snap.content || '',
        excerpt: snap.excerpt || '',
        status: snap.status || 'DRAFT',
        featuredImage: snap.featuredImage || '',
        youtubeUrl: snap.youtubeUrl || '',
        categoryIds: snap.categoryIds || [],
        tagIds: snap.tagIds || [],
        seo: {
          metaTitle: snap.seo?.metaTitle || '',
          metaDescription: snap.seo?.metaDescription || '',
          canonicalUrl: snap.seo?.canonicalUrl || '',
          ogImage: snap.seo?.ogImage || '',
          keywords: snap.seo?.keywords || '',
          noIndex: snap.seo?.noIndex || false,
        },
      });
      toast.success('Revision restored! Click Save Changes to confirm.');
    }
  };

  const isLoading = isEditing && query.isLoading;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <GlobalLoader fullScreen text="Loading editor..." />;
  }

  return (
    <PageShell>
      <PageShellHeader>
        <div className="flex items-center gap-4 col-start-1 row-start-1">
          <Button variant="ghost" size="icon" asChild className="shrink-0 -ml-2">
            <Link to="/posts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageShellTitle className="col-start-1 row-start-1">
            {!isEditing ? 'Create Post' : 'Edit Post'}
          </PageShellTitle>
        </div>
      </PageShellHeader>

      <PageShellContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Post Title
                </Label>
                <Input
                  id="title"
                  className="text-lg font-medium h-12 rounded-xl"
                  {...form.register('title')}
                  placeholder="Enter a compelling title..."
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500 font-medium">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Content Rich Text Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="content" className="text-base font-semibold">
                      Body Content
                    </Label>
                    <ContentStats control={form.control} />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      generateDraft((draft) => {
                        const current = form.getValues('content');
                        form.setValue('content', current ? `${current}<br><br>${draft}` : draft, {
                          shouldDirty: true,
                        });
                      })
                    }
                    disabled={isGeneratingDraft}
                    className="h-8 text-xs gap-1.5 bg-background shadow-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  >
                    {isGeneratingDraft ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>AI Draft Assist</span>
                  </Button>
                </div>

                <Controller
                  name="content"
                  control={form.control}
                  render={({ field }) => (
                    <React.Suspense
                      fallback={
                        <div className="min-h-[350px] flex items-center justify-center border rounded-xl bg-card">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      }
                    >
                      <QuillEditor value={field.value} onChange={field.onChange} />
                    </React.Suspense>
                  )}
                />
              </div>

              {/* Excerpt Textarea */}
              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-sm font-semibold">
                  Excerpt / Brief Summary
                </Label>
                <Textarea
                  id="excerpt"
                  {...form.register('excerpt')}
                  placeholder="A concise summary of the post displayed in blog cards and search listings..."
                  rows={3}
                  className="rounded-xl resize-none text-sm leading-relaxed"
                />
              </div>
              {/* SEO, SERP Preview & Social Card */}
              <div className="pt-4">
                <PostSeoSidebar
                  form={form}
                  isExtractingSeo={isExtractingSeo}
                  onExtractSeo={() =>
                    extractSeo(extractText(form.getValues('content')), (result) => {
                      form.setValue('seo.metaTitle', result.title, { shouldDirty: true });
                      form.setValue('seo.metaDescription', result.description, { shouldDirty: true });
                    })
                  }
                />
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Publishing & Slug */}
              <PostPublishingSidebar form={form} />

              {/* Media & YouTube Embed */}
              <PostMediaSidebar form={form} />

              {/* Categories & Tags Taxonomy */}
              <PostTaxonomySidebar form={form} />

              {/* Revision History */}
              {isEditing && revisions && (
                <PostRevisionHistory
                  revisions={revisions}
                  onRestore={handleRestoreRevision}
                />
              )}
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border flex justify-end gap-3 z-20 px-8 shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/posts')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Post'}
            </Button>
          </div>
        </form>
      </PageShellContent>
    </PageShell>
  );
}
