# Pak Food restaurant website

A Next.js restaurant website with a guest chat backed by a Python FAQ assistant running Llama locally through Ollama.

## Run locally

Start Ollama and download the model once.

```sh
ollama pull llama3.2:3b
```

If Ollama is not already running, start it with `ollama serve`. Configure the root `.env` as needed. The chatbot does not require an OpenAI key.

```dotenv
OLLAMA_MODEL=llama3.2:3b
OLLAMA_HOST=http://127.0.0.1:11434
FAQ_ADMIN_PASSWORD=
RESTAURANT_PHONE=
```

Choose a strong admin password. The optional restaurant phone number should include the country code, starting with `+`, without spaces. Restart the Python server after editing its settings.

Run the backend from the project directory.

```sh
./crewai-env/bin/python -m uvicorn web_api:app --host 127.0.0.1 --port 8000
```

Run the frontend in a second terminal from the same directory.

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open http://localhost:3000 for the restaurant website and select **Ask Pak Food** to open the chat. Use http://localhost:3000/admin to manage the FAQ and branding. The frontend forwards requests to the Python server. To change its upstream, set the server-side `CREW_API_URL` for Next.js.

## Replace the FAQ

On the admin page, select **Upload PDF** or **Add PDF URL**, enter your admin password, then select **Replace FAQ**. URL import uses `curl` and requires a direct public HTTPS PDF URL. PDFs must be unlocked, contain selectable text, and fit within 5 MB, 20 pages, and 30,000 extracted characters. The last valid replacement is stored in `db/active_faq.pdf` and survives restarts. When no replacement has been uploaded, the app uses the default FAQ configured in `frontend/restaurant.json`. If the active FAQ is still the Daily Dish sample, upload `output/pdf/Pakfood_FAQ.pdf` to give the assistant the same restaurant information as the website.

The assistant reads the active FAQ PDF as retrieval context and generates the answer locally. It refers guests to staff for details the FAQ does not provide. Chat retains up to eight recent messages as context during the current page session. Guests can start a new chat to clear it. The CLI remains available with `./crewai-env/bin/python multiagentcrew.py`.

For a customer-facing deployment, serve Next.js over HTTPS, keep the Python backend private, and give the backend a persistent writable volume for `db/`. Review the FAQ and restaurant contact details before sharing the chat URL.

## Restaurant branding

Edit `frontend/restaurant.json` to change the portal name, default contact phone, and the project-relative path to the default PDF. Restart Python and restart Next.js in development or rebuild it for production after editing. An uploaded FAQ takes precedence over the default PDF.

Use **Restaurant branding** on the admin page to save a display name or upload a PNG,
JPEG, or WebP logo up to 2 MB. Brand settings use the FAQ admin password and are stored
in `db/restaurant_branding.sqlite3`. Saved settings take precedence over the configured
portal name and default logo and appear on the next page load without a restart.

## Publish menu items

Open `/admin`, select **Menu items**, and enter the dish name and description. You can add a price in display format (for example, AED 25) and a PNG, JPEG, or WebP photo up to 2 MB. Use the existing admin password and select **Publish dish**. New items appear alongside the featured dishes on the restaurant site and are stored in `db/restaurant_menu.sqlite3`.

Use **Name and logo** in the same panel to update the website and chat branding. The chatbot's reference material is managed under **Chatbot FAQ**.

## Publish offers

Open `/admin` and select **Offers**. Choose **Discount** or **Special occasion**, enter the title and terms, and publish with the existing admin password. An optional end date keeps the offer visible through that day in Dubai time. Use **Remove offer** to take it down sooner. The homepage shows the Offers section when at least one offer is active.

## Storefront styling and content

- Edit the dark and light CSS variables at the top of `frontend/app/restaurant.css` to change the palette.
- Change the local `next/font` font files and variables in `frontend/app/layout.js` to change typography.
- Add menu items through admin as before. Use `dishDetails` in `frontend/app/storefront-content.js` to assign regional categories, spice levels, or verified PKR prices. The key is the ID of an uploaded dish or the name of a featured dish. Saved prices such as `AED 25` remain visible in their original currency. A saved price such as `PKR 1200` contributes to the PKR order total.
- Add actual guest reviews to `reviews` in `frontend/app/storefront-content.js` to show the carousel.
- Set `whatsapp` in `frontend/restaurant.json` to the restaurant’s WhatsApp-enabled number in international format. The storefront uses the configured Dubai restaurant phone when this field is omitted. The WhatsApp links prepare order and reservation enquiries for staff to confirm.

## UAE checkout and localization

The storefront uses `next-intl` for English and Arabic. The language switch keeps the same URL and sets RTL for Arabic. Admin-authored descriptions, offers, and FAQ content display as entered. The featured dishes have Arabic translations in `frontend/app/storefront-content.js`.

Checkout uses AED. The listed menu prices and configured delivery fees are treated as VAT-inclusive. With `uae.vatRate` set to 5, the tax component is gross × 5 ÷ 105, rounded to fils. Confirm the restaurant’s VAT treatment before going live; this checkout summary does not issue tax invoices.

Configure the following in `frontend/restaurant.json` and rebuild Next.js:

- `whatsapp`: the restaurant’s WhatsApp-enabled UAE number, such as `+9715XXXXXXXX`. The storefront falls back to the existing restaurant phone.
- `uae.openingHours`: actual Dubai-local hours keyed by `mon` through `sun`. Example format: `{"mon":[["12:00","23:00"]],"tue":[["17:00","02:00"]]}`. An omitted day in a configured schedule is closed. Leave the schedule null until confirmed.
- `uae.deliveryFees`: AED rates keyed by emirate slug. Example format: `{"dubai":{"default":12,"areas":{"Deira":8}}}`. Omit a rate to have staff quote the fee. The area rate overrides the emirate default.
- `uae.ramadan.enabled` and `uae.ramadan.hours`: turn on the Ramadan greeting and use a separate Dubai-time schedule when enabled.
- `uae.tradeLicense`, `uae.halalVerified`, and `uae.foodSafetyGrade`: enter verified details to publish them in the footer.
- `uae.talabatUrl` and `uae.deliverooUrl`: enter the restaurant’s actual listing URLs.
- `uae.directPromotion`: an object with `en` and `ar` promotion terms to display the direct-order savings message.

For the embedded Google Maps pin picker, set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `frontend/.env.local` before building. Restrict this browser key to the Maps JavaScript API and your allowed website referrers. Set `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` to your map ID for production. Without a key, customers can open Google Maps and paste their pin’s share link in checkout.

Cards, Apple Pay, and Google Pay are payment preferences sent in the WhatsApp enquiry until a payment provider is integrated. Checkout collects no card data and charges no payment. Cash is available as a preference, and Tabby and Tamara are marked coming soon.
