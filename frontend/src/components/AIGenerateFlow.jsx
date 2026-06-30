import { useState, useRef, useEffect } from "react";
import { aiCvChat } from "../lib/api.js";

const QUESTION_CONFIGS = [
  { topic: "personal contact information", label: "Personal Info" },
  { topic: "work experience",              label: "Work Experience" },
  { topic: "projects",                     label: "Projects" },
  { topic: "technical skills",             label: "Technical Skills" },
  { topic: "education background",         label: "Education" },
  { topic: "certifications and courses",   label: "Certifications" },
];

const inputCls = "w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-sm focus:outline-none focus:border-[#7C78C8] focus:ring-2 focus:ring-[#7C78C8]/20 transition-colors placeholder-[#9CA3AF]";

export default function AIGenerateFlow({ onComplete, onCancel }) {
  const [phase, setPhase]       = useState("role");
  const [role, setRole]         = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [topicIdx, setTopicIdx] = useState(0);
  const [structured, setStructured] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startChat = async () => {
    if (!role.trim()) return;
    setPhase("chat");
    setLoading(true);
    const initMsg = { role: "user", content: `I want to create a CV for: ${role}` };
    try {
      const { reply } = await aiCvChat({ action: "respond", role, messages: [initMsg] });
      setMessages([initMsg, { role: "assistant", content: reply }]);
    } catch {
      setMessages([initMsg, { role: "assistant", content: "Hi! Let's build your CV. Can you start by telling me your full name, email, phone, and location?" }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    const nextTopicIdx = topicIdx + 1;
    try {
      if (nextTopicIdx >= QUESTION_CONFIGS.length) {
        setPhase("confirm");
        await buildStructured(newMsgs);
      } else {
        const { reply } = await aiCvChat({ action: "respond", role, messages: newMsgs });
        setMessages([...newMsgs, { role: "assistant", content: reply }]);
        setTopicIdx(nextTopicIdx);
      }
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Got it! Please continue sharing your details." }]);
    } finally {
      setLoading(false);
    }
  };

  const skip = async () => {
    const skipMsg = { role: "user", content: `Skip this topic — I don't have information about ${QUESTION_CONFIGS[topicIdx]?.topic}.` };
    const newMsgs = [...messages, skipMsg];
    setMessages(newMsgs);
    setLoading(true);
    const nextTopicIdx = topicIdx + 1;
    try {
      if (nextTopicIdx >= QUESTION_CONFIGS.length) {
        setPhase("confirm");
        await buildStructured(newMsgs);
      } else {
        const { reply } = await aiCvChat({ action: "respond", role, messages: newMsgs });
        setMessages([...newMsgs, { role: "assistant", content: reply }]);
        setTopicIdx(nextTopicIdx);
      }
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Understood. Let's move on." }]);
    } finally {
      setLoading(false);
    }
  };

  const buildStructured = async (log) => {
    setPhase("processing");
    try {
      const { structured: s } = await aiCvChat({ action: "structure", role, log });
      setStructured(s);
      setPhase("confirm");
    } catch {
      setPhase("chat");
    }
  };

  const confirm = () => { if (structured) onComplete(structured); };

  if (phase === "role") return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className="w-14 h-14 rounded-2xl bg-[#2D2A6E] flex items-center justify-center mx-auto mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2DD4A7" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-[#2D2A6E] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        AI CV Builder
      </h3>
      <p className="text-[#6B7280] text-sm mb-6">Tell me your target role and I'll guide you through building a professional CV in a conversational way.</p>
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && startChat()}
        placeholder="e.g. Full Stack Developer, Data Scientist"
        className={`${inputCls} mb-4`}
      />
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-full border border-[#E5E7EB] text-sm text-[#6B7280] hover:border-[#7C78C8] hover:text-[#2D2A6E] transition-all">
          Cancel
        </button>
        <button onClick={startChat} disabled={!role.trim()}
          className="flex-1 py-3 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-colors disabled:opacity-40">
          Start →
        </button>
      </div>
    </div>
  );

  if (phase === "processing") return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-[#2D2A6E] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#6B7280] text-sm">Structuring your CV data...</p>
    </div>
  );

  if (phase === "confirm" && structured) return (
    <div className="max-w-lg mx-auto py-6">
      <h3 className="text-xl font-bold text-[#2D2A6E] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Review Your CV Data
      </h3>
      <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] mb-6 max-h-96 overflow-y-auto">
        <pre className="text-xs text-[#6B7280] whitespace-pre-wrap">{JSON.stringify(structured, null, 2)}</pre>
      </div>
      <div className="flex gap-3">
        <button onClick={() => setPhase("chat")}
          className="flex-1 py-3 rounded-full border border-[#E5E7EB] text-sm text-[#6B7280] hover:border-[#7C78C8] hover:text-[#2D2A6E] transition-all">
          ← Back to Chat
        </button>
        <button onClick={confirm}
          className="flex-1 py-3 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-colors">
          Use This CV →
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[500px]">
      {/* Progress bar */}
      <div className="flex items-center gap-1 px-1 mb-3">
        {QUESTION_CONFIGS.map((q, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
            i <= topicIdx ? "bg-[#2D2A6E]" : "bg-[#E5E7EB]"
          }`} />
        ))}
      </div>
      <p className="text-xs text-[#9CA3AF] mb-3">
        Topic {topicIdx + 1}/{QUESTION_CONFIGS.length}: <strong className="text-[#2D2A6E]">{QUESTION_CONFIGS[topicIdx]?.label}</strong>
      </p>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-[#2D2A6E] text-white rounded-br-sm"
                : "bg-[#F5F4FF] text-[#374151] rounded-bl-sm border border-[#E8E6FB]"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F5F4FF] border border-[#E8E6FB] px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#7C78C8] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <button onClick={skip} disabled={loading}
          className="px-3 py-2.5 rounded-full text-xs border border-[#E5E7EB] text-[#9CA3AF] hover:text-[#6B7280] hover:border-[#7C78C8] transition-all disabled:opacity-40">
          Skip
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type your answer..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-full border border-[#E5E7EB] bg-white text-[#374151] text-sm focus:outline-none focus:border-[#7C78C8] disabled:opacity-50 transition-colors"
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold hover:bg-[#3D3A9E] transition-colors disabled:opacity-40">
          Send
        </button>
      </div>

      <button onClick={() => { setPhase("processing"); buildStructured(messages); }}
        className="mt-2 text-xs text-[#9CA3AF] hover:text-[#2D2A6E] text-center transition-colors">
        I&apos;m done — build my CV now →
      </button>
    </div>
  );
}
