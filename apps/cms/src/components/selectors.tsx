import React from 'react';
import { useCategories } from '../hooks/use-categories';
import { useTags } from '../hooks/use-tags';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@onecms/ui/components/select';
import { Checkbox } from '@onecms/ui/components/checkbox';

export function CategoryMultiSelect({ value = [], onChange }: { value?: string[], onChange: (val: string[]) => void }) {
  const { query } = useCategories();
  const categories = query.data || [];

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...value, id]);
    } else {
      onChange(value.filter(v => v !== id));
    }
  };

  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
      {categories.map((cat: any) => (
        <div key={cat._id} className="flex items-center space-x-2">
          <Checkbox 
            id={`cat-${cat._id}`} 
            checked={value.includes(cat._id)}
            onCheckedChange={(c) => handleToggle(cat._id, c === true)}
          />
          <label htmlFor={`cat-${cat._id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {cat.name}
          </label>
        </div>
      ))}
      {categories.length === 0 && <div className="text-sm text-muted-foreground p-2">No categories found.</div>}
    </div>
  );
}

export function TagMultiSelect({ value = [], onChange }: { value?: string[], onChange: (val: string[]) => void }) {
  const { query } = useTags();
  const tags = query.data || [];

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...value, id]);
    } else {
      onChange(value.filter(v => v !== id));
    }
  };

  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
      {tags.map((tag: any) => (
        <div key={tag._id} className="flex items-center space-x-2">
          <Checkbox 
            id={`tag-${tag._id}`} 
            checked={value.includes(tag._id)}
            onCheckedChange={(c) => handleToggle(tag._id, c === true)}
          />
          <label htmlFor={`tag-${tag._id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {tag.name}
          </label>
        </div>
      ))}
      {tags.length === 0 && <div className="text-sm text-muted-foreground p-2">No tags found.</div>}
    </div>
  );
}
