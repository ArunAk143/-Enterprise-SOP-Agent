import { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Upload failed");
    }
  };

  return (
    <div className="container">
      <h2>Upload PDF</h2>

      <input
        type="file"
        className="file-input"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button className="upload-btn" onClick={handleUpload}>
        Upload File
      </button>

      <p className="message">{message}</p>
    </div>
  );
}

export default App;