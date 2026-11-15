const paths = {
  flame: <><path d="M12 22c-4 0-7-3-7-7 0-3 2-5 4-7 0 2 1 3 1 3 2-3 3-6 2-9 5 3 7 7 7 12 0 5-3 8-7 8Z"/><path d="M12 22c-2 0-3-2-3-4 0-2 2-4 3-5 0 2 3 3 3 5 0 2-1 4-3 4Z"/></>,
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  diagonal: <><path d="M6 18 18 6"/><path d="M8 6h10v10"/></>,
  pin: <><path d="M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 18 18 0 0 1-7.8-2.8 18 18 0 0 1-5.5-5.5 18 18 0 0 1-2.8-7.8A2 2 0 0 1 5.7 3h3a2 2 0 0 1 2 1.7l.6 2.9a2 2 0 0 1-.5 2.1L9.5 11a14 14 0 0 0 5.5 5.5l1.3-1.3a2 2 0 0 1 2.1-.5l2.9.6a2 2 0 0 1 1.7 1.6Z"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  chat: <><path d="M20 11.5a8 8 0 0 1-8 8H4l1.6-3.2A8 8 0 1 1 20 11.5Z"/><path d="M8 12h8m-8-4h6"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
};

export default function Icon({name, size = 20}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
