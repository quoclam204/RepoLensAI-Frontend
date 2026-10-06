"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { analysisGateway, usesMockAnalysis } from "@/services/analysis-gateway";
import { RepoLensIcon } from "@/components/icons";
import type { ConfidenceLevel, EvidenceReference } from "@/types/api";

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: ConfidenceLevel;
  evidence?: EvidenceReference[];
}

const welcomeMessage: ConversationMessage = {
  id: "welcome",
  role: "assistant",
  content: "Ask a question about this repository. Answers are shown with confidence and source evidence when the analysis provides it.",
};

const suggestions = [
  "How is this repository structured?",
  "Which API endpoints were detected?",
  "What database entities are related?",
];

export function RepositoryChat({ analysisId }: { analysisId: string }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([welcomeMessage]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryQuestion, setRetryQuestion] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending]);

  const sendQuestion = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setSending(true);
    setError(null);
    setRetryQuestion(null);

    try {
      const response = await analysisGateway.chat(analysisId, trimmed);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          confidence: response.confidence,
          evidence: response.evidence,
        },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to answer this question.");
      setRetryQuestion(trimmed);
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendQuestion(question);
  };

  const clearConversation = () => {
    setMessages([welcomeMessage]);
    setQuestion("");
    setError(null);
    setRetryQuestion(null);
  };

  return (
    <section className="chat-section">
      <header className="chat-heading">
        <div>
          <p className="eyebrow">Evidence-grounded AI</p>
          <h1>Repository chat</h1>
          <p>Ask about architecture, endpoints, data models and source relationships.</p>
        </div>
        <div className="chat-heading-actions">
          {usesMockAnalysis && <span>Demo data</span>}
          <button type="button" onClick={clearConversation} disabled={messages.length === 1 && !error}>Clear conversation</button>
        </div>
      </header>

      <div className="chat-layout">
        <div className="chat-panel">
          <div className="message-list" aria-live="polite">
            {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
            {sending && <div className="message assistant-message pending-message"><span /><span /><span /><p>Reviewing repository evidence</p></div>}
            {error && <div className="chat-error" role="alert"><strong>Question was not answered</strong><p>{error}</p>{retryQuestion && <button type="button" onClick={() => void sendQuestion(retryQuestion)}>Try again</button>}</div>}
            <div ref={endRef} />
          </div>

          <form className="chat-composer" onSubmit={submit}>
            <label htmlFor="repository-question">Question</label>
            <div>
              <textarea id="repository-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} rows={3} placeholder="Ask how a feature is implemented or where a relationship is defined…" disabled={sending} />
              <button className="button primary" type="submit" disabled={sending || question.trim().length === 0}>{sending ? "Answering…" : "Send question"}</button>
            </div>
            <small>{question.length}/2000 · Answers should be verified against the cited evidence.</small>
          </form>
        </div>

        <aside className="chat-sidebar">
          <div>
            <p className="eyebrow">Suggested questions</p>
            {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void sendQuestion(suggestion)} disabled={sending}>{suggestion}<span>→</span></button>)}
          </div>
          <div className="grounding-guide">
            <p className="eyebrow">How to read answers</p>
            <dl>
              <div><dt><i className="confidence-high" />High</dt><dd>Strong direct evidence</dd></div>
              <div><dt><i className="confidence-medium" />Medium</dt><dd>Supported with limitations</dd></div>
              <div><dt><i className="confidence-low" />Low</dt><dd>Weak or incomplete evidence</dd></div>
              <div><dt><i className="confidence-unknown" />Unknown</dt><dd>No confidence established</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ChatMessage({ message }: { message: ConversationMessage }) {
  return (
    <article className={`message ${message.role === "user" ? "user-message" : "assistant-message"}`}>
      <div className="message-author">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          {message.role === "assistant" && <RepoLensIcon size={14} />}
          {message.role === "user" ? "You" : "RepoLens AI"}
        </span>
        {message.confidence && <ConfidenceBadge confidence={message.confidence} />}
      </div>
      <p>{message.content}</p>
      {message.evidence && message.evidence.length > 0 && (
        <div className="chat-evidence">
          <strong>{message.evidence.length} source {message.evidence.length === 1 ? "reference" : "references"}</strong>
          {message.evidence.map((evidence) => (
            <details key={evidence.id}>
              <summary><span>{evidence.filePath}</span>{evidence.startLine !== undefined && <small>Lines {evidence.startLine}–{evidence.endLine ?? evidence.startLine}</small>}</summary>
              <div>{evidence.symbol && <code>{evidence.symbol}</code>}{evidence.description && <p>{evidence.description}</p>}<span>Evidence ID: {evidence.id}</span></div>
            </details>
          ))}
        </div>
      )}
    </article>
  );
}

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  return <span className={`confidence-badge confidence-${confidence.toLowerCase()}`}><i />{confidence} confidence</span>;
}
