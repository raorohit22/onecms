import React from 'react';
import { Button } from '@onecms/ui/components/button';
import type { PostRevisionItem } from './post-editor.types';

interface PostRevisionHistoryProps {
  revisions: PostRevisionItem[];
  onRestore: (revision: PostRevisionItem) => void;
}

export function PostRevisionHistory({ revisions, onRestore }: PostRevisionHistoryProps) {
  if (!revisions || revisions.length === 0) return null;

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        Revisions History
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {revisions.map((rev) => (
          <div
            key={rev.id}
            className="text-sm p-3 border rounded bg-background flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {rev.eventType?.replace('POST_', '') || 'UPDATE'}
              </span>
              <span className="text-xs text-muted-foreground">
                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>
                By: {rev.userId?.name || rev.userId?.firstName || rev.userId?.email || 'Unknown'}
              </span>
              {rev.metadata?.snapshot && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-[10px]"
                  onClick={() => onRestore(rev)}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
