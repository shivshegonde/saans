import React, { useState } from "react";
import { X, Send, Sparkles, ShieldAlert, BookOpen } from "lucide-react";

interface AskSaansSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "user" | "saans";
  text: string;
  citations?: Array<{ label: string; url: string }>;
  isEmergency?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Is it safe for Dadaji to go for a morning walk today?",
  "Which air purifier CADR should I buy for a 200 sq ft room?",
  "Myth check: Do indoor snake plants clean PM2.5?",
  "What is the best time today to open windows for ventilation?",
];

export const AskSaansSheet: React.FC<AskSaansSheetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "saans",
      text: "Namaste! I am Saans, your urban air quality assistant. Ask me anything about Delhi winter smog, air purifier CADR sizing, mask selection, or outdoor activity precautions.",
      citations: [
        { label: "CPCB Winter Smog Guide", url: "https://cpcb.nic.in" },
        { label: "WHO 2021 Air Quality", url: "https://who.int" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Deterministic curated response generator (with emergency check)
    setTimeout(() => {
      setIsTyping(false);
      const lower = text.toLowerCase();

      // Check emergency safety keywords
      if (
        lower.includes("chest pain") ||
        lower.includes("difficulty breathing") ||
        lower.includes("can't breathe") ||
        lower.includes("emergency")
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `saans-${Date.now()}`,
            sender: "saans",
            text: "🚨 EMERGENCY ALERT: Severe respiratory distress or chest pain requires IMMEDIATE medical intervention. Dial 112 (National Emergency) or 102 (Ambulance) right now. Saans provides environmental guidance only and does NOT provide medical advice.",
            isEmergency: true,
          },
        ]);
        return;
      }

      if (lower.includes("dadaji") || lower.includes("walk")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `saans-${Date.now()}`,
            sender: "saans",
            text: "Under current NAQI (Severe, PM2.5 > 250 µg/m³), outdoor morning walks are NOT recommended for Dadaji. Winter thermal inversion traps toxic particulate matter near the ground until midday. If walking is essential, schedule it between 1:00 PM and 3:30 PM with a fitted N95 mask, or complete indoor hallway pacing.",
            citations: [
              { label: "CPCB Health Advisory (Senior Citizens)", url: "https://cpcb.nic.in" },
              { label: "Lancet Planetary Health 2023", url: "https://thelancet.com" },
            ],
          },
        ]);
      } else if (lower.includes("plant") || lower.includes("myth")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `saans-${Date.now()}`,
            sender: "saans",
            text: "Myth Check Result: BUSTED. NASA's 1989 clean air study tested VOC absorption in sealed micro-chambers, not particulate matter (PM2.5). In real-world homes with standard air exchange, potted houseplants reduce PM2.5 by less than 1%. A mechanical HEPA filter is strictly necessary for particulate capture.",
            citations: [
              { label: "Journal of Exposure Science (Waring et al.)", url: "https://nature.com" },
            ],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `saans-${Date.now()}`,
            sender: "saans",
            text: `Based on current micro-climate conditions in Delhi NCR: Keep windows sealed during morning and evening rush hours. Run indoor HEPA purifiers on medium speed (delivering ~250 m³/h CADR). When traveling outdoors, an N95 or FFP2 respirator reduces inhaled dose by over 90%.`,
            citations: [
              { label: "AICTE / IIT-Delhi Smog Manual", url: "https://iitd.ac.in" },
              { label: "WHO Guidelines", url: "https://who.int" },
            ],
          },
        ]);
      }
    }, 700);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-saans-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="ask-saans-title" className="text-sm font-bold text-slate-900">
                Ask Saans AI Assistant
              </h2>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Grounded in CPCB & WHO Science
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close Ask Saans assistant"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Emergency Symptom Advisory Banner */}
        <div
          role="note"
          aria-label="Emergency warning"
          className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-[11px] text-amber-900"
        >
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" aria-hidden="true" />
          <span>
            Not medical advice. For severe symptoms or breathing distress, dial <strong>112</strong>{" "}
            immediately.
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-slate-900 text-white rounded-br-xs"
                    : m.isEmergency
                      ? "bg-rose-100 text-rose-900 border border-rose-300 font-bold"
                      : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60"
                }`}
              >
                {m.text}

                {/* Citation Chips */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                    {m.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50"
                      >
                        <BookOpen className="w-2.5 h-2.5 text-emerald-600" aria-hidden="true" />
                        <span>{c.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs pl-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-medium ml-1">Saans is formulating guidance...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Suggested questions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 text-[11px] text-slate-700 text-left line-clamp-1"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white safe-area-inset-bottom"
        >
          <label htmlFor="ask-input" className="sr-only">
            Ask Saans a question
          </label>
          <input
            id="ask-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about smog, purifiers, or health..."
            className="flex-1 min-h-[44px] text-xs rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0"
            aria-label="Send message to Saans"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
};
