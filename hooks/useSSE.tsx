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
 * @param url The URL of the SSE endpoint.
 * @param options Callbacks for message, error, and open events.
 */
export function useSSE(url: string | null, { onMessage, onError, onOpen }: UseSSEOptions) {
  const [readyState, setReadyState] = useState<ReadyState>(0); // Starts as CONNECTING
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Don't connect if the URL is null or not provided
    if (!url || !onMessage) {
      return;
    }

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    // FIX: Assert the type of eventSource.readyState to our specific ReadyState type
    setReadyState(eventSource.readyState as ReadyState);

    eventSource.onopen = (event) => {
      console.log(`SSE connection opened to ${url}`);
      // FIX: Assert the type here as well
      setReadyState(eventSource.readyState as ReadyState);
      onOpen?.(event);
    };

    eventSource.onmessage = (event) => {
      onMessage(event);
    };

    eventSource.onerror = (error) => {
      console.error(`SSE error on connection to ${url}:`, error);
      // FIX: And assert the type here
      setReadyState(eventSource.readyState as ReadyState);
      onError?.(error);
      // EventSource will automatically try to reconnect per the spec.
      // Calling close() here would prevent that. We only close in the cleanup function.
    };

    return () => {
      console.log(`Closing SSE connection to ${url}`);
      eventSource.close();
      // When closed manually, the readyState becomes 2
      setReadyState(2);
    };
  }, [url, onMessage, onError, onOpen]); // Re-establish connection if URL or callbacks change

  return { readyState };
}