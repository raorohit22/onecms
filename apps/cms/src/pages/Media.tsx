import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlobalLoader } from '@onecms/ui/components/loader';
import { apiClient as api } from '../api/client';
import { PageShell, PageShellHeader, PageShellTitle, PageShellContent } from '../components/page-shell';

export function MediaLibrary() {
  const { data, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      const res = await api.get('/media');
      return res.data;
    }
  });

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Media Library</PageShellTitle>
      </PageShellHeader>
      <PageShellContent>
        {isLoading ? (
          <GlobalLoader text="Loading media library..." className="min-h-[300px]" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.items?.map((item: any) => (
              <div key={item.id} className="border rounded-lg overflow-hidden flex flex-col group">
                <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt={item.originalName} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-muted-foreground">File</span>
                  )}
                </div>
                <div className="p-2 text-xs truncate">
                  {item.originalName}
                </div>
              </div>
            ))}
            {(!data?.items || data.items.length === 0) && (
              <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg border-dashed">
                No media files found.
              </div>
            )}
          </div>
        )}
      </PageShellContent>
    </PageShell>
  );
}
