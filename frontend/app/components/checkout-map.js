'use client';

import {useEffect, useRef, useState} from 'react';
import Script from 'next/script';
import {useTranslations} from 'next-intl';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function CheckoutMap({onPin}) {
  const t = useTranslations();
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const container = useRef(null);
  const select = useRef(onPin);

  useEffect(() => {select.current = onPin;}, [onPin]);
  useEffect(() => {
    if (!show || !ready) return;
    let mounted = true;
    let listener;
    let marker;
    async function load() {
      try {
        const maps = window.google.maps;
        const [{Map}, {AdvancedMarkerElement}] = await Promise.all([
          maps.importLibrary('maps'), maps.importLibrary('marker'),
        ]);
        if (!mounted) return;
        const map = new Map(container.current, {
          center: {lat: 25.268, lng: 55.317}, zoom: 12,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
          streetViewControl: false, mapTypeControl: false,
        });
        listener = map.addListener('click', event => {
          if (!event.latLng) return;
          const point = event.latLng.toJSON();
          if (!marker) marker = new AdvancedMarkerElement({map});
          marker.position = point;
          select.current(`https://www.google.com/maps/search/?api=1&query=${point.lat.toFixed(6)},${point.lng.toFixed(6)}`);
        });
      } catch {
        if (mounted) setFailed(true);
      }
    }
    load();
    return () => {
      mounted = false;
      listener?.remove();
      if (marker) marker.map = null;
    };
  }, [show, ready]);

  if (!apiKey) return null;
  return <div>
    <button className="notice-link" type="button" aria-expanded={show} onClick={() => setShow(value => !value)}>{t('showMap')}</button>
    {show && <>
      <Script id="google-maps-checkout" src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`}
        onReady={() => setReady(true)} onError={() => setFailed(true)} />
      {failed ? <p role="status">{t('mapUnavailable')}</p> : <div className="checkout-map" ref={container} aria-label={t('pin')} />}
    </>}
  </div>;
}
