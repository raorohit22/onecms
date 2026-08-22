import { useState, useCallback } from 'react';

export interface TableSelectionState {
  selectedIds: string[];
  isAllSelected: boolean;
  deselectedIds: string[];
  
  toggleRow: (id: string) => void;
  toggleAllOnPage: (pageIds: string[]) => void;
  selectAllAcrossPages: () => void;
  clearSelection: () => void;
  
  isRowSelected: (id: string) => boolean;
  isPageFullySelected: (pageIds: string[]) => boolean;
  isPagePartiallySelected: (pageIds: string[]) => boolean;
  
  hasSelection: boolean;
  selectionCount: number;
}

export function useTableSelection(totalItems: number = 0): TableSelectionState {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [deselectedIds, setDeselectedIds] = useState<string[]>([]);

  const isRowSelected = useCallback((id: string) => {
    if (isAllSelected) {
      return !deselectedIds.includes(id);
    }
    return selectedIds.includes(id);
  }, [isAllSelected, selectedIds, deselectedIds]);

  const toggleRow = useCallback((id: string) => {
    if (isAllSelected) {
      setDeselectedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  }, [isAllSelected]);

  const toggleAllOnPage = useCallback((pageIds: string[]) => {
    const fullySelected = pageIds.every(id => isRowSelected(id));
    
    if (fullySelected) {
      // Deselect all on page
      if (isAllSelected) {
        const newDeselected = new Set(deselectedIds);
        pageIds.forEach(id => newDeselected.add(id));
        setDeselectedIds([...newDeselected]);
      } else {
        setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
      }
    } else {
      // Select all on page
      if (isAllSelected) {
        setDeselectedIds(prev => prev.filter(id => !pageIds.includes(id)));
      } else {
        const newSelected = new Set(selectedIds);
        pageIds.forEach(id => newSelected.add(id));
        setSelectedIds([...newSelected]);
      }
    }
  }, [isAllSelected, selectedIds, deselectedIds, isRowSelected]);

  const selectAllAcrossPages = useCallback(() => {
    setIsAllSelected(true);
    setSelectedIds([]);
    setDeselectedIds([]);
  }, []);

  const clearSelection = useCallback(() => {
    setIsAllSelected(false);
    setSelectedIds([]);
    setDeselectedIds([]);
  }, []);

  const isPageFullySelected = useCallback((pageIds: string[]) => {
    if (pageIds.length === 0) return false;
    return pageIds.every(id => isRowSelected(id));
  }, [isRowSelected]);

  const isPagePartiallySelected = useCallback((pageIds: string[]) => {
    if (pageIds.length === 0) return false;
    const selectedCount = pageIds.filter(id => isRowSelected(id)).length;
    return selectedCount > 0 && selectedCount < pageIds.length;
  }, [isRowSelected]);

  const selectionCount = isAllSelected 
    ? Math.max(0, totalItems - deselectedIds.length)
    : selectedIds.length;

  return {
    selectedIds,
    isAllSelected,
    deselectedIds,
    
    toggleRow,
    toggleAllOnPage,
    selectAllAcrossPages,
    clearSelection,
    
    isRowSelected,
    isPageFullySelected,
    isPagePartiallySelected,
    
    hasSelection: selectionCount > 0,
    selectionCount
  };
}
