import { useState, useCallback } from 'react';
// import { useWebSocket } from './hooks/useWebSocket';
import './App.css';
import { useWebSocket } from './hooks/hooks_useWebsocket';

type Message = {
  id: string;
  content: string;
  type: string;
  timestamp: number;
};

export type WebSocketMessage = {
  room_id?: number;
  content: string;
  reply_to?: string | null;
  sender_id?: number;
  message_id?: string;
  message_type: string;
  is_online?: boolean;
};

export type WebSocketMessageResult = Omit<WebSocketMessage, 'message_type'> & {
  type: string;
  messages?: Array<{
    message_id?: string;
    content: string;
    type: string;
  }>;
};

// const SOCKET_URL = 'ws://146.190.86.208:8088/ws/1'; http://146.190.86.208:8088/api/auth/login
const SOCKET_URL = 'ws://146.190.86.208:8088/ws/1';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const handleMessage = useCallback((data: WebSocketMessageResult) => {
    switch (data.type) {
      case 'roomMessages': {
        const newMessages = data.messages?.map((message) => ({
          id: message.message_id!,
          content: message.content,
          type: message.type,
          timestamp: Date.now(),
        }));
        setMessages(newMessages || []);
        break;
      }
      default:
        break;
    }
  }, []);

  const { isConnected, error, sendMessage } = useWebSocket({
    url: SOCKET_URL,
    onMessage: handleMessage,
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: () => {},
    onOpen: () => {},
  });

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;

    const messageData: WebSocketMessage = {
      message_type: 'chatMessage',
      room_id: 1,
      content: message,
      reply_to: null,
      sender_id: 1,
      message_id: crypto.randomUUID(),
    };

    sendMessage(messageData);
    setMessage('');
  }, [message, sendMessage]);

  return (
    <div className='chat-container'>
      <div className='connection-status'>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
        {error && <span className='error'> (Error occurred)</span>}
      </div>

      <div className='messages-container'>
        <ul className='messages-list'>
          {messages.map((msg) => (
            <li key={msg.id} className={`message-item ${msg.type}`}>
              <p>{msg.content}</p>
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </li>
          ))}
        </ul>
      </div>

      <div className='input-container'>
        <input
          type='text'
          className='chat-input'
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder='Type a message...'
          disabled={!isConnected}
        />
        <button onClick={handleSendMessage} disabled={!isConnected || !message.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;

