'use client';

import {useEffect, useRef, useState} from 'react';
import Chat from './chat';
import {useTranslations} from 'next-intl';
import Icon from './site-icon';

export default function ChatWidget({restaurantName, logo}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const closeButton = useRef(null);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  return (
    <aside className="chat-widget" aria-label={t('assistant')}>
      <button ref={trigger} type="button" className="chat-launch glass" onClick={() => open ? close() : setOpen(true)} aria-expanded={open} aria-controls="guest-chat">
        <span className="chat-launch-icon"><Icon name={open ? 'close' : 'chat'} /></span>
        <span>{open ? t('closeChat') : t('chatAsk', {name: restaurantName})}</span>
      </button>
      <div id="guest-chat" className="chat-panel" hidden={!open} onKeyDown={event => {if (event.key === 'Escape') close();}}>
        <div className="chat-heading">
          <span className="chat-launch-icon">{logo ? <img src={logo} width="28" height="28" alt="" /> : <Icon name="chat" />}</span>
          <strong>{t('assistant')}</strong>
          <button ref={closeButton} type="button" onClick={close} aria-label={t('closeChat')}><Icon name="close" /></button>
        </div>
        <Chat restaurantName={restaurantName} />
      </div>
    </aside>
  );
}
