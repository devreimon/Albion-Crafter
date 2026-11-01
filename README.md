# Albion Crafting Desk

A browser app based on the supplied copy of Nendy’s Albion workbook: 7,166 recipe variants across 39 crafting and refining categories.

## Run

Open `index.html` in a modern browser. No build step or package installation is required. For local HTTP hosting, serve this directory with any static web server.

## Features

- Search recipes and filter enchantments.
- Edit material prices, crafting settings, quantities, and net sale proceeds.
- Calculate costs from the imported workbook formulas.
- Save inputs in browser storage and export/import them as JSON.
- Flag missing inputs rather than treating them as free materials.

## GitHub Pages

After uploading these files to a repository, open **Settings → Pages**, choose **Deploy from a branch**, and select **main / (root)**. Availability depends on repository visibility and your GitHub plan. Enabling Pages publishes the app and its bundled workbook data; review that data before making it public.

## Data and limitations

The app uses a snapshot imported November 1, 2026. It does not sync with Google Sheets or live Albion market prices. Source formulas and assumptions are preserved, including any source errors. Fees absent from the source are not added. Prices and settings are stored on the current browser, not an account or server.

Source: https://docs.google.com/spreadsheets/d/1YlWjgHvWjA_gnXahtoU6U7QXOe8_S7tgiyxfqT0g898/edit

Credit for the original workbook belongs to its creator. No license for the original workbook data is asserted here.

## Files

- `index.html` — app entry point
- `style.css` — responsive layout and styles
- `app.js` — interface and browser storage
- `engine.js` — formula parser and evaluator
- `data.js` — imported workbook cells, labels, and recipe catalog

Google Fonts are requested for typography; system fonts are used if unavailable.
