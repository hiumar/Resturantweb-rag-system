import {getRequestConfig} from 'next-intl/server';
import {getStoreLocale} from './locale';

export default getRequestConfig(async () => {
  const {locale, messages} = await getStoreLocale();
  return {locale, messages, timeZone: 'Asia/Dubai'};
});
