import { motion } from "framer-motion";
import { ArrowUp, Hash, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Redirect, useParams } from "wouter";
import { Markdown } from "@/lib/markdown";
import { answer } from "@/components/app/AskVult";
import { usePage } from "@/components/app/PageMeta";
import { Avatar } from "@/components/ui/Avatar";
import { getDB, store, uid, useDB } from "@/data/store";
import { useSession } from "@/lib/session";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const session = useSession();
  const chat = db.chats.find((c) => c.id === id);
  usePage({ title: chat?.title ?? "Chat", icon: Hash });
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [chat?.messages.length]);
  if (!chat) return <Redirect to="/app/home" />;

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const now = new Date().toISOString();
    const q = text.trim();
    store.update("chats", chat.id, { messages: [...chat.messages, { id: uid("x"), role: "user", text: q, at: now }] });
    setText("");
    setTimeout(() => {
      const current = getDB().chats.find((c) => c.id === chat.id);
      if (current) store.update("chats", chat.id, { messages: [...current.messages, { id: uid("x"), role: "assistant", text: answer(q), at: new Date().toISOString() }] });
    }, 600);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <ol className="mx-auto flex max-w-[760px] flex-col gap-5" aria-live="polite">
          {chat.messages.map((m) => (
            <motion.li key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              {m.role === "assistant" ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent"><Sparkles aria-hidden className="size-3.5 text-white" /></span>
              ) : (
                <Avatar name={session?.name ?? "You"} size={28} />
              )}
              <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-app-text [&_li]:ml-4 [&_li]:list-disc [&_p]:my-1 [&_strong]:text-white">
                <p className="text-xs font-semibold text-app-dim">{m.role === "assistant" ? "Vult" : session?.name ?? "You"}</p>
                <Markdown>{m.text}</Markdown>
              </div>
            </motion.li>
          ))}
          <div ref={end} />
        </ol>
      </div>
      <form onSubmit={send} className="border-t border-app-line p-3">
        <div className="mx-auto flex max-w-[760px] items-center gap-2 rounded-xl border border-[#2e3033] bg-app-input p-2 focus-within:border-app-accent">
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input id="chat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message #${chat.title}`} className="h-8 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-app-mute" />
          <button type="submit" aria-label="Send" disabled={!text.trim()} className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40"><ArrowUp className="size-4" /></button>
        </div>
      </form>
    </div>
  );
}
