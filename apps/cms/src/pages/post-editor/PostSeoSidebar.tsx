import React, { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@onecms/ui/components/card';
import { Button } from '@onecms/ui/components/button';
import { Label } from '@onecms/ui/components/label';
import { Input } from '@onecms/ui/components/input';
import { Textarea } from '@onecms/ui/components/textarea';
import { Sparkles, Loader2, Search, Share2, Globe, Eye } from 'lucide-react';
import type { PostFormData } from './post-editor.types';

interface PostSeoSidebarProps {
  form: UseFormReturn<PostFormData>;
  onExtractSeo: () => void;
  isExtractingSeo: boolean;
}

export function PostSeoSidebar({ form, onExtractSeo, isExtractingSeo }: PostSeoSidebarProps) {
  const { register, watch } = form;
  const [activePreviewTab, setActivePreviewTab] = useState<'google' | 'social'>('google');

  const title = watch('title') || 'Untitled Post';
  const slug = watch('slug') || 'post-slug';
  const featuredImage = watch('featuredImage') || '';
  const metaTitle = watch('seo.metaTitle') || '';
  const metaDescription = watch('seo.metaDescription') || '';
  const canonicalUrl = watch('seo.canonicalUrl') || '';
  const ogImage = watch('seo.ogImage') || featuredImage;
  const keywords = watch('seo.keywords') || '';

  const displayTitle = metaTitle.trim() || title;
  const displayDescription = metaDescription.trim() || 'No meta description provided. Search engines will generate a snippet from your post content.';

  const titleLength = metaTitle.length;
  const descriptionLength = metaDescription.length;

  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <span>SEO & Metadata</span>
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2.5 gap-1.5 bg-background shadow-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          onClick={onExtractSeo}
          disabled={isExtractingSeo}
        >
          {isExtractingSeo ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          <span>AI Auto-SEO</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Meta Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="metaTitle" className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Meta Title
                </Label>
                <span
                  className={`text-[11px] font-mono ${
                    titleLength > 60
                      ? 'text-amber-500 font-semibold'
                      : titleLength >= 40
                      ? 'text-emerald-500 font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {titleLength}/60 chars
                </span>
              </div>
              <Input
                id="metaTitle"
                {...register('seo.metaTitle')}
                placeholder={title || 'SEO Title for search engines'}
                className="text-xs"
              />
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="metaDescription" className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Meta Description
                </Label>
                <span
                  className={`text-[11px] font-mono ${
                    descriptionLength > 160
                      ? 'text-amber-500 font-semibold'
                      : descriptionLength >= 120
                      ? 'text-emerald-500 font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {descriptionLength}/160 chars
                </span>
              </div>
              <Textarea
                id="metaDescription"
                {...register('seo.metaDescription')}
                placeholder="Compelling 150-160 character summary for search engines..."
                rows={4}
                className="text-xs resize-none"
              />
            </div>
            
            {/* Focus Keywords */}
            <div className="space-y-1.5">
              <Label htmlFor="keywords" className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                Focus Keywords
              </Label>
              <Input
                id="keywords"
                {...register('seo.keywords')}
                placeholder="nextjs, react, cms, web development"
                className="text-xs"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Canonical URL */}
            <div className="space-y-1.5">
              <Label htmlFor="canonicalUrl" className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                Canonical URL
              </Label>
              <Input
                id="canonicalUrl"
                {...register('seo.canonicalUrl')}
                placeholder="https://yourblog.com/posts/original-slug"
                className="text-xs font-mono"
              />
            </div>

            {/* OpenGraph Image */}
            <div className="space-y-1.5">
              <Label htmlFor="ogImage" className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                Social Share Image (OG Image)
              </Label>
              <Input
                id="ogImage"
                {...register('seo.ogImage')}
                placeholder={featuredImage || 'https://example.com/og-image.jpg'}
                className="text-xs font-mono"
              />
            </div>

            {/* Search Engine Indexing (noIndex) */}
            <div className="pt-2 flex items-center justify-between">
              <div>
                <Label htmlFor="noIndex" className="text-xs font-medium cursor-pointer">
                  Discourage Search Engines (noindex)
                </Label>
                <p className="text-[11px] text-muted-foreground">Prevent Google and robots from indexing this post.</p>
              </div>
              <input
                id="noIndex"
                type="checkbox"
                {...register('seo.noIndex')}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Search & Social Previews */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Live Search & Social Preview</span>
            </span>
            <div className="flex rounded-md border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setActivePreviewTab('google')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  activePreviewTab === 'google' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('social')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  activePreviewTab === 'social' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                }`}
              >
                Social Card
              </button>
            </div>
          </div>

          {activePreviewTab === 'google' ? (
            /* Google Search SERP Snippet Preview */
            <div className="rounded-lg border border-border p-3 bg-muted/10 space-y-1 font-sans">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <Globe className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">https://yourblog.com/blog/{slug}</span>
              </div>
              <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline line-clamp-1 cursor-pointer">
                {displayTitle}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {displayDescription}
              </p>
            </div>
          ) : (
            /* Social Share Card Preview (Twitter/LinkedIn/Facebook) */
            <div className="rounded-lg border border-border overflow-hidden bg-card shadow-xs">
              {ogImage ? (
                <div className="aspect-video w-full bg-muted/40 overflow-hidden">
                  <img
                    src={ogImage}
                    alt="OG Social Card Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                  No preview image
                </div>
              )}
              <div className="p-2.5 space-y-1 bg-muted/20">
                <p className="text-[10px] uppercase font-mono text-muted-foreground">yourblog.com</p>
                <h4 className="text-xs font-semibold text-foreground line-clamp-1">{displayTitle}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{displayDescription}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
