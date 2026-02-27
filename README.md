# Core Web Vitals - Monthly Report

Dieses Projekt generiert einen monatlichen Verlauf der Core Web Vitals (LCP, CLS, INP) für eine angegebene URL basierend auf der **Chrome User Experience Report (CrUX) History API**.

Es erstellt gestapelte Balkendiagramme (Good / Needs Improvement / Poor), ähnlich wie CrUX Vis oder Google Search Console.

## 🚀 Installation

1. Projektordner öffnen:
   ```bash
   cd cwv-monthly-report
   ```

2. Abhängigkeiten installieren (optional, nur für Dev):
   ```bash
   npm install
   ```
   *Hinweis: Das Skript nutzt native Node.js `fetch` (ab Node 18+).*

## 🔑 API Key einrichten

Um echte Daten von Google abzurufen, benötigst du einen **CrUX API Key**:
1. Erstelle einen Key hier: [Get CrUX API Key](https://developers.google.com/web/tools/chrome-user-experience-report/api/getting-started)
2. Setze den Key als Umgebungsvariable oder trage ihn direkt in `fetch_history.js` ein.

```bash
export CRUX_API_KEY="DEIN_API_KEY_HIER"
```

## 📊 Daten abrufen

Führe das Skript aus, um die historischen Daten zu laden:

```bash
node fetch_history.js
```

*Ohne API Key generiert das Skript **Mock-Daten** zu Demonstrationszwecken.*

Die Daten werden in `data/history.json` gespeichert.

## 📈 Report ansehen

Starte einen lokalen Webserver, um den Report zu sehen (wegen CORS-Richtlinien für JSON-Dateien):

```bash
# Python 3
python3 -m http.server 8080

# Oder npx
npx serve .
```

Öffne dann `http://localhost:8080` in deinem Browser.

## ⚙️ Konfiguration

In `fetch_history.js` kannst du oben die Konfiguration anpassen:

```javascript
const CONFIG = {
    origin: 'https://www.canyon.com',
    formFactor: 'PHONE', // oder 'DESKTOP', 'TABLET'
    // ...
};
```
