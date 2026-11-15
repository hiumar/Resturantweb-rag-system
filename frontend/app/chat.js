'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';

const prompts = {hours: 'chatHoursPrompt', menu: 'chatMenuPrompt', location: 'chatLocationPrompt', reservations: 'chatReservationsPrompt'};

export default function Chat({restaurantName}) {
  const t = useTranslations();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(null);

  useEffect(() => {
    latest.current?.scrollIntoView({block: 'nearest'});
  }, [messages, pending]);

  async function send(value) {
    const question = value.trim();
    if (!question || pending) return;

    setDraft('');
    setError('');
    setPending(true);
    const user = {role: 'user', content: question};
    setMessages([...messages, user]);
    try {
      const history = messages.slice(-8).map(({role, content}) => ({
        role, content: content.slice(0, 4000),
      }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({question, history}),
      });
      const reply = await response.json();
      if (!response.ok) throw new Error(typeof reply.detail === 'string' ? reply.detail : 'Please try again.');
      setMessages([...messages, user, {
        role: 'assistant', content: reply.answer, faq: reply.faq, staff: reply.staff, contact: reply.contact,
      }]);
    } catch (error) {
      setMessages(messages);
      setDraft(question);
      setError(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="chat" aria-label={t('assistant')}>
      <div className="intro">
        <h2>{t('chatHelp')}</h2>
        <p>{t('chatIntro', {name: restaurantName})}</p>
        <div className="prompts">
          {Object.entries(prompts).map(([label, question]) => (
            <button key={label} disabled={pending} onClick={() => send(t(question))}>{t(label)}</button>
          ))}
        </div>
      </div>
      <div className="conversation" role="log" aria-label={t('conversation')} aria-busy={pending}>
        {messages.map((message, index) => (
          <article key={index} className={'message ' + message.role}>
            <span className="sender">{message.role === 'user' ? t('you') : restaurantName}</span>
            <p dir="auto">{message.content}</p>
            {message.faq && <a href="/api/faq" target="_blank" rel="noreferrer">{t('faq')}</a>}
            {message.staff && (
              <div>{message.contact ? <a href={message.contact}>{t('callStaff')}</a> : t('staff')}</div>
            )}
          </article>
        ))}
        {pending && <p role="status">{t('checking')}</p>}
        <div ref={latest}/>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="composer" onSubmit={event => {event.preventDefault(); send(draft);}}>
        <label className="sr-only" htmlFor="question">{t('yourQuestion')}</label>
        <input id="question" dir="auto" placeholder={t('askQuestion')} maxLength={1000} value={draft} onChange={event => setDraft(event.target.value)} disabled={pending}/>
        <button className="primary" type="submit" disabled={pending || !draft.trim()}>{t('send')}</button>
      </form>
      {messages.length > 0 && (
        <button className="reset" disabled={pending} onClick={() => {setMessages([]); setDraft(''); setError('');}}>{t('newChat')}</button>
      )}
    </section>
  );
}
