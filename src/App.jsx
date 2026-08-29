import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [idea, setIdea] = useState("");
  const [meme, setMeme] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [game, setGame] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!game) return undefined;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(game.endsAt) - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [game]);

  const request = async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong");
    return data;
  };

  const generateMeme = async () => {
    if (!idea.trim()) { setError("Enter a meme idea first."); return; }
    setError(""); setIsLoading(true);
    try {
      const [image, caption] = await Promise.all([request("/api/generate", { prompt: idea }), request("/api/caption", { prompt: idea })]);
      setImageUrl(image.imageUrl || `data:image/png;base64,${image.imageBase64}`);
      setMeme(caption.caption);
    } catch (requestError) { setError(requestError.message); }
    finally { setIsLoading(false); }
  };

  const startBattle = async () => {
    setError(""); setIsLoading(true);
    try {
      const team = await request("/api/team/create", { name: `Battle ${Date.now()}`, userName: "Player" });
      const result = await request("/api/game/start", { teamId: team.team.id });
      setGame(result.game);
    } catch (requestError) { setError(requestError.message); }
    finally { setIsLoading(false); }
  };

  return <div className="container">
    <h1>🎭 AI Meme War</h1>
    <p>Create funny AI memes and challenge your friends!</p>
    <input type="text" value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Enter your meme idea..." className="input" maxLength="700" />
    <br /><br />
    <button onClick={generateMeme} disabled={isLoading}>{isLoading ? "Working..." : "Generate Meme"}</button>
    <button onClick={startBattle} disabled={isLoading}>Start Battle</button>
    {game && <p role="status">Battle ends in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="result">
      {imageUrl && <img className="meme-image" src={imageUrl} alt={meme || "Generated meme"} />}
      <h3>{meme || "Your Meme will appear here 🖼️"}</h3>
    </div>
  </div>;
}

export default App;
