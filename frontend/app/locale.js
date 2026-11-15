import {cache} from 'react';
import {cookies} from 'next/headers';
import en from './messages/en.json';
import ar from './messages/ar.json';

export const getStoreLocale = cache(async () => {
  const locale = (await cookies()).get('PAK_FOOD_LOCALE')?.value === 'ar' ? 'ar' : 'en';
  return {locale, messages: locale === 'ar' ? ar : en, dir: locale === 'ar' ? 'rtl' : 'ltr'};
});
