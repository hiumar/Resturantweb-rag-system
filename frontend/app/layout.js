import localFont from 'next/font/local';
import './style.css';
import {getStoreLocale} from './locale';
import {getBranding} from './branding';

const headings = localFont({
  src: [
    {path: '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-standard-normal.woff2', weight: '100 900', style: 'normal'},
    {path: '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-standard-italic.woff2', weight: '100 900', style: 'italic'},
  ],
  variable: '--font-heading',
  display: 'swap',
});

const body = localFont({
  src: '../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2',
  weight: '100 1000',
  variable: '--font-body',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const {name} = await getBranding();
  return {title: `${name} | Pakistani Kitchen in Deira`, description: `Explore the menu and plan your visit to ${name} in Deira, Dubai.`};
}

export default async function Layout({children}) {
  const {locale, dir} = await getStoreLocale();
  return <html lang={locale} dir={dir} suppressHydrationWarning><body className={`${headings.variable} ${body.variable}`}><main>{children}</main></body></html>;
}
