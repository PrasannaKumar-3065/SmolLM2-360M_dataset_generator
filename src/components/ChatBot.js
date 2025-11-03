// ChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const ChatBot = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Replace with your Space URL
  const SPACE_API_URL =
    "https://huggingface.co/spaces/sanaX3065/SmolLM2-360M-Instruct_QA_demo_dataset/api/predict/";

  // If you must use a private space, create a backend proxy that injects the HF token.
  // Never embed the hf_xxx token directly in frontend code.
  const getAuthHeader = () => {
    // Example: if you use a proxy, no auth needed here.
    // return { Authorization: `Bearer ${process.env.REACT_APP_HF_TOKEN}` }; // DON'T use in production
    return {};
  };

  async function queryHuggingFace(query, context) {
    const res = await fetch(
      "https://sanax3065-smollm2-360m-instruct-qa-demo-dataset.hf.space/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, context }), // ✅ Correct keys
      }
    );

    if (!res.ok) {
      throw new Error(`API returned error: ${await res.text()}`);
    }

    const json = await res.json();
    return json.result;
  }

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  const appendUserMessage = (text) => {
    const container = document.createElement("div");
    container.className = "row py-3";

    const col = document.createElement("div");
    col.className = "col-12 col-md-8 mx-auto d-flex justify-content-end";

    const bubble = document.createElement("div");
    bubble.className = "p-3 bg-primary text-white rounded";
    bubble.style.maxWidth = "80%";
    bubble.style.whiteSpace = "pre-wrap";
    bubble.textContent = text;

    col.appendChild(bubble);
    container.appendChild(col);
    messagesRef.current.appendChild(container);
    scrollToBottom();
  };

  const appendBotTyping = () => {
    const container = document.createElement("div");
    container.className = "row py-3";
    container.dataset.bot = "true"; // marker to find it later

    const col = document.createElement("div");
    col.className = "col-12 col-md-8 mx-auto d-flex justify-content-start";

    const bubble = document.createElement("div");
    bubble.className = "p-3 bg-white text-dark rounded border";
    bubble.style.maxWidth = "80%";
    bubble.style.whiteSpace = "pre-wrap";
    bubble.style.minHeight = "36px";
    bubble.style.display = "flex";
    bubble.style.alignItems = "center";
    bubble.style.gap = "6px";

    // typing dots (simple animated dots using inline styles)
    const dotWrapper = document.createElement("div");
    dotWrapper.style.display = "inline-flex";
    dotWrapper.style.alignItems = "center";
    dotWrapper.style.gap = "4px";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "50%";
      dot.style.background = "#0d6efd";
      dot.style.opacity = "0.2";
      dot.style.display = "inline-block";
      dotWrapper.appendChild(dot);
    }

    // animate dots with JS interval (keeps the code self-contained)
    let step = 0;
    // was 350ms; reduce by ~25% to speed up the dots animation
    typingIntervalRef.current = setInterval(() => {
      const dots = dotWrapper.children;
      for (let i = 0; i < dots.length; i++) {
        dots[i].style.opacity = i === (step % 3) ? "1" : "0.2";
      }
      step++;
    }, 260);

    bubble.appendChild(dotWrapper);
    col.appendChild(bubble);
    container.appendChild(col);
    messagesRef.current.appendChild(container);
    scrollToBottom();
    return container; // return container so caller can replace it later
  };

  const replaceTypingWithText = (typingContainer, text) => {
    // stop typing animation
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    // find the bubble inside typingContainer and replace its content with typed text
    const bubble = typingContainer.querySelector("div.p-3");
    bubble.innerHTML = ""; // clear dots

    // create a span to receive typed characters
    const textSpan = document.createElement("div");
    textSpan.style.whiteSpace = "pre-wrap";
    textSpan.style.wordBreak = "break-word";
    bubble.appendChild(textSpan);

    // type animation
    let i = 0;
    // was 20 ms/char; reduce by ~25% to type faster
    const speed = 15; // ms per char
    const typer = setInterval(() => {
      if (i <= text.length - 1) {
        textSpan.textContent += text.charAt(i);
        i++;
        scrollToBottom();
      } else {
        clearInterval(typer);
      }
    }, speed);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // append user message directly into DOM
    appendUserMessage(trimmed);
    setInput("");
    setLoading(true);

    // append bot typing indicator
    const typingNode = appendBotTyping();

    try {
      const res = await queryHuggingFace("", trimmed);
      const botText = Array.isArray(res) ? res.join(" ") : String(res ?? "");
      // replace typing animation with typed bot text
      replaceTypingWithText(typingNode, botText);
    } catch (err) {
      console.error("API error:", err);
      replaceTypingWithText(typingNode, "⚠️ Sorry, something went wrong calling the model.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row h-100 g-0">
        {/* Sidebar - optional */}
        <div className="col-auto d-none d-md-block bg-dark text-white" style={{ width: "260px" }}>
          <div className="p-3">
            <button className="btn btn-outline-light w-100 mb-3">New Chat</button>
            <div className="border-top border-secondary pt-3">
              <small className="text-secondary">Previous chats could go here</small>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="col d-flex flex-column bg-light">
          {/* Messages Container - we will append messages directly to this element */}
          <div
            ref={messagesRef}
            className="flex-grow-1 overflow-auto px-4"
            style={{ paddingBottom: "100px" }}
          />

          {/* Input Area */}
          <div className="border-top bg-white mt-auto">
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-12 col-md-8 py-4">
                  <form onSubmit={handleSend} className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                    <button className="btn btn-primary px-4" type="submit" disabled={loading}>
                      {loading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        "Send"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
};

export default ChatBot;
