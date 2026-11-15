export const offerLabels = {discount: 'Discount', occasion: 'Special occasion'};

export function formatOfferDate(date) {
  return new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium', timeZone: 'UTC'}).format(new Date(date));
}
