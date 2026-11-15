'use client';

import {useRouter} from 'next/navigation';
import {useRef, useState} from 'react';

function encodePhoto(file) {
  if (!file?.size) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the selected photo.'));
    reader.readAsDataURL(file);
  });
}

export default function MenuForm({items, available}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(null);

  async function publish(event) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const photo = data.get('photo');
    if (photo.size > 2 * 1024 * 1024) {
      setNotice({error: true, message: 'Choose a photo no larger than 2 MB.'});
      return;
    }

    submitting.current = true;
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': data.get('password'),
        },
        body: JSON.stringify({
          name: data.get('name'),
          description: data.get('description'),
          price: data.get('price'),
          image: await encodePhoto(photo),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Could not publish the menu item.');
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
    <section className="admin admin-section" id="menu-settings" aria-labelledby="menu-settings-title">
      <h2 id="menu-settings-title">Menu items</h2>
      <p>Add a dish to the restaurant website. It appears in the menu as soon as you publish it.</p>
      {!available && <p className="error">The menu service is unavailable. Check that the backend is running.</p>}
      <form onSubmit={publish}>
        <fieldset disabled={pending || !available}>
          <legend>New menu item</legend>
          <label className="field">Dish name<input name="name" maxLength={80} required /></label>
          <label className="field">Description<textarea name="description" maxLength={400} rows={3} required /></label>
          <label className="field">Price (optional)<input name="price" maxLength={32} placeholder="AED 25" /></label>
          <label className="field">Photo (optional)<input name="photo" type="file" accept="image/png,image/jpeg,image/webp" /></label>
          <p className="hint">PNG, JPEG, or WebP up to 2 MB.</p>
          <label className="field">Admin password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="primary">{pending ? 'Publishing…' : 'Publish dish'}</button>
        </fieldset>
      </form>
      {notice && <p className={notice.error ? 'error' : undefined} role={notice.error ? 'alert' : 'status'}>{notice.message}</p>}
      {items.length > 0 && (
        <>
          <h3>Added dishes</h3>
          <ul className="admin-menu-list">
            {items.map(item => <li key={item.id}><strong>{item.name}</strong>{item.price && <span>{item.price}</span>}</li>)}
          </ul>
        </>
      )}
    </section>
  );
}
