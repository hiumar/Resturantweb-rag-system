'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useForm, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import CheckoutMap from './checkout-map';
import {emirates, getDeliveryFee, isMapsLink, uae, uaePhoneSchema} from '../uae';
import {formatDishPrice, whatsappLink} from '../storefront-content';

const aed = minorUnits => formatDishPrice({currency: 'AED', minorUnits});

export function UaePhoneInput(props) {
  return <span className="uae-phone" dir="ltr">
    <span aria-label="United Arab Emirates">🇦🇪 +971</span>
    <input {...props} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="50 123 4567" />
  </span>;
}

function checkoutSchema(t) {
  const optional = z.string().trim().max(120);
  return z.object({
    method: z.enum(['pickup', 'delivery']),
    phone: uaePhoneSchema(t('phoneError')),
    emirate: optional, area: optional, building: optional, apartment: optional, landmark: optional,
    pin: z.string().trim().max(500).refine(isMapsLink, t('pinError')),
    payment: z.enum(['cash', 'link', 'card', 'Apple Pay', 'Google Pay']),
  }).superRefine((value, context) => {
    if (value.method !== 'delivery') return;
    if (!emirates.some(([key]) => key === value.emirate)) {
      context.addIssue({code: 'custom', path: ['emirate'], message: t('required')});
    }
    for (const field of ['area', 'building']) {
      if (!value[field]) context.addIssue({code: 'custom', path: [field], message: t('required')});
    }
  });
}

export default function UaeCheckout({demo, total, allPriced, message}) {
  const t = useTranslations();
  const locale = useLocale();
  const [draft, setDraft] = useState(null);
  const {register, control, handleSubmit, setValue, formState: {errors}} = useForm({
    resolver: zodResolver(checkoutSchema(t)),
    defaultValues: {method: 'pickup', payment: 'cash', phone: '', emirate: 'dubai', area: '', building: '', apartment: '', landmark: '', pin: ''},
  });
  const [method, emirate, area] = useWatch({control, name: ['method', 'emirate', 'area']});
  const delivery = method === 'delivery';
  const deliveryFee = delivery ? getDeliveryFee(emirate, area) : 0;
  const final = total + (deliveryFee ?? 0);
  const vatRate = uae.vatRate ?? 5;
  const vat = Math.round(final * vatRate / (100 + vatRate));
  const paymentOptions = {
    cash: t(delivery ? 'cod' : 'cashPickup'), link: t('paymentLink'),
    card: t('card'), 'Apple Pay': 'Apple Pay', 'Google Pay': 'Google Pay',
  };

  function prepare(data) {
    const emirateName = emirates.find(([key]) => key === data.emirate)?.[locale === 'ar' ? 2 : 1];
    const lines = [
      message, `${t('fulfillment')}: ${t(data.method)}`, `${t('phone')}: ${data.phone}`,
      `${t('payment')}: ${paymentOptions[data.payment]}`,
      ...(delivery ? [
        [emirateName, data.area, data.building, data.apartment, data.landmark].filter(Boolean).join(' · '),
        data.pin, `${t('fee')}: ${deliveryFee === null ? t('quote') : aed(deliveryFee)}`,
      ] : []),
      ...(allPriced && deliveryFee !== null ? [`${t('total')}: ${aed(final)}${vatRate > 0 ? ` (${t('vat', {rate: vatRate})}: ${aed(vat)})` : ''}`] : [t('pending')]),
      t('confirmOrder'),
    ];
    setDraft({message, href: demo ? null : whatsappLink(lines.filter(Boolean).join('\n'))});
  }

  function field(name, label, props = {}) {
    return <label key={name}>{t(label)}
      <input {...props} {...register(name)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `checkout-${name}` : undefined}/>
      {errors[name] && <small id={`checkout-${name}`} role="alert">{errors[name].message}</small>}
    </label>;
  }

  return <section className="checkout" aria-labelledby="checkout-title">
    <h3 id="checkout-title">{t('checkout')}</h3>
    <form className="checkout-form" onSubmit={handleSubmit(prepare)} onChange={() => setDraft(null)} noValidate>
      <label>{t('fulfillment')}<select {...register('method')}><option value="pickup">{t('pickup')}</option><option value="delivery">{t('delivery')}</option></select></label>
      <label>{t('phone')}<UaePhoneInput {...register('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'checkout-phone' : undefined}/>
        {errors.phone && <small id="checkout-phone" role="alert">{errors.phone.message}</small>}
      </label>
      {delivery && <>
        <label>{t('emirate')}<select {...register('emirate')} aria-invalid={!!errors.emirate}>{emirates.map(([key, en, ar]) => <option key={key} value={key}>{locale === 'ar' ? ar : en}</option>)}</select></label>
        {field('area', 'area', {list: 'delivery-areas', autoComplete: 'address-level2'})}
        <datalist id="delivery-areas">{Object.keys(uae.deliveryFees?.[emirate]?.areas ?? {}).map(name => <option key={name} value={name}/>)}</datalist>
        {field('building', 'building', {autoComplete: 'address-line1'})}
        {field('apartment', 'apartment', {autoComplete: 'address-line2'})}
        {field('landmark', 'landmark')}
        <CheckoutMap onPin={value => {setValue('pin', value, {shouldValidate: true}); setDraft(null);}} />
        {field('pin', 'pin', {type: 'url', dir: 'ltr', placeholder: 'https://maps.app.goo.gl/…'})}
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([area, emirates.find(([key]) => key === emirate)?.[1], 'UAE'].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer">{t('pickPin')}</a>
      </>}
      <label>{t('payment')}<select {...register('payment')}>
        {Object.entries(paymentOptions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        {['Tabby', 'Tamara'].map(label => <option key={label} disabled>{label} · {t('unavailable')}</option>)}
      </select></label>
      <p>{t(demo ? 'demoNotice' : 'payNote')}</p>
      <dl className="checkout-totals">
        <div><dt>{t('subtotal')}</dt><dd>{aed(total)}</dd></div>
        {delivery && <div><dt>{t('fee')}</dt><dd>{deliveryFee === null ? t('quote') : aed(deliveryFee)}</dd></div>}
        {vatRate > 0 && <div><dt>{t('vat', {rate: vatRate})}</dt><dd>{aed(vat)}</dd></div>}
        <div><dt>{t('total')}</dt><dd>{allPriced && deliveryFee !== null ? aed(final) : t('pending')}</dd></div>
      </dl>
      <button className="gold-button" type="submit">{t('prepare')}</button>
    </form>
    {draft?.message === message && <p role="status">{demo ? t('demoPrepared') : <a className="gold-button" href={draft.href} target="_blank" rel="noreferrer">{t('sendOrder')}</a>}</p>}
  </section>;
}
