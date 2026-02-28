# Performance Dashboard

Ein automatisiertes Dashboard, das die Web-Performance von **Canyon** und **Specialized** über die letzten 12 Monate trackt, vergleicht und visualisiert.

---

## Was ist das?

Dieses Projekt erstellt **monatliche Berichte** zu den drei wichtigsten Google Core Web Vitals Metriken – für beide Fahrradmarken im Direktvergleich:

- **LCP** (Largest Contentful Paint) – Ladegeschwindigkeit
- **CLS** (Cumulative Layout Shift) – Visuelle Stabilität  
- **INP** (Interaction to Next Paint) – Interaktivität

---

## Zwei Ansichten

Das Dashboard bietet zwei verschiedene Perspektiven:

### 1. Core Web Vitals History (Solo-Ansicht)

Zeigt die Performance einer einzelnen Marke im Detail an.

**Features:**
- **Brand-Auswahl:** Wechsle zwischen Canyon 🚴 und Specialized ⚡
- **Geräte-Auswahl:** Mobile 📱 vs Desktop 💻 mit einem Klick
- **Detaillierte Charts:** Verteilung nach Good/Needs Improvement/Poor als gestapelte Balken
- **PDF Export:** Download des aktuellen Reports

**Was die Charts zeigen:**
- 🟢 **Good** (Gut) – User haben eine schnelle, stabile Erfahrung
- 🟡 **Needs Improvement** (Verbesserungsbedürftig) – Mäßige Erfahrung
- 🔴 **Poor** (Schlecht) – Langsame oder instabile Erfahrung

### 2. Canyon vs Specialized (Vergleichs-Ansicht)

Zeigt beide Marken direkt nebeneinander als **Linien-Diagramme**.

**Features:**
- **Direkter Vergleich:** Beide Marken im selben Chart
- **Farbkodierung:**
  - Canyon: Dunkelgrau (#333333)
  - Specialized: Rot (#E32636)
- **Metric-Fokus:** Zeigt den "% Good" Verlauf über 12 Monate
- **Trend-Erkennung:** Sofort erkennbar, welche Marke performanter ist

---

## Für wen ist das gedacht?

Für Marketing-Teams, SEO-Manager, Produktmanager und Website-Verantwortliche, die:

- Die Website-Performance beider Marken im Blick behalten wollen
- Benchmarks zwischen Konkurrenten erstellen möchten
- Trends über Monate verfolgen möchten
- Schnell erkennen wollen, ob Optimierungen wirken
- Reports für Stakeholder erstellen müssen

---

## Wie funktioniert es?

### Datenquelle

Die Daten kommen direkt aus dem **Chrome User Experience Report (CrUX)** – echte Nutzerdaten von Millionen Chrome-Browsern weltweit. Google erfasst anonymisiert, wie schnell Websites bei realen Nutzern laden.

### Automatisierung (BEIDE Marken)

Ein **GitHub Action Workflow** läuft automatisch:

- **Wann?** Am 1. jeden Monats (ca. 8:00 Uhr)
- **Was macht er?** Holt die neuesten Daten von Google für BEIDE Domains und aktualisiert die Charts
- **Wie oft?** Einmal pro Monat automatisch, aber auch manuell startbar

**Vier Datensätze:** Der Workflow holt automatisch:
1. Canyon Mobile (`https://www.canyon.com`)
2. Canyon Desktop (`https://www.canyon.com`)
3. **Specialized Mobile (`https://www.specialized.com`)**
4. **Specialized Desktop (`https://www.specialized.com`)**

### Daten-Verarbeitung

**Problemlösung:** Google liefert Daten wöchentlich. Damit im Chart nicht 4x "November" steht:

1. **Aggregation:** Alle Wochen-Daten eines Monats werden zusammengefasst
2. **Nimm den aktuellsten:** Falls mehrere Wochen-Daten für einen Monat existieren, wird die aktuellste Woche genommen
3. **Speichern:** Das Ergebnis wird als "Monats-Daten" gespeichert

**Speicherlogik:**
- Neue Daten werden angehängt (nicht überschrieben)
- Ältere Daten bleiben erhalten
- Immer nur die letzten 12 Monate werden im Dashboard angezeigt

### Archivierung

Jeden Monat wird eine Kopie der Daten im `archive/`-Ordner gespeichert. Das dient als Backup und ermöglicht historische Analysen über mehrere Jahre.

---

## Wichtige Hinweise

### 1. Erstaufruf
Beim ersten Deployment müssen die Daten erst einmal generiert werden. Das geschieht automatisch mit dem ersten Workflow-Lauf (dauert ca. 1-2 Minuten).

### 2. Daten-Verzögerung
Google braucht ca. 28 Tage, um Daten zu sammeln und zu veröffentlichen. Der Bericht für Januar ist also erst Ende Februar/Anfang März vollständig verfügbar.

### 3. Maximale Historie
Die Google API liefert maximal ca. 6 Monate Historie auf einmal. Durch die monatliche Speicherung bauen wir aber langsam einen vollständigen 12-Monats-Verlauf auf.

### 4. URL-Konfiguration
Standardmäßig tracken wir:
- `https://www.canyon.com`
- `https://www.specialized.com`

Das kann im Workflow geändert werden (siehe `.github/workflows/deploy.yml`).

---

## Technische Details

### Frontend & Hosting
- **Frontend:** HTML/JavaScript mit Chart.js für die Visualisierung
- **Hosting:** GitHub Pages (kostenlos, automatisch deployed vom `main`-Branch)
- **Daten-Format:** JSON-Dateien, die monatlich aktualisiert werden
- **Rendering:** Client-Side, kein Backend nötig
- **Tab-Navigation:** CSS/JS-basiertes View-Switching
- **Caching:** Cache-Busting für JSON-Dateien um Browser-Cache-Probleme zu vermeiden

### Chrome UX Report (CrUX) API

Die Daten kommen von Googles offizieller **CrUX API v1**.

**Wo bekommt man den API Key?**

1. **Google Cloud Console** öffnen: https://console.cloud.google.com/
2. Ein Projekt erstellen (oder bestehendes nutzen)
3. **Navigation:** `APIs & Services` → `Library`
4. Nach "Chrome UX Report API" suchen
5. **Aktivieren** klicken (Enable)
6. **Navigation:** `APIs & Services` → `Credentials`
7. Auf **Create Credentials** → **API key** klicken
8. Der Key wird angezeigt und kann kopiert werden

**Wichtig:** Für Produktionsumgebungen sollte man den Key auf bestimmte Domains/IPs einschränken (über `Restrict key` in den Credentials).

**Wo trägt man den Key ein?**

Der Key wird **NICHT** im Code gespeichert (Sicherheitsrisiko), sondern als **GitHub Secret**:

1. GitHub Repository öffnen
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
4. **Name:** `CRUX_API_KEY`
5. **Value:** Dein kopiierter API Key
6. **Add secret**

Der Workflow liest den Key automatisch über `secrets.CRUX_API_KEY` aus.

**API Limits & Kosten**
- **Kosten:** Die CrUX API ist komplett **kostenlos**
- **Quota:** 1.500 Anfragen pro Tag pro Projekt
- **Rate Limit:** Keine strikte Begrenzung, aber bei Massenabfragen sollte man 1 Sekunde Pause zwischen Calls einbauen

Für unseren Use Case (ca. 4 API-Calls pro Monat für beide Marken × 2 Geräte) sind wir weit unter dem Limit.

**Daten-Verfügbarkeit**
- Google sammelt Daten über 28 Tage und veröffentlicht dann
- Die API liefert historische Daten der letzten ~25 Wochen (ca. 6 Monate)
- Ältere Daten müssen über das Archiv-System oder selbst gespeichert werden

---

## Support & Anpassungen

**Manuellen Report erstellen:**
1. GitHub Actions öffnen
2. "Deploy Canyon CWV Report" auswählen
3. "Run workflow" klicken
4. Nach ca. 1 Minute ist die Seite aktualisiert

**PDF erstellen:**
1. Dashboard öffnen
2. Gewünschtes Gerät auswählen (Mobile/Desktop)
3. Auf "Core Web Vitals History"-Tab (Solo-Ansicht)
4. Auf "PDF Export" klicken
5. Fertig – die PDF enthält alle drei Charts

**Neue URL hinzufügen:**
1. In `.github/workflows/deploy.yml` einen neuen Step hinzufügen
2. `ORIGIN` und `OUTPUT_FILE` anpassen
3. Workflow manuell starten
4. HTML erweitern für neue Tab-Navigation (optional)

---

## Change Log

**Februar 2026**
- ✅ **Vergleichs-Ansicht:** Canyon vs Specialized als Linien-Diagramme
- ✅ **Automatische Updates:** Jetzt für beide Marken (4 statt 2 API-Calls)
- ✅ **UI Updates:** Titel geändert zu "Performance Dashboard", Tab umbenannt
- ✅ **Branch-Konsolidierung:** Alles jetzt auf einem Branch (`main`)
- ✅ **Code-Qualität:** Fehlerbehandlung verbessert, Cache-Busting hinzugefügt

**Januar 2026**
- Initial release mit Canyon-Daten

---

*Projekt erstellt: Februar 2026 | Automatisiert via GitHub Actions | Daten: Google CrUX | Hosting: GitHub Pages*
