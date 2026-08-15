import { useState, useRef, useEffect } from "react";
import { Upload, X, Sparkles, Lock, Zap } from "lucide-react";

const FREE_LIMIT = 3;
const STORAGE_KEY = "poster_credits_used";

export default function AIPosterMaker() {
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored != null) setCreditsUsed(parseInt(stored, 10) || 0);
    } catch {
      // storage unavailable, stays 0
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - creditsUsed);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const room = 7 - images.length;
    const toAdd = files.slice(0, room);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setImages((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const generate = async () => {
    setError("");
    if (images.length === 0) {
      setError("Add at least one photo first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Describe the design you want.");
      return;
    }
    if (remaining <= 0) {
      setShowPaywall(true);
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, prompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setGenerating(false);
        return;
      }

      setResult(data.image);

      const newCount = creditsUsed + 1;
      setCreditsUsed(newCount);
      try {
        localStorage.setItem(STORAGE_KEY, String(newCount));
      } catch {
        // storage failed silently; credit still counted for this session
      }
    } catch (err) {
      setError("Couldn't reach the server. Check your connection and try again.");
    }

    setGenerating(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#08090A", color: "#F5F5F0", fontFamily: "system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ padding: "20px 16px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#F2B705", fontWeight: 800, marginBottom: 4 }}>
          {loadingCredits ? "···" : `${remaining} FREE GENERATION${remaining === 1 ? "" : "S"} LEFT`}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>AI POSTER GENERATOR</h1>
        <p style={{ fontSize: 13, color: "#F5F5F088", margin: "6px 0 0" }}>Upload photos, describe your poster, let AI design it</p>
      </div>

      {(result || generating) && (
        <div style={{ margin: "16px", borderRadius: 20, overflow: "hidden", background: "#FFFFFF08", minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {generating ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <Sparkles size={28} color="#F2B705" style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, fontSize: 14 }}>Designing your poster…</div>
              <div style={{ fontSize: 12, color: "#F5F5F066", marginTop: 4 }}>This usually takes a few seconds</div>
            </div>
          ) : (
            <img src={result} alt="Generated poster" style={{ width: "100%", display: "block" }} />
          )}
        </div>
      )}

      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "#F5F5F088", marginBottom: 8 }}>
          YOUR PHOTOS ({images.length}/7)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => removeImage(i)}
                style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "#000000AA", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {images.length < 7 && (
            <label
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                border: "2px dashed #FFFFFF33",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: "#FFFFFF08",
              }}
            >
              <Upload size={18} color="#F5F5F088" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", clip: "rect(0 0 0 0)" }}
              />
            </label>
          )}
        </div>
      </div>

      <div style={{ padding: "0 16px", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "#F5F5F088", marginBottom: 8 }}>DESCRIBE YOUR POSTER</div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Match day poster, dark stadium background, gold accents, bold player name at bottom, dramatic lighting on the player"
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: "2px solid #FFFFFF1A",
            background: "#FFFFFF0A",
            color: "#F5F5F0",
            fontSize: 14,
            outline: "none",
            resize: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>

      {error && (
        <div style={{ margin: "0 16px 8px", color: "#FF6B6B", fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}

      <div style={{ padding: "16px" }}>
        <button
          onClick={generate}
          disabled={generating || loadingCredits}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: generating ? "#F2B70588" : "#F2B705",
            color: "#08090A",
            fontWeight: 900,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Sparkles size={18} />
          {generating ? "GENERATING…" : "GENERATE POSTER"}
        </button>
      </div>

      {showPaywall && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000CC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 50,
          }}
          onClick={() => setShowPaywall(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#14161A", borderRadius: 20, padding: 24, maxWidth: 340, width: "100%", textAlign: "center" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F2B70522", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Lock size={22} color="#F2B705" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 6px" }}>You've used your free posters</h2>
            <p style={{ fontSize: 13, color: "#F5F5F088", margin: "0 0 20px" }}>
              Get more generations to keep designing.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button style={payBtn("#F2B705", "#08090A")}>
                <Zap size={16} /> 20 posters — $4.99
              </button>
              <button style={payBtn("#FFFFFF12", "#F5F5F0")}>
                Unlimited monthly — $9.99/mo
              </button>
            </div>
            <button onClick={() => setShowPaywall(false)} style={{ marginTop: 14, background: "none", border: "none", color: "#F5F5F066", fontSize: 13 }}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function payBtn(bg, color) {
  return {
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: bg,
    color,
    fontWeight: 800,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  };
          }
