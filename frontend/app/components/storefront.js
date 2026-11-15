'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {MessageCircle} from 'lucide-react';
import {whatsappLink} from '../storefront-content';
import {Cart, MenuSection} from './order-menu';
import {FoodGallery, Reservation, Reviews} from './guest-extras';
import {StorefrontProviders} from './motion';
import StoreNav from './store-nav';

export default function Storefront({name, demo, brand, links, dishes, phoneHref, hero, offers, footer, chat}) {
  const t = useTranslations();
  const [remember, setRemember] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const items = dishes.filter(dish => quantities[dish.key] > 0).map(dish => ({...dish, quantity: quantities[dish.key]}));
  const count = items.reduce((sum, dish) => sum + dish.quantity, 0);

  useEffect(() => {
    function allowed() {
      return document.cookie.split('; ').includes('PAK_FOOD_COOKIES=optional');
    }
    function sync() {
      setRemember(allowed());
      if (!allowed()) localStorage.removeItem('pak-food-cart');
    }
    if (allowed()) {
      try {
        const saved = JSON.parse(localStorage.getItem('pak-food-cart') || '{}');
        setQuantities(Object.fromEntries(Object.entries(saved).filter(([, value]) => Number.isInteger(value) && value > 0 && value <= 99)));
      } catch {
        localStorage.removeItem('pak-food-cart');
      }
    }
    sync();
    window.addEventListener('pak-food-cookie-preference', sync);
    return () => window.removeEventListener('pak-food-cookie-preference', sync);
  }, []);

  useEffect(() => {
    if (remember) localStorage.setItem('pak-food-cart', JSON.stringify(quantities));
  }, [quantities, remember]);

  function change(key, delta) {
    setQuantities(current => ({...current, [key]: Math.max(0, Math.min(99, (current[key] || 0) + delta))}));
  }

  return (
    <StorefrontProviders>
      <div id="top" className="restaurant">
        <StoreNav name={name} brand={brand} links={links} count={count} openCart={() => setCartOpen(true)} />
        {hero}
        {demo && <p className="demo-notice section-shell" role="note"><strong>{t('demoTitle')}</strong> · {t('demoNotice')}</p>}
        {offers}
        <MenuSection dishes={dishes} add={key => {change(key, 1); setCartOpen(true);}} />
        <FoodGallery />
        <Reviews />
        <Reservation demo={demo} restaurantName={name} phoneHref={phoneHref} />
        {footer}
        {chat}
        {!demo && <a className="whatsapp-fab" href={whatsappLink()} target="_blank" rel="noreferrer" aria-label={t('whatsapp')}><MessageCircle size={23}/></a>}
        <Cart demo={demo} open={cartOpen} onClose={() => setCartOpen(false)} items={items} change={change} restaurantName={name} />
      </div>
    </StorefrontProviders>
  );
}
