'use client';

import {useRouter} from 'next/navigation';
import {useRef, useState} from 'react';
import {formatOfferDate, offerLabels} from '../offers';

export default function OffersForm({offers, available}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(null);

  async function save(event, offerId) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const path = offerId ? `/api/admin/offers/${offerId}` : '/api/admin/offers';
    submitting.current = true;
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch(path, {
        method: offerId ? 'DELETE' : 'POST',
        headers: {'Content-Type': 'application/json', 'X-Admin-Password': data.get('password')},
        body: offerId ? undefined : JSON.stringify({
          kind: data.get('kind'),
          title: data.get('title'),
          details: data.get('details'),
          ends_on: data.get('ends_on') || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Could not save the offer.');
      form.reset();
      setNotice({message: result.message});
      router.refresh();
    } catch (error) {
      setNotice({error: true, message: error.message});
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="admin admin-section" id="offer-settings" aria-labelledby="offer-settings-title">
      <h2 id="offer-settings-title">Offers</h2>
      <p>Publish a discount or special occasion offer on the homepage.</p>
      {!available && <p className="error">The offers service is unavailable.</p>}
      <form onSubmit={event => save(event)}>
        <fieldset disabled={pending || !available}>
          <legend>New offer</legend>
          <label className="field">Offer type
            <select name="kind">{Object.entries(offerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
          <label className="field">Title<input name="title" maxLength={80} required /></label>
          <label className="field">Details and terms<textarea name="details" maxLength={400} rows={3} required /></label>
          <label className="field">End date (optional)<input name="ends_on" type="date" /></label>
          <p className="hint">The offer stays visible through the end date in Dubai time.</p>
          <label className="field">Admin password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="primary">Publish offer</button>
        </fieldset>
      </form>
      {notice && <p className={notice.error ? 'error' : undefined} role={notice.error ? 'alert' : 'status'}>{notice.message}</p>}
      {offers.length > 0 && (
        <>
          <h3>Published offers</h3>
          {offers.map(offer => (
            <form key={offer.id} onSubmit={event => save(event, offer.id)}>
              <fieldset disabled={pending}>
                <legend>{offer.title}</legend>
                <p>{offerLabels[offer.kind]}{offer.ends_on && ` · Ends ${formatOfferDate(offer.ends_on)}`}</p>
                <label className="field">Admin password<input name="password" type="password" autoComplete="current-password" required /></label>
                <button className="primary">Remove offer</button>
              </fieldset>
            </form>
          ))}
        </>
      )}
    </section>
  );
}
