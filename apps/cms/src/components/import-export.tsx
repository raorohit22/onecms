import React, { useRef } from 'react';
import { Button } from '@onecms/ui/components/button';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export interface ImportExportProps {
  onExport: () => Promise<void> | void;
  onImport: (file: File) => Promise<void> | void;
  isExporting?: boolean;
  isImporting?: boolean;
  canExport?: boolean;
  canImport?: boolean;
}

export function ImportExport({ 
  onExport, 
  onImport, 
  isExporting, 
  isImporting,
  canExport = true,
  canImport = true
}: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Only CSV and Excel files are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      await onImport(file);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportClick = async () => {
    try {
      await onExport();
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input 
        type="file" 
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      
      {canExport && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportClick} 
          isLoading={isExporting}
        >
          {!isExporting && <Download className="mr-2 h-4 w-4" />}
          Export
        </Button>
      )}

      {canImport && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()} 
          isLoading={isImporting}
        >
          {!isImporting && <Upload className="mr-2 h-4 w-4" />}
          Import
        </Button>
      )}
    </div>
  );
}
