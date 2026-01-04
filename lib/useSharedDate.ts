import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

const STORAGE_KEY = 'lottery_system_selected_date';

/**
 * Custom hook to manage shared date state across all pages
 * Uses localStorage to persist and sync the selected date
 */
export function useSharedDate() {
  // Initialize from localStorage or default to today
  const getInitialDate = useCallback((): Date => {
    if (typeof window === 'undefined') {
      return new Date();
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        // Parse the stored date string (YYYY-MM-DD format)
        const [year, month, day] = stored.split('-').map(Number);
        return new Date(year, month - 1, day);
      } catch (error) {
        console.error('Error parsing stored date:', error);
        return new Date();
      }
    }
    return new Date();
  }, []);

  const [selectedDate, setSelectedDateState] = useState<Date>(getInitialDate);

  // Load date from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const [year, month, day] = stored.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        setSelectedDateState(date);
      } catch (error) {
        console.error('Error parsing stored date:', error);
      }
    }
  }, []);

  // Listen for storage events (when date changes in another tab/page)
  // and custom events (when date changes in the same tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      let newValue: string | null = null;
      
      if (e instanceof StorageEvent) {
        // Storage event from another tab
        if (e.key === STORAGE_KEY) {
          newValue = e.newValue;
        }
      } else if (e instanceof CustomEvent) {
        // Custom event from same tab
        newValue = e.detail?.newValue || null;
      }
      
      if (newValue) {
        try {
          const [year, month, day] = newValue.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          setSelectedDateState(date);
        } catch (error) {
          console.error('Error parsing date from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('sharedDateChange', handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('sharedDateChange', handleStorageChange as EventListener);
    };
  }, []);

  // Custom setter that updates both state and localStorage
  const setSelectedDate = useCallback((date: Date | ((prev: Date) => Date)) => {
    setSelectedDateState((prev) => {
      const newDate = typeof date === 'function' ? date(prev) : date;
      // Save to localStorage in YYYY-MM-DD format
      const dateStr = format(newDate, 'yyyy-MM-dd');
      const oldValue = format(prev, 'yyyy-MM-dd');
      localStorage.setItem(STORAGE_KEY, dateStr);
      
      // Dispatch a custom event for same-tab synchronization
      // (storage event only fires for other tabs)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sharedDateChange', {
          detail: {
            key: STORAGE_KEY,
            newValue: dateStr,
            oldValue: oldValue,
          },
        }));
      }
      
      return newDate;
    });
  }, []);

  return [selectedDate, setSelectedDate] as const;
}

