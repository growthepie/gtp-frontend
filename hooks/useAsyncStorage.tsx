import { useState, useEffect, useCallback } from 'react';

function useAsyncStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  // State to hold the current value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  // Loading state to handle async operations
  const [loading, setLoading] = useState(true);

  // Load the initial value from localStorage asynchronously
  useEffect(() => {
    const loadInitialValue = async () => {
      try {
        const item = localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
      } finally {
        setLoading(false);
      }
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        loadInitialValue();
      });
    } else {
      setTimeout(loadInitialValue, 0);
    }

    // Listen for storage changes from other components/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing storage event value for key "${key}":`, error);
        }
      }
    };

    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  // Define the setValue function
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Handle function updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        // Store in localStorage asynchronously and dispatch a custom event
        const updateStorage = () => {
          localStorage.setItem(key, JSON.stringify(valueToStore));
          // Dispatch a custom event to notify other components in the same window
          window.dispatchEvent(new StorageEvent('storage', {
            key: key,
            newValue: JSON.stringify(valueToStore),
            oldValue: localStorage.getItem(key),
            storageArea: localStorage
          }));
        };

        if (window.requestIdleCallback) {
          window.requestIdleCallback(updateStorage);
        } else {
          setTimeout(updateStorage, 0);
        }
      } catch (error) {
        console.warn(`Error saving to localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, loading];
}

export default useAsyncStorage;