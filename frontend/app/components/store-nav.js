'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';
import {Menu, Moon, ShoppingBag, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';
import Dialog from './dialog';

export default function StoreNav({name, brand, links, count, openCart}) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [compact, setCompact] = useState(false);
  const {resolvedTheme, setTheme} = useTheme();

  useEffect(() => {
    const track = () => setCompact(window.scrollY > 45);
    track();
    window.addEventListener('scroll', track, {passive: true});
    return () => window.removeEventListener('scroll', track);
  }, []);

  function changeLocale() {
    document.cookie = `PAK_FOOD_LOCALE=${locale === 'ar' ? 'en' : 'ar'}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    router.refresh();
  }


  return (
    <header className={`site-header glass${compact ? ' is-compact' : ''}`}>
      {brand}
      <nav className="desktop-nav" aria-label={t('nav')}>
        {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <div className="flex items-center nav-actions">
        <button type="button" className="icon-button locale-toggle" onClick={changeLocale} aria-label={locale === 'ar' ? 'English' : 'العربية'} lang={locale === 'ar' ? 'en' : 'ar'}>{locale === 'ar' ? 'EN' : 'ع'}</button>
        <button type="button" className="icon-button theme-toggle" aria-label={t('theme')} onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>
          <Sun className="light-icon" size={18}/><Moon className="dark-icon" size={18}/>
        </button>
        <button type="button" className="icon-button cart-toggle" aria-label={t('openOrder', {count})} onClick={openCart}><ShoppingBag size={19}/>{count > 0 && <span>{count}</span>}</button>
        <button type="button" className="icon-button mobile-menu-button" aria-label={t('nav')} onClick={() => setExpanded(true)}><Menu size={23}/></button>
      </div>
      <Dialog title={name} open={expanded} onClose={() => setExpanded(false)} drawer>
        <nav className="drawer-nav" aria-label={t('nav')}>
          {links.map(([label, href]) => <a key={href} href={href} onClick={() => setExpanded(false)}>{label}</a>)}
        </nav>
      </Dialog>
    </header>
  );
}
