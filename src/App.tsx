import { useState, useCallback, useEffect } from 'react';
// import { useWebSocket } from './hooks/useWebSocket';
import './App.css';
import { useWebSocket } from './hooks/hooks_useWebsocket';
import axios from 'axios';
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
const ROOM_ID = 1;
const USER_ID = 1;
const SOCKET_URL = `ws://146.190.86.208:8088/ws/${USER_ID}`;
const URL = 'http://146.190.86.208:8088/api';
const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NDkyODU0MDMsImlhdCI6MTc0ODY4MDYwMywiZW1haWwiOiJsZXRvYW4yODVAZ21haWwuY29tIiwiaWQiOjF9.ra71uAhxbrQJQ863D-tiNZirFWaqdKxeHqO_FtLivJ0';

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');




  const [user, setUser] = useState<any>(null);

  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN.trim()}`,
    };
    axios.get(`${URL}/messages/room/5`, { headers }).then((res) => {
      console.log('MESSSGe', res.data.data);
      setMessages(res.data.data);
      setRooms([1, 2, 3])
    })
  }, [])

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
      case 'chatMessage': {
        const newMsg = {
          id: data.message_id || crypto.randomUUID(),
          content: data.content,
          type: 'chatMessage',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMsg]);
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
    onClose: () => { },
    onOpen: () => { },
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

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN.trim()}`,
    };
    try {
      const response = await fetch(`${URL}/rooms/join/${ROOM_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN.trim()}`,
        },
      });
      axios.post(`${URL}/rooms/join/${ROOM_ID}`, {}, { headers: headers })

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

  const handleLogin = async () => {
    axios.post('https://tefihub-api.tefibit.com/api/auth/login', { email, password }).then((res) => {
      setUser(res.data.data);
    }).catch((err) => { console.log(err) });

  }

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

        {
          user ? (
            <button onClick={handleJoinRoom} style={{ height: '100%' }}>
              User: {user.user_id} - Join Room {ROOM_ID}
            </button>
          ) : (
            <div>
              <div>
                <input type="text" placeholder='Email...' onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <input type="text" placeholder='Password...' onChange={(e) => setPassword(e.target.value)} />
              </div>

              <button onClick={handleLogin} style={{ height: '100%' }}>
                Login
              </button>

            </div>

          )
        }

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
