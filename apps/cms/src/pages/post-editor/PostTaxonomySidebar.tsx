import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@onecms/ui/components/card';
import { Label } from '@onecms/ui/components/label';
import { Badge } from '@onecms/ui/components/badge';
import { FolderTree, Tags, Check, Plus } from 'lucide-react';
import type { PostFormData } from './post-editor.types';
import { useCategories } from '../../hooks/use-categories';
import { useTags } from '../../hooks/use-tags';

interface PostTaxonomySidebarProps {
  form: UseFormReturn<PostFormData>;
}

export const PostTaxonomySidebar: React.FC<PostTaxonomySidebarProps> = ({ form }) => {
  const { watch, setValue } = form;

  const selectedCategoryIds = watch('categoryIds') || [];
  const selectedTagIds = watch('tagIds') || [];

  const { query: catQuery } = useCategories({ page: 1, pageSize: 100, sort: 'name', dir: 'asc' });
  const { query: tagQuery } = useTags({ page: 1, pageSize: 100, sort: 'name', dir: 'asc' });

  const categories = catQuery.data?.data || [];
  const isLoadingCategories = catQuery.isLoading;

  const tags = tagQuery.data?.data || [];
  const isLoadingTags = tagQuery.isLoading;

  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setValue(
        'categoryIds',
        selectedCategoryIds.filter((id) => id !== categoryId),
        { shouldDirty: true }
      );
    } else {
      setValue('categoryIds', [...selectedCategoryIds, categoryId], { shouldDirty: true });
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setValue(
        'tagIds',
        selectedTagIds.filter((id) => id !== tagId),
        { shouldDirty: true }
      );
    } else {
      setValue('tagIds', [...selectedTagIds, tagId], { shouldDirty: true });
    }
  };

  return (
    <Card className="shadow-xs border-border">
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-primary" />
          <span>Categories & Tags</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-5">
        {/* Categories Section */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Categories</span>
            <span className="text-[11px] font-normal lowercase text-muted-foreground">
              {selectedCategoryIds.length} selected
            </span>
          </Label>

          {isLoadingCategories ? (
            <p className="text-xs text-muted-foreground italic">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-xs text-muted-foreground">No categories found in organization.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {categories.map((cat: any) => {
                const catId = cat.id || cat._id;
                const isSelected = selectedCategoryIds.includes(catId);
                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => handleToggleCategory(catId)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 opacity-60" />}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="border-t border-border/60 pt-4 space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Tags className="h-3.5 w-3.5" />
              <span>Tags</span>
            </span>
            <span className="text-[11px] font-normal lowercase text-muted-foreground">
              {selectedTagIds.length} selected
            </span>
          </Label>

          {isLoadingTags ? (
            <p className="text-xs text-muted-foreground italic">Loading tags...</p>
          ) : tags.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tags found in organization.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {tags.map((tag: any) => {
                const tagId = tag.id || tag._id;
                const isSelected = selectedTagIds.includes(tagId);
                return (
                  <button
                    key={tagId}
                    type="button"
                    onClick={() => handleToggleTag(tagId)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-secondary text-secondary-foreground border-secondary-foreground/20 font-semibold'
                        : 'bg-background text-muted-foreground border-border hover:border-foreground/40'
                    }`}
                  >
                    <span>#{tag.name}</span>
                    {isSelected && <Check className="h-2.5 w-2.5 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
