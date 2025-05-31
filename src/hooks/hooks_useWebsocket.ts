import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage, WebSocketMessageResult } from '../App';

interface UseWebSocketProps {
  url: string;
  onMessage?: (message: WebSocketMessageResult) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = ({
  url,
  onMessage,
  onError,
  onClose,
  onOpen,
  reconnectAttempts = 3,
  reconnectInterval = 3000,
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message received:', event.data);
          const parsedData = JSON.parse(event.data);
          console.log('Parsed data before transformation:', parsedData);

          const data: WebSocketMessageResult = {
            ...parsedData,
            type: parsedData.message_type || parsedData.type,
          };

          console.log('Final message data:', data);

          if (onMessage) {
            console.log('Calling onMessage handler with:', data);
            onMessage(data);
          } else {
            console.warn('No onMessage handler provided');
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', event.data, error);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket Error:', event);
        setError(event);
        onError?.(event);
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        onClose?.();

        // Attempt to reconnect if we haven't exceeded the maximum attempts
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err as Event);
    }
  }, [url, onMessage, onError, onClose, onOpen, reconnectAttempts, reconnectInterval]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const wsMessage: WebSocketMessageResult = {
        ...message,
        type: message.message_type,
      };
      wsRef.current.send(JSON.stringify(wsMessage));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
  };
};

