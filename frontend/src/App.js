import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  const getData = async () => {
    const res = await fetch("http://localhost:5000/api/test");
    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Frontend</h2>

      <button onClick={getData}>
        Call Backend
      </button>

      <p>{message}</p>
    </div>
  );
}

export default App;