import { useState, useEffect, useRef } from 'react';

// Using a more specific type for the ready state based on the EventSource API
type ReadyState = 0 | 1 | 2; // 0: CONNECTING, 1: OPEN, 2: CLOSED

interface UseSSEOptions {
  onMessage: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
}

/**
 * A generic hook for managing a Server-Sent Events (SSE) connection.
 * It automatically pauses the connection when the tab is hidden and resumes when it's focused.
 * @param url The URL of the SSE endpoint.
 * @param options Callbacks for message, error, and open events.
 */
export function useSSE(url: string | null, { onMessage, onError, onOpen }: UseSSEOptions) {
  const [readyState, setReadyState] = useState<ReadyState>(0); // Starts as CONNECTING
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // NEW: State to track if the page is visible. Initialize based on the current state.
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

  // NEW: Effect to listen for page visibility changes.
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array means this runs once on mount.

  useEffect(() => {
    // We now check for the URL, onMessage, AND if the page is visible.
    if (!url || !onMessage || !isPageVisible) {
      // If we have a connection but shouldn't, close it.
      if (eventSourceRef.current) {
        console.log(`Closing SSE connection to ${url} due to page visibility or config change.`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setReadyState(2); // Manually set to CLOSED
      }
      return;
    }

    // If we get here, it means we should have an active connection.
    console.log(`Opening SSE connection to ${url}`);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    setReadyState(eventSource.readyState as ReadyState);

    eventSource.onopen = (event) => {
      console.log(`SSE connection opened to ${url}`);
      setReadyState(eventSource.readyState as ReadyState);
      onOpen?.(event);
    };

    eventSource.onmessage = (event) => {
      onMessage(event);
    };

    eventSource.onerror = (error) => {
      console.error(`SSE error on connection to ${url}:`, error);
      setReadyState(eventSource.readyState as ReadyState);
      onError?.(error);
    };

    return () => {
      // This cleanup runs when dependencies change or the component unmounts.
      if (eventSourceRef.current) {
        console.log(`Closing SSE connection to ${url}`);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setReadyState(2); // Manually set to CLOSED
      }
    };
    // Re-run this effect if the URL, callbacks, or page visibility changes.
  }, [url, onMessage, onError, onOpen, isPageVisible]); 

  return { readyState };
}