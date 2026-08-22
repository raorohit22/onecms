import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@onecms/ui/components/card';
import { Label } from '@onecms/ui/components/label';
import { Input } from '@onecms/ui/components/input';
import { Button } from '@onecms/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@onecms/ui/components/select';
import { Send, Wand2, Globe } from 'lucide-react';
import type { PostFormData } from './post-editor.types';

interface PostPublishingSidebarProps {
  form: UseFormReturn<PostFormData>;
}

export function PostPublishingSidebar({ form }: PostPublishingSidebarProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const currentTitle = watch('title');
  const currentSlug = watch('slug');

  const handleGenerateSlug = () => {
    if (currentTitle) {
      const generated = currentTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setValue('slug', generated, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          <span>Publishing & URL</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Status Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">📝 Draft (Unpublished)</SelectItem>
                  <SelectItem value="REVIEW">👀 In Review</SelectItem>
                  <SelectItem value="PUBLISHED">🚀 Published (Live)</SelectItem>
                  <SelectItem value="ARCHIVED">📦 Archived</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Slug Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              URL Slug
            </Label>
            {currentTitle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateSlug}
                className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                title="Generate slug from title"
              >
                <Wand2 className="h-3 w-3" />
                <span>Auto-Slug</span>
              </Button>
            )}
          </div>
          <div className="relative">
            <Input id="slug" {...register('slug')} placeholder="my-awesome-post" className="text-xs font-mono" />
          </div>
          {currentSlug && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono truncate">
              <Globe className="h-3 w-3 shrink-0" />
              <span>/blog/{currentSlug}</span>
            </p>
          )}
          {errors.slug && <p className="text-xs text-red-500 font-medium">{errors.slug.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
