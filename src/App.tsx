import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  // const [socketURL, setSocketURL] = useState(`ws:146.190.86.208:8088/ws/`);
  const [socketURL, setSocketURL] = useState(`ws://146.190.86.208:8088/ws/1`);
  const [message, setMessage] = useState('');


  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [messages, setMessages] = useState<string[]>([]);





  useEffect(() => {
    const ws = new WebSocket(socketURL);
    // if(socket){
    //   socket.send(JSON.stringify({ type: "ping" }));
    // }
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };
    ws.onmessage = (event) => {
      console.log("Received message from server:", event.data);
      try {
        const jsonData = JSON.parse(event.data);
        console.log('jsonData', jsonData);
        setMessages(prev => [...prev, jsonData.content || event.data]);
      } catch (error) {
        console.warn("Không phải JSON:", event.data);
        setMessages(prev => [...prev, event.data]); // vẫn hiển thị thông báo lỗi từ server
      }
    };



    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      // setLoading(false);
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
    };

  }, []);


  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "chatMessage",
        room_id: 1,
        content: message || "Hello from client", // Sửa tại đây
        reply_to: null,
        sender_id: 1,
        message_id: "550e8400-e29b-41d4-a716-446655440000"
      }));
      setMessage('');
    } else {
      console.warn("WebSocket is not connected");
    }
  };
  return (
    <>
      <div>
        <div>
          <ul>
            {messages.map((msg, index) => (
              <li key={index} className='message-item'><p>{msg}</p></li>
            ))}
          </ul>

        </div>
        <div>

          <input type="text" className='chat-input' value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={sendMessage}>Send message</button>

        </div>

      </div>
    </>
  )
}

export default App
