import {z} from 'zod';
import restaurant from '../restaurant.json';

export const uae = restaurant.uae ?? {};
export const emirates = [
  ['dubai', 'Dubai', 'دبي'], ['abu-dhabi', 'Abu Dhabi', 'أبوظبي'], ['sharjah', 'Sharjah', 'الشارقة'],
  ['ajman', 'Ajman', 'عجمان'], ['umm-al-quwain', 'Umm Al Quwain', 'أم القيوين'],
  ['ras-al-khaimah', 'Ras Al Khaimah', 'رأس الخيمة'], ['fujairah', 'Fujairah', 'الفجيرة'],
];

export function normalizeUaePhone(value) {
  let digits = value.replace(/[٠-٩۰-۹]/g, char => String(char.charCodeAt(0) & 15)).replace(/[\s().-]/g, '');
  if (digits.startsWith('+971')) digits = digits.slice(4);
  else if (digits.startsWith('00971')) digits = digits.slice(5);
  else if (digits.startsWith('971')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^5[024568]\d{7}$/.test(digits) ? `+971${digits}` : null;
}

export const uaePhoneSchema = message => z.string().transform(normalizeUaePhone)
  .pipe(z.string({error: message}));

export function dubaiNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return {day: value('weekday').toLowerCase(), time: `${value('hour')}:${value('minute')}`};
}

export function isOpenInDubai(schedule, date) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const {day, time} = dubaiNow(date);
  const previous = days[(days.indexOf(day) + 6) % 7];
  return (schedule[day] ?? []).some(([start, end]) => time >= start && (end <= start || time < end))
    || (schedule[previous] ?? []).some(([start, end]) => end <= start && time < end);
}

export function getDeliveryFee(emirate, area) {
  const rates = uae.deliveryFees?.[emirate];
  const match = Object.entries(rates?.areas ?? {}).find(([name]) => name.toLowerCase() === area.trim().toLowerCase());
  const fee = match?.[1] ?? rates?.default;
  return Number.isFinite(fee) && fee >= 0 ? Math.round(fee * 100) : null;
}

export function isMapsLink(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (
      (['www.google.com', 'maps.google.com'].includes(url.hostname) && (url.hostname === 'maps.google.com' || url.pathname.startsWith('/maps')))
      || url.hostname === 'maps.app.goo.gl' || (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps'))
    );
  } catch {
    return false;
  }
}
