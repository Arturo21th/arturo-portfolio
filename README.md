# Arturo Rosa Maduro Portfolio

Static portfolio for Arturo Rosa Maduro, focused on full-stack, mobile, and AI-assisted software projects.

## Projects featured

- Automatización 606/607 DGII
- CookieBoo
- Billing System
- Parking Management
- POS & Inventory

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## QA check

Start Chrome with DevTools enabled, then run:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/private/tmp/chrome-arturo-qa --disable-gpu http://localhost:4173
node qa-check.mjs http://localhost:4173
```
