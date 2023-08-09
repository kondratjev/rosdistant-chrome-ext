import { useEffect, useState } from 'react';
import './Popup.css';

function App() {
  const [info, setInfo] = useState([]);

  useEffect(() => {
    chrome.storage.local.get('info').then((data) => {
      setInfo(data.info);
    });
  }, []);

  return (
    <main>
      {info.map((item) => {
        return <p>{item}</p>;
      })}
    </main>
  );
}

export default App;
