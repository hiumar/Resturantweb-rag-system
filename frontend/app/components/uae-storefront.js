'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {isOpenInDubai, uae} from '../uae';
import Dialog from './dialog';

export function OpeningStatus() {
  const t = useTranslations();
  const schedule = uae.ramadan?.enabled ? uae.ramadan.hours : uae.openingHours;
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!schedule) return;
    const update = () => setOpen(isOpenInDubai(schedule));
    update();
    const id = window.setInterval(update, 15000);
    return () => window.clearInterval(id);
  }, [schedule]);

  return <strong>{open === null ? t('callConfirm') : t(open ? 'openNow' : 'closed')}</strong>;
}

export function StoreNotices() {
  const t = useTranslations();
  const [panel, setPanel] = useState(null);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    setShowConsent(!document.cookie.split('; ').some(cookie => cookie.startsWith('PAK_FOOD_COOKIES=')));
  }, []);

  function consent(value) {
    document.cookie = `PAK_FOOD_COOKIES=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    setShowConsent(false);
    setPanel(null);
    window.dispatchEvent(new Event('pak-food-cookie-preference'));
  }

  const actions = <div className="notice-actions">
    <button type="button" className="gold-button" onClick={() => consent('essential')}>{t('essential')}</button>
    <button type="button" className="notice-link" onClick={() => consent('optional')}>{t('accept')}</button>
  </div>;
  const text = {privacy: 'privacyBody', terms: 'termsBody', cookies: 'cookieBody'};

  return <>
    <div className="notice-links">
      {['privacy', 'terms', 'cookies'].map(key => <button key={key} className="notice-link" type="button" onClick={() => setPanel(key)}>{t(key)}</button>)}
    </div>
    {showConsent && !panel && <aside className="cookie-notice glass" aria-label={t('cookies')}>
      <p>{t('cookieBody')}</p>{actions}
    </aside>}
    <Dialog title={panel ? t(panel) : ''} open={!!panel} onClose={() => setPanel(null)}>
      {panel && <p>{t(text[panel])}</p>}
      {panel === 'cookies' && actions}
    </Dialog>
  </>;
}
