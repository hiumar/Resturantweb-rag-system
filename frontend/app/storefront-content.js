import restaurant from '../restaurant.json';

export const categories = ['All dishes', 'Lahori', 'Karachi', 'Peshawari', 'Balochi', 'Desserts & Drinks'];

export const featuredDishes = [
  {name: 'Chicken Biryani', nameAr: 'برياني الدجاج', descriptionAr: 'أرز بسمتي عطري مع الدجاج المتبّل والبصل المقرمش.', price: 'AED 20', image: '/food/biryani.webp', category: 'Karachi', description: 'Fragrant basmati rice layered with spiced chicken and crispy fried onions.'},
  {name: 'Chicken Karahi', nameAr: 'كراهي الدجاج', descriptionAr: 'دجاج بصلصة طماطم غنية مع الزنجبيل الطازج والأعشاب.', price: 'AED 22', image: '/food/karahi.webp', category: 'Lahori', description: 'A rich, tomato-based chicken karahi finished with fresh ginger and herbs.'},
  {name: 'Seekh Kebabs', nameAr: 'كباب سيخ', descriptionAr: 'لحم مفروم متبّل يُشوى على أسياخ ليكتسب نكهة الشواء.', price: 'AED 18', image: '/food/kebabs.webp', description: 'Spiced minced meat shaped on skewers and grilled for a smoky finish.'},
];

// Optional overrides keyed by a featured dish name or an uploaded dish ID.
// Supported fields: category, spice (1–3), and pricePkr (positive whole rupees).
export const dishDetails = {};

export const gallery = [
  {src: '/food/hero.webp', alt: 'Chicken biryani served in a brass platter', altAr: 'برياني الدجاج في طبق نحاسي'},
  ...featuredDishes.map(dish => ({src: dish.image, alt: dish.name, altAr: dish.nameAr})),
];

// Add verified reviews as {name, quote} entries.
export const reviews = [];

const configuredPhone = (restaurant.whatsapp || restaurant.phone).replace(/[^0-9]/g, '');
export const whatsappNumber = configuredPhone.startsWith('0') ? `971${configuredPhone.slice(1)}` : configuredPhone;

export function whatsappLink(message = '') {
  return `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export const formatPkr = value => `PKR ${new Intl.NumberFormat('en-PK').format(value)}`;

export function getDishPrice(dish) {
  if (dish.pricePkr) return {currency: 'PKR', minorUnits: dish.pricePkr * 100};

  const match = dish.price?.trim().match(/^AED\s*([0-9]+(?:,[0-9]{3})*)(?:\.([0-9]{1,2}))?$/i);
  if (!match) return null;

  const minorUnits = Number(match[1].replaceAll(',', '')) * 100 + Number((match[2] || '').padEnd(2, '0'));
  return Number.isSafeInteger(minorUnits) ? {currency: 'AED', minorUnits} : null;
}

export function formatDishPrice({currency, minorUnits}) {
  if (currency === 'PKR') return formatPkr(minorUnits / 100);
  const amount = new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
  return `AED ${amount}`;
}
