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
// const SOCKET_URL = 'ws://146.190.86.208:8088/ws/1';
const ROOM_ID = 3;
const USER_ID = 2;
const SOCKET_URL = `ws://localhost:8000/ws/${USER_ID}`;
const URL = 'http://localhost:8000/api';
const TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NDkyODIxNjgsImlhdCI6MTc0ODY3NzM2OCwiZW1haWwiOiJ0ZXN0LXhhdGhjcmFsckBzcnYxLm1haWwtdGVzdGVyLmNvbSIsImlkIjoyfQ.DGdyaVUffHR5W6uk1465Um8E6dhlgRT1DkXrU9XINaQ';

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
      room_id: ROOM_ID,
      content: message,
      reply_to: null,
      sender_id: 1,
      message_id: crypto.randomUUID(),
    };

    sendMessage(messageData);
    setMessage('');
  }, [message, sendMessage]);

  const handleJoinRoom = async () => {
    try {
      const response = await fetch(`${URL}/rooms/join/${ROOM_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN.trim()}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('Failed to join room:', errorData);
        alert(`Failed to join room: ${errorData.message || response.statusText}`);
        return;
      }

      const data = await response.json().catch(() => null);
      console.log('Successfully joined room:', data);
      alert('Successfully joined room!');
    } catch (error) {
      console.error('Error joining room:', error);
      alert(`Error joining room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className='chat-container'>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '10px',
        }}
      >
        <div className='connection-status'>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
          {error && <span className='error'> (Error occurred)</span>}
        </div>
        <button onClick={handleJoinRoom} style={{ height: '100%' }}>
          Join Room {ROOM_ID}
        </button>
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
