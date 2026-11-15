import {getBranding} from '../branding';
import {getOffers} from '../get-offers';
import OffersForm from './offers-form';
import {getMenu} from '../menu';
import BrandingForm from './branding-form';
import FAQForm from './faq-form';
import MenuForm from './menu-form';

export default async function Admin() {
  const [{name}, {items, available}, offers] = await Promise.all([getBranding(), getMenu(), getOffers()]);
  return (
    <>
      <h1>Restaurant admin</h1>
      <nav className="admin-nav" aria-label="Admin sections">
        <a href="#menu-settings">Menu items</a>
        <a href="#offer-settings">Offers</a>
        <a href="#branding-settings">Name and logo</a>
        <a href="#faq-settings">Chatbot FAQ</a>
      </nav>
      <MenuForm items={items} available={available} />
      <OffersForm {...offers} />
      <BrandingForm currentName={name}/>
      <div id="faq-settings" className="admin-section"><FAQForm/></div>
    </>
  );
}
