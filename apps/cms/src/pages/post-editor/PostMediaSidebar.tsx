import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@onecms/ui/components/card';
import { Input } from '@onecms/ui/components/input';
import { Label } from '@onecms/ui/components/label';
import { Button } from '@onecms/ui/components/button';
import { Image as ImageIcon, Video, Trash2, Sparkles, ExternalLink } from 'lucide-react';
import type { PostFormData } from './post-editor.types';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl, getYouTubeVideoId } from '../../lib/youtube';

interface PostMediaSidebarProps {
  form: UseFormReturn<PostFormData>;
}

export const PostMediaSidebar: React.FC<PostMediaSidebarProps> = ({ form }) => {
  const { register, watch, setValue } = form;

  const featuredImage = watch('featuredImage');
  const youtubeUrl = watch('youtubeUrl');

  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);
  const youtubeThumbnail = getYouTubeThumbnailUrl(youtubeUrl);

  const handleUseYouTubeThumbnail = () => {
    if (youtubeThumbnail) {
      setValue('featuredImage', youtubeThumbnail, { shouldDirty: true });
    }
  };

  const handleClearFeaturedImage = () => {
    setValue('featuredImage', '', { shouldDirty: true });
  };

  const handleClearYouTubeUrl = () => {
    setValue('youtubeUrl', '', { shouldDirty: true });
  };

  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span>Featured Media & Video</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5">
        {/* 1. Thumbnail / Featured Image */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="featuredImage" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Thumbnail / Featured Image
            </Label>
            {youtubeThumbnail && !featuredImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUseYouTubeThumbnail}
                className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400 gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Sparkles className="h-3 w-3" />
                <span>Fetch from YouTube</span>
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="featuredImageFile" className="text-sm">Upload Thumbnail Image</Label>
            <Input
              id="featuredImageFile"
              type="file"
              accept="image/*"
              className="cursor-pointer file:cursor-pointer"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  // We'll dispatch a custom event or you can use a proper apiClient call here
                  // Since we are in the sidebar, we'll use window.fetch as a simple fallback if apiClient isn't exported
                  const orgId = localStorage.getItem('organizationId') || '';
                  const token = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                  
                  const res = await fetch(`${apiUrl}/media`, {
                    method: 'POST',
                    headers: {
                      'X-Organization-Id': orgId,
                      'Authorization': `Bearer ${token}`
                    },
                    body: formData
                  });
                  
                  if (!res.ok) throw new Error('Upload failed');
                  const data = await res.json();
                  setValue('featuredImage', data.url, { shouldDirty: true });
                } catch (error) {
                  console.error('Failed to upload image', error);
                  alert('Failed to upload image. Check console for details.');
                }
              }}
            />
            {featuredImage ? (
              <div className="mt-3 relative group rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video flex items-center justify-center">
                <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <Button type="button" variant="destructive" size="sm" onClick={handleClearFeaturedImage}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/80 p-4 text-center bg-muted/10">
                <ImageIcon className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No thumbnail set. Paste an image URL above.</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 pt-4 space-y-2">
          {/* 2. YouTube Embed Video */}
          <div className="flex items-center justify-between">
            <Label htmlFor="youtubeUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-red-500" />
              <span>YouTube Video Link</span>
            </Label>
            {youtubeUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearYouTubeUrl}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Input
              id="youtubeUrl"
              placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
              {...register('youtubeUrl')}
              className="text-xs"
            />

            {/* YouTube Live Embed Preview Player */}
            {youtubeEmbedUrl ? (
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  YouTube Video Detected (ID: {getYouTubeVideoId(youtubeUrl)})
                </p>
                <div className="rounded-lg overflow-hidden border border-border aspect-video shadow-xs bg-black">
                  <iframe
                    src={youtubeEmbedUrl}
                    title="YouTube Embed Preview"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : youtubeUrl ? (
              <p className="text-[11px] text-amber-500">
                Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...).
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
