import Image from 'next/image';
import {createTranslator, NextIntlClientProvider} from 'next-intl';
import {getStoreLocale} from './locale';
import {uae, normalizeUaePhone} from './uae';
import {OpeningStatus, StoreNotices} from './components/uae-storefront';
import {ArrowDown, ArrowRight, Clock, Flame, MapPin, Phone} from 'lucide-react';
import ChatWidget from './chat-widget';
import {getBranding} from './branding';
import {getOffers} from './get-offers';
import {getMenu} from './menu';
import {dishDetails, featuredDishes, reviews} from './storefront-content';
import Storefront from './components/storefront';
import {Reveal} from './components/motion';
import restaurant from '../restaurant.json';
import './restaurant.css';

const phone = normalizeUaePhone(restaurant.phone) || restaurant.phone;
const phoneHref = `tel:${phone}`;
const directions = 'https://www.google.com/maps/search/?api=1&query=Dubai%20Land%20Department%2C%20Deira%2C%20Dubai';

function BrandMark({logo}) {
  return logo ? <Image src={logo} alt="" width={40} height={40} unoptimized />
    : <span className="brand-emblem"><Flame size={22} aria-hidden="true"/></span>;
}

function Hero({t, locale, demo}) {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <Image src="/food/hero.webp" alt="" fill preload sizes="100vw" className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-content section-shell">
          <p className="eyebrow"><span /> {t('dubai')}</p>
          {uae.ramadan?.enabled && <p className="eyebrow">{t('ramadan')}</p>}
          <h1 id="hero-title">{t('heroFirst')}<br/><em>{t('heroSecond')}</em></h1>
          <p className="hero-description">{t('heroDescription')}</p>
          <div className="hero-actions">
            <a className="gold-button" href="#menu">{t('orderNow')} <ArrowRight size={17}/></a>
            <a className="outline-button" href="#reservation">{t('book')}</a>
          </div>
        </div>
        <a href="#visit" className="hero-scroll" aria-label={t('info')}><ArrowDown size={20}/></a>
      </section>
      {!demo && (uae.directPromotion || uae.talabatUrl || uae.deliverooUrl) && <div className="section-shell direct-promo">
        {uae.directPromotion && <p><a href="#menu">{t('save')}</a> · {uae.directPromotion[locale] || uae.directPromotion.en}</p>}
        {uae.talabatUrl && <a href={uae.talabatUrl} target="_blank" rel="noreferrer">Talabat</a>}
        {uae.deliverooUrl && <a href={uae.deliverooUrl} target="_blank" rel="noreferrer">Deliveroo</a>}
      </div>}
      <div className="section-shell visit-shell" id="visit">
        <div className="visit-strip glass">
          <a href={directions} target="_blank" rel="noreferrer"><span className="detail-icon"><MapPin size={20}/></span><span><small>{t('find')}</small><strong>{t('dubai')}</strong><span>{t('address')}</span></span></a>
          <a href={demo ? '#reservation' : phoneHref}><span className="detail-icon"><Clock size={20}/></span><span><small>{t(uae.ramadan?.enabled ? 'ramadanHours' : 'hours')}</small><OpeningStatus/><span>{t('callHours')}</span></span></a>
          <a href={demo ? '#reservation' : phoneHref}><span className="detail-icon"><Phone size={19}/></span><span><small>{t('tables')}</small><strong dir={demo ? undefined : 'ltr'}>{demo ? t('demoTitle') : phone}</strong><span>{t('callAhead')}</span></span></a>
        </div>
      </div>
    </>
  );
}

function Offers({offers, t, locale}) {
  if (!offers.length) return null;
  return (
    <section id="offers" className="section-shell offers-section" aria-labelledby="offers-title">
      <Reveal>
        <div className="section-heading"><h2 id="offers-title">{t('currentOffers')}</h2></div>
        <div className="offer-grid">
          {offers.map(offer => (
            <article key={offer.id} className="offer-card glass">
              <p className="eyebrow">{t(offer.kind)}</p>
              <h3>{offer.title}</h3>
              <p className="offer-details">{offer.details}</p>
              {offer.ends_on && <p className="offer-date">{t('valid')} <time dateTime={offer.ends_on}>{new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(offer.ends_on))}</time></p>}
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export default async function Page() {
  const [{name, logoVersion}, {items}, {offers}, {locale, messages}] = await Promise.all([getBranding(), getMenu(), getOffers(), getStoreLocale()]);
  const demo = process.env.PAK_FOOD_DEMO === '1';
  const t = createTranslator({locale, messages});
  const logo = logoVersion ? `/api/branding/logo?v=${logoVersion}` : null;
  const dishes = [...featuredDishes, ...items].map(dish => {
    const key = dish.id ?? dish.name;
    const storedPkr = dish.price?.match(/^PKR\s*([\d,]+)$/i)?.[1];
    return {...dish, name: locale === 'ar' ? dish.nameAr || dish.name : dish.name, description: locale === 'ar' ? dish.descriptionAr || dish.description : dish.description, pricePkr: storedPkr ? Number(storedPkr.replaceAll(',', '')) : null, ...dishDetails[key], key};
  });
  const links = [[t('menu'), '#menu']];
  if (offers.length) links.push([t('offers'), '#offers']);
  links.push([t('gallery'), '#gallery']);
  if (reviews.length) links.push([t('reviews'), '#reviews']);
  links.push([t('visit'), '#visit'], [t('reservations'), '#reservation']);

  return <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Dubai"><Storefront
    name={name} demo={demo} dishes={dishes} links={links} phoneHref={phoneHref}
    brand={<a className="site-brand" href="#top"><BrandMark logo={logo}/><span>{name}<small>{t('pakistani')}</small></span></a>}
    hero={<Hero t={t} locale={locale} demo={demo}/> }
    offers={<Offers offers={offers} t={t} locale={locale}/>}
    footer={<footer className="site-footer section-shell">
      <a className="site-brand" href="#top"><BrandMark logo={logo}/>{name}</a>
      {!demo && <a href="mailto:contact@pakfood.com">contact@pakfood.com</a>}
      <a href="/admin">{t('admin')}</a>
      <div className="restaurant-credentials">
        {uae.tradeLicense && <span>{t('license')}: <bdi>{uae.tradeLicense}</bdi></span>}
        {uae.halalVerified && <span className="credential-badge">{t('halal')}</span>}
        {uae.foodSafetyGrade && <span>{t('grade')}: <bdi>{uae.foodSafetyGrade}</bdi></span>}
      </div>
      <StoreNotices />
    </footer>}
    chat={<ChatWidget restaurantName={name} logo={logo}/>}
  /></NextIntlClientProvider>;
}
