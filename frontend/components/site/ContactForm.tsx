"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT_EMAIL } from "@/lib/site";

const TOPICS: string[] = [
  "A question",
  "Report a wrong or outdated step",
  "Pilot with my city or department",
  "Something else",
];

const fieldClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-colors duration-150 ease-out placeholder:text-slate-400 focus:border-brand-700";

export function ContactForm() {
  const [name, setName] = useState<string>("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [message, setMessage] = useState<string>("");
  const [opened, setOpened] = useState<boolean>(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!CONTACT_EMAIL) return;
    const subject = `NagarSetu: ${topic}`;
    const body = `${message.trim()}\n\n${name.trim() ? `From: ${name.trim()}` : ""}`.trim();
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="contact-name" className="text-sm font-medium text-slate-900">
          Name (optional)
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="contact-topic" className="text-sm font-medium text-slate-900">
          Topic
        </label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className={fieldClass}
        >
          {TOPICS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="text-sm font-medium text-slate-900">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={6}
          className={fieldClass}
        />
        <p className="mt-2 text-xs text-slate-500">
          Please do not include Aadhaar, PAN, phone or bank details.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!CONTACT_EMAIL || message.trim().length === 0}
        className="h-auto rounded-lg bg-brand-700 px-7 py-3.5 text-base font-bold text-white transition-colors duration-150 ease-out hover:bg-brand-900"
      >
        <Send aria-hidden="true" className="mr-2 h-4 w-4" />
        Send message
      </Button>

      {opened && (
        <p role="status" className="text-sm leading-[1.6] text-slate-600">
          Your email app should open with the message filled in. If nothing opened, write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-700 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      )}
    </form>
  );
}
