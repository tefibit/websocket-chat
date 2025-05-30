import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const [socketURL, setSocketURL] = useState(`wss:dev-api.tefibit.com/ws`);
  const [message, setMessage] = useState('');


  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(socketURL);
    // if(socket){
    //   socket.send(JSON.stringify({ type: "ping" }));
    // }
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };
    ws.onmessage = (event) => {
      let jsonData = null;
      try {
        jsonData = JSON.parse(event.data);
        // console.log('jsonData', jsonData)
      } catch (error) {
        console.info("Cannot parse socket message", error);
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
      socket.send(message);
      console.log("Sent:", message);
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
            <li className='message-item'><p>message 1</p></li>
            <li className='message-item'><p>message 1</p></li>
            <li className='message-item'><p>message 1</p></li>
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
