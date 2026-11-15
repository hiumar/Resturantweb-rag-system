'use client';

import {useState} from 'react';
import Image from 'next/image';
import {useLocale, useTranslations} from 'next-intl';
import {uaePhoneSchema} from '../uae';
import {UaePhoneInput} from './uae-checkout';
import {ArrowLeft, ArrowRight, ZoomIn} from 'lucide-react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {gallery, reviews, whatsappLink} from '../storefront-content';
import Dialog from './dialog';
import {Reveal} from './motion';

export function FoodGallery() {
  const t = useTranslations();
  const locale = useLocale();
  const alt = photo => locale === 'ar' ? photo.altAr || photo.alt : photo.alt;
  const [active, setActive] = useState(null);
  const move = step => setActive(index => (index + step + gallery.length) % gallery.length);
  return (
    <section id="gallery" className="section-shell gallery-section">
      <Reveal className="section-heading"><div><p className="eyebrow">{t('kitchen')}</p><h2>{t('behind')} <em>{t('plate')}</em></h2></div></Reveal>
      <div className="gallery-grid">
        {gallery.map((photo, index) => (
          <Reveal key={photo.src} delay={index * 0.06}>
            <button className="gallery-tile" type="button" aria-label={t('enlarge', {photo: alt(photo)})} onClick={() => setActive(index)}>
              <Image src={photo.src} alt={alt(photo)} fill sizes="(max-width: 650px) 46vw, 30vw" />
              <span><ZoomIn size={18}/></span>
            </button>
          </Reveal>
        ))}
      </div>
      <Dialog title={active === null ? t('gallery') : alt(gallery[active])} open={active !== null} onClose={() => setActive(null)}>
        {active !== null && (
          <div onKeyDown={event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              move(event.key === 'ArrowLeft' ? -1 : 1);
            }
          }}>
            <div className="lightbox-photo"><Image src={gallery[active].src} alt={alt(gallery[active])} fill sizes="(max-width: 800px) 92vw, 760px" /></div>
            <div className="carousel-controls">
              <button className="icon-button" aria-label={t('prevPhoto')} onClick={() => move(-1)}><ArrowLeft size={18}/></button>
              <span aria-live="polite">{active + 1} / {gallery.length}</span>
              <button className="icon-button" aria-label={t('nextPhoto')} onClick={() => move(1)}><ArrowRight size={18}/></button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}

export function Reviews() {
  const t = useTranslations();
  const [active, setActive] = useState(0);
  if (!reviews.length) return null;
  const review = reviews[active];
  const move = step => setActive(index => (index + step + reviews.length) % reviews.length);
  return (
    <section id="reviews" className="section-shell reviews-section" aria-labelledby="reviews-title">
      <Reveal>
        <div className="section-heading"><h2 id="reviews-title">{t('guestReviews')}</h2></div>
        <figure className="glass review-card" aria-live="polite">
          <blockquote>{review.quote}</blockquote><figcaption>{review.name}</figcaption>
        </figure>
        {reviews.length > 1 && <div className="carousel-controls">
          <button className="icon-button" aria-label={t('prevReview')} onClick={() => move(-1)}><ArrowLeft size={18}/></button>
          <span>{active + 1} / {reviews.length}</span>
          <button className="icon-button" aria-label={t('nextReview')} onClick={() => move(1)}><ArrowRight size={18}/></button>
        </div>}
      </Reveal>
    </section>
  );
}

function dubaiDate() {
  return new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
}

export function Reservation({demo, restaurantName, phoneHref}) {
  const t = useTranslations();
  const [request, setRequest] = useState('');
  const schema = z.object({
    name: z.string().trim().min(2, t('required')).max(80),
    guests: z.coerce.number().int().min(1, t('validGuests')).max(99, t('validGuests')),
    date: z.iso.date({error: t('validDate')}).refine(date => date >= dubaiDate(), t('futureDate')),
    time: z.iso.time({precision: -1, error: t('validTime')}),
    phone: uaePhoneSchema(t('phoneError')),
  });
  const {register, handleSubmit, formState: {errors}} = useForm({resolver: zodResolver(schema), defaultValues: {guests: 2, phone: ''}});

  function prepare(details) {
    setRequest(demo ? 'preview' : whatsappLink(t('bookingDraft', {...details, name: restaurantName, guest: details.name})));
  }

  return (
    <section id="reservation" className="section-shell reservation-section" aria-labelledby="reservation-title">
      <div className="reservation-card glass">
        <div className="section-heading">
          <div><p className="eyebrow">{t('plan')}</p><h2 id="reservation-title">{t('bookTitle')}</h2></div>
          <p>{demo ? t('demoNotice') : <>{t('reserveNote')} <a href={phoneHref}>{t('callRestaurant')}</a>.</>}</p>
        </div>
        <form className="reservation-form" onSubmit={handleSubmit(prepare)} onChange={() => setRequest('')} noValidate>
          {[
            {name: 'name', label: 'guestName', type: 'text', autoComplete: 'name', maxLength: 80},
            {name: 'guests', label: 'guests', type: 'number', min: 1, max: 99},
            {name: 'date', label: 'date', type: 'date'},
            {name: 'time', label: 'time', type: 'time'},
          ].map(({name, label, ...props}) => (
            <label key={name}>{t(label)}
              <input {...props} {...register(name)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `reservation-${name}-error` : undefined} required />
              {errors[name] && <span id={`reservation-${name}-error`} role="alert">{errors[name].message}</span>}
            </label>
          ))}
          <label>{t('phone')}<UaePhoneInput {...register('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'reservation-phone-error' : undefined}/>
            {errors.phone && <span id="reservation-phone-error" role="alert">{errors.phone.message}</span>}
          </label>
          <button className="gold-button" type="submit">{t('prepare')} <ArrowRight size={17}/></button>
        </form>
        {request && <p className="reservation-confirm" role="status">{demo ? t('demoPrepared') : <a href={request} target="_blank" rel="noreferrer">{t('sendReservation')}</a>}</p>}
      </div>
    </section>
  );
}
