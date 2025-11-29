import {
  routeAgentRequest,
  type AgentNamespace,
} from "agents";
import { BacklogAgent, type BacklogEnv } from "./backlogAgent";

interface Env extends BacklogEnv {
  BacklogAgent: AgentNamespace<BacklogAgent>;
}

const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Backlog Buddy · Cloudflare AI Agent</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      color-scheme: light dark;
      --bg: radial-gradient(circle at top, #e0f2fe, #f8fafc 40%, #e5e7eb 100%);
      --card-bg: #ffffff;
      --border: #e5e7eb;
      --accent: #0ea5e9;
      --accent-soft: #e0f2fe;
      --text-main: #0f172a;
      --text-muted: #6b7280;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
        sans-serif;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      color: var(--text-main);
    }

    .shell {
      width: 100%;
      max-width: 960px;
    }

    .card {
      background: var(--card-bg);
      border-radius: 1.25rem;
      border: 1px solid var(--border);
      box-shadow:
        0 22px 45px rgba(15, 23, 42, 0.07),
        0 1px 0 rgba(15, 23, 42, 0.03);
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr);
      gap: 0;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .card {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    .side {
      padding: 1.75rem 1.75rem 1.5rem;
      border-right: 1px solid var(--border);
      background: linear-gradient(145deg, #f0f9ff, #eff6ff);
    }

    @media (max-width: 768px) {
      .side {
        border-right: none;
        border-bottom: 1px solid var(--border);
      }
    }

    .side-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: rgba(14, 165, 233, 0.08);
      color: #0369a1;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #22c55e;
      box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.25);
    }

    h1 {
      font-size: 1.6rem;
      margin: 0.9rem 0 0.4rem;
      letter-spacing: -0.03em;
    }

    .subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1.2rem;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1.3rem;
    }

    .pill {
      font-size: 0.72rem;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      background: #0f172a;
      color: #e5e7eb;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .pill span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: rgba(248, 250, 252, 0.08);
      font-size: 0.6rem;
    }

    .hint-list {
      margin: 0;
      padding-left: 1.2rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .hint-list li + li {
      margin-top: 0.25rem;
    }

    .session-row {
      margin-top: 1.3rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .session-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.55rem;
      margin-top: 0.4rem;
      border-radius: 999px;
      border: 1px dashed rgba(148, 163, 184, 0.9);
      background: #f8fafc;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
    }

    .main {
      padding: 1.5rem 1.75rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .chat-window {
      flex: 1 1 auto;
      border-radius: 0.9rem;
      border: 1px solid var(--border);
      background: #f8fafc;
      padding: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .chat-scroll {
      flex: 1 1 auto;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .bubble {
      max-width: 100%;
      border-radius: 0.75rem;
      padding: 0.55rem 0.7rem;
      margin: 0.25rem 0;
      font-size: 0.85rem;
      white-space: pre-wrap;
      line-height: 1.4;
      position: relative;
    }

    .bubble-label {
      font-size: 0.7rem;
      font-weight: 600;
      margin-bottom: 0.15rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .bubble.user {
      background: #dbeafe;
      align-self: flex-end;
    }

    .bubble.bot {
      background: #e5e7eb;
      align-self: flex-start;
    }

    .timestamp {
      font-size: 0.68rem;
      color: #9ca3af;
      margin-top: 0.1rem;
      text-align: right;
    }

    .typing {
      font-size: 0.75rem;
      color: #6b7280;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.35rem;
    }

    .dots span {
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: #9ca3af;
      display: inline-block;
      animation: bounce 1s infinite;
    }

    .dots span:nth-child(2) { animation-delay: 0.15s; }
    .dots span:nth-child(3) { animation-delay: 0.3s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
      40% { transform: translateY(-3px); opacity: 1; }
    }

    form {
      margin-top: 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    label {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-muted);
      display: block;
    }

	input,
		textarea {
		width: 100%;
		border-radius: 0.7rem;
		border: 1px solid #cbd5f5;
		padding: 0.45rem 0.6rem;
		font-size: 0.85rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.14s ease, box-shadow 0.14s ease,
				background-color 0.14s ease;
		background: #ffffff;
		color: #0f172a;           /* 👈 force dark text */
		caret-color: #0f172a;     /* nice visible cursor */
		}

		/* Optional but recommended: placeholder color */
		input::placeholder,
		textarea::placeholder {
		color: #9ca3af;
		opacity: 1;
		}

    input:focus,
    textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.3);
    }

    textarea {
      resize: vertical;
      min-height: 90px;
    }

    .row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .row > div {
      flex: 1 1 auto;
    }

    button {
      border-radius: 999px;
      border: none;
      padding: 0.55rem 1.1rem;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #f9fafb;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.35);
      transition: transform 0.08s ease, box-shadow 0.08s ease,
        filter 0.08s ease;
    }

    button:hover {
      filter: brightness(1.03);
      transform: translateY(-1px);
      box-shadow: 0 14px 26px rgba(37, 99, 235, 0.4);
    }

    button:active {
      transform: translateY(0);
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
    }

    .kbd {
      font-size: 0.7rem;
      border-radius: 0.4rem;
      border: 1px solid #cbd5f5;
      padding: 0.12rem 0.35rem;
      background: #eef2ff;
      color: #4b5563;
      margin-left: 0.25rem;
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="card">
      <aside class="side">
        <div class="side-tag">
          <span class="dot"></span>
          Cloudflare Agent · Live
        </div>
        <h1>Backlog Buddy</h1>
        <p class="subtitle">
          Your friendly AI project buddy that reads your backlog and turns it into
          concrete next steps – branches, commits, and all.
        </p>

        <div class="pill-row">
          <span class="pill"><span>⚙</span> Workers + Durable Objects</span>
          <span class="pill"><span>🧠</span> Workers AI · Llama 3.3</span>
          <span class="pill"><span>💾</span> Per-session memory</span>
        </div>

        <ul class="hint-list">
          <li>Ask it to implement and open a PR for the first issue.</li>
          <li>Tell it to clean up or cancel irrelevant issues.</li>
          <li>Paste an error message and let it suggest where it belongs.</li>
        </ul>

        <div class="session-row">
          Session name
          <div class="session-chip">
            session: "demo-session"
          </div>
          <div style="margin-top:0.2rem">
            Use different names to keep separate conversations.
          </div>
        </div>
      </aside>

      <section class="main">
        <div class="chat-window">
          <div id="chat-scroll" class="chat-scroll"></div>
          <div id="typing" style="display:none; padding:0.25rem 0.2rem;">
            <span class="typing">
              Backlog Buddy is thinking
              <span class="dots"><span></span><span></span><span></span></span>
            </span>
          </div>
        </div>

        <form id="form">
          <div class="row">
            <div>
              <label>
                Session name
                <input id="session" value="demo-session" placeholder="e.g. feature-branch-sync" />
              </label>
            </div>
          </div>

          <label>
            Your message
            <textarea
              id="message"
              placeholder="e.g. “Implement and open a pull request for the first issue I have assigned to me.”"
            ></textarea>
          </label>

          <div class="row" style="justify-content: space-between;">
            <div style="font-size:0.75rem; color:#6b7280;">
              Hit <span class="kbd">Ctrl</span>+<span class="kbd">Enter</span> to send
            </div>
            <button type="submit">
              <span>Send to Buddy</span>
              <span>↗</span>
            </button>
          </div>
        </form>
      </section>
    </section>
  </main>

  <script>
    const chatScroll = document.getElementById("chat-scroll");
    const typingEl = document.getElementById("typing");
    const form = document.getElementById("form");
    const messageInput = document.getElementById("message");
    const sessionInput = document.getElementById("session");

    function addBubble(text, who) {
      const wrap = document.createElement("div");
      wrap.className = "bubble " + (who === "user" ? "user" : "bot");

      const label = document.createElement("div");
      label.className = "bubble-label";
      label.textContent = who === "user" ? "You" : "Backlog Buddy";

      const content = document.createElement("div");
      content.textContent = text;

      const ts = document.createElement("div");
      ts.className = "timestamp";
      ts.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      wrap.appendChild(label);
      wrap.appendChild(content);
      wrap.appendChild(ts);
      chatScroll.appendChild(wrap);

      chatScroll.scrollTop = chatScroll.scrollHeight;
    }

    async function sendMessage(ev) {
      ev?.preventDefault();

      const message = messageInput.value.trim();
      const session = sessionInput.value.trim() || "default";
      if (!message) return;

      addBubble(message, "user");
      messageInput.value = "";
      typingEl.style.display = "block";

      try {
        const res = await fetch("/agents/backlog-agent/" + encodeURIComponent(session) + "/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        });

        if (!res.ok) {
          const errText = await res.text();
          addBubble("Error: " + res.status + " " + errText, "bot");
        } else {
          const data = await res.json();
          addBubble(data.reply ?? "(no reply)", "bot");
        }
      } catch (err) {
        addBubble("Network error: " + (err && err.message ? err.message : err), "bot");
      } finally {
        typingEl.style.display = "none";
      }
    }

    form.addEventListener("submit", sendMessage);

    messageInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
        sendMessage(ev);
      }
    });
  </script>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(INDEX_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const routed = await routeAgentRequest(request, env, { cors: true });
    if (routed) return routed;

    return new Response("Not found", { status: 404 });
  },
};

export { BacklogAgent } from "./backlogAgent";