import { useState } from "react";
import "./App.css";

function App() {
  const [meme, setMeme] = useState("");

  const generateMeme = () => {
    setMeme("😂 AI: I can do everything.\nMe: Then fix my Wi-Fi!");
  };

  return (
    <div className="container">
      <h1>🎭 AI Meme War</h1>
      <p>Create funny AI memes and challenge your friends!</p>

      <input
        type="text"
        placeholder="Enter your meme idea..."
        className="input"
      />

      <br /><br />

      <button onClick={generateMeme}>Generate Meme</button>
      <button>Start Battle</button>

      <div className="result">
        <h3>{meme || "Your Meme will appear here 🖼️"}</h3>
      </div>
    </div>
  );
}

export default App;