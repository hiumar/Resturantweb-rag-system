'use client';

import {useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import UaeCheckout from './uae-checkout';
import {AnimatePresence, motion} from 'framer-motion';
import {Minus, Plus} from 'lucide-react';
import {categories, formatDishPrice, getDishPrice} from '../storefront-content';
import Dialog from './dialog';

const categoryKeys = ['all', 'lahori', 'karachi', 'peshawari', 'balochi', 'desserts'];

function DishCard({dish, add}) {
  const t = useTranslations();
  const price = getDishPrice(dish);
  return (
    <motion.article layout initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0}} className="dish">
      <div className="dish-media">
        {dish.image && <Image src={dish.image} alt={dish.name} fill sizes="(max-width: 659px) 92vw, (max-width: 999px) 45vw, 33vw" />}
        {dish.category && <span className="dish-category">{categories.includes(dish.category) ? t(categoryKeys[categories.indexOf(dish.category)]) : dish.category}</span>}
      </div>
      <div className="dish-body">
        <div className="flex items-start justify-between gap-3">
          <h3>{dish.name}</h3>
          {!!dish.spice && <span className="spice" aria-label={t('spice', {count: dish.spice})}>{Array.from({length: dish.spice}, (_, i) => <span key={i} aria-hidden="true">🌶</span>)}</span>}
        </div>
        <p>{dish.description}</p>
        <div className="dish-actions">
          <span className="dish-price">{price ? formatDishPrice(price) : dish.price || t('askPrice')}</span>
          <button type="button" className="icon-button" onClick={() => add(dish.key)} aria-label={t('add', {dish: dish.name})}><Plus size={19}/></button>
        </div>
      </div>
    </motion.article>
  );
}

export function MenuSection({dishes, add}) {
  const t = useTranslations();
  const [category, setCategory] = useState(categories[0]);
  const shown = category === categories[0] ? dishes : dishes.filter(dish => dish.category === category);
  return (
    <section id="menu" className="menu-section section-shell" aria-labelledby="menu-title">
      <div className="section-heading"><div><p className="eyebrow">{t('menuLabel')}</p><h2 id="menu-title">{t('house')} <em>{t('favorites')}</em></h2></div><p>{t('availability')}</p></div>
      <div className="menu-filters" role="group" aria-label={t('filter')}>
        {categories.map((label, index) => <button key={label} type="button" aria-pressed={category === label} onClick={() => setCategory(label)}>{t(categoryKeys[index])}</button>)}
      </div>
      <div className="dish-grid">
        <AnimatePresence initial={false}>{shown.map(dish => <DishCard key={dish.key} dish={dish} add={add}/>)}</AnimatePresence>
      </div>
      {shown.length === 0 && <p className="empty-state" role="status">{t('emptyCategory')}</p>}
      <p className="menu-note">{t('daal')}</p>
    </section>
  );
}

export function Cart({open, onClose, items, change, restaurantName}) {
  const t = useTranslations();
  const lines = items.map(dish => ({...dish, unitPrice: getDishPrice(dish)}));
  const total = lines.reduce((sum, {unitPrice, quantity}) => sum + (unitPrice?.currency === 'AED' ? unitPrice.minorUnits * quantity : 0), 0);
  const allPriced = lines.every(dish => dish.unitPrice?.currency === 'AED');
  const message = [
    t('hello', {name: restaurantName}),
    ...lines.map(dish => {
      const price = dish.unitPrice
        ? formatDishPrice({...dish.unitPrice, minorUnits: dish.unitPrice.minorUnits * dish.quantity})
        : dish.price || t('askPrice');
      return `• ${dish.quantity} × ${dish.name} — ${price}`;
    }),
  ].join('\n');

  return (
    <Dialog title={t('order')} open={open} onClose={onClose} drawer>
      {items.length === 0 ? <p>{t('emptyOrder')}</p> : (
        <>
          <ul className="cart-items">
            {lines.map(dish => (
              <li key={dish.key}>
                <div><strong>{dish.name}</strong><small>{dish.unitPrice ? formatDishPrice(dish.unitPrice) : dish.price || t('askPrice')}</small></div>
                <div className="quantity">
                  <button type="button" aria-label={t('minus', {dish: dish.name})} onClick={() => change(dish.key, -1)}><Minus size={16}/></button>
                  <span>{dish.quantity}</span>
                  <button type="button" aria-label={t('plus', {dish: dish.name})} onClick={() => change(dish.key, 1)}><Plus size={16}/></button>
                </div>
              </li>
            ))}
          </ul>
          <UaeCheckout total={total} allPriced={allPriced} message={message} />
        </>
      )}
    </Dialog>
  );
}
