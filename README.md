# Core Web Vitals - Monthly Report

Ein automatisiertes Dashboard, das die Web-Performance von canyon.com über die letzten 12 Monate trackt und visualisiert.

## Was ist das?

Dieses Projekt erstellt **monatliche Berichte** zu den drei wichtigsten Google Core Web Vitals Metriken:
- **LCP** (Largest Contentful Paint) – Ladegeschwindigkeit
- **CLS** (Cumulative Layout Shift) – Visuelle Stabilität  
- **INP** (Interaction to Next Paint) – Interaktivität

## Für wen ist das gedacht?

Für Marketing-Teams, SEO-Manager und Website-Verantwortliche, die:
- Die Website-Performance im Blick behalten wollen
- Trends über Monate verfolgen möchten
- Schnell erkennen wollen, ob Optimierungen wirken
- Reports für Stakeholder erstellen müssen

## Was zeigt das Dashboard?

### Hauptbereiche

**1. Geräte-Auswahl**
Oben kannst du mit einem Klick zwischen "📱 Mobile" und "💻 Desktop" wechseln. Die Daten werden automatisch für das gewählte Gerät geladen.

**2. Drei Performance-Charts**
Jeder Chart zeigt die Verteilung der Besucher nach drei Kategorien:
- 🟢 **Good** (Gut) – User haben eine schnelle, stabile Erfahrung
- 🟡 **Needs Improvement** (Verbesserungsbedürftig) – Mäßige Erfahrung
- 🔴 **Poor** (Schlecht) – Langsame oder instabile Erfahrung

**3. 12-Monats-Verlauf**
Die Balken zeigen immer die letzten 12 Monate an (z.B. Jan 25 - Jan 26). Ältere Daten werden automatisch ausgeblendet, um die Übersicht zu bewahren.

**4. PDF Export**
Mit einem Klick kannst du den aktuellen Report als PDF herunterladen – inklusive aktueller Geräte-Einstellung.

**5. Deep Dive Link**
Unten findest du einen Link zu "CrUX Vis", Googles offiziellem Tool für detaillierte Analysen.

## Wie funktioniert es?

### Datenquelle
Die Daten kommen direkt aus dem **Chrome User Experience Report (CrUX)** – das sind echte Nutzerdaten von Millionen Chrome-Browsern weltweit. Google erfasst anonymisiert, wie schnell Websites bei realen Nutzern laden.

### Automatisierung
Ein **GitHub Action Workflow** läuft automatisch:
- **Wann?** Am 1. jeden Monats (ca. 8:00 Uhr)
- **Was macht er?** Holt die neuesten Daten von Google und aktualisiert die Charts
- **Wie oft?** Einmal pro Monat automatisch, aber auch manuell startbar

**Zwei Datensätze:**
Der Workflow holt automatisch beide Versionen:
1. Mobile Daten (Phones)
2. Desktop Daten (Computer)

### Daten-Verarbeitung

**Problemlösung:** Google liefert Daten wöchentlich. Damit im Chart nicht 4x "November" steht, sondern nur 1x, passiert Folgendes:

1. **Aggregation:** Alle Wochen-Daten eines Monats werden zusammengefasst
2. **Nimm den aktuellsten:** Falls mehrere Wochen-Daten für einen Monat existieren, wird automatisch die aktuellste Woche genommen
3. **Speichern:** Das Ergebnis wird als "Monats-Daten" gespeichert

**Speicherlogik:**
- Neue Daten werden angehängt (nicht überschrieben)
- Ältere Daten bleiben erhalten
- Immer nur die letzten 12 Monate werden angezeigt

### Archivierung
Jeden Monat wird eine Kopie der Daten im `archive/`-Ordner gespeichert. Das dient als Backup und ermöglicht später historische Analysen über mehrere Jahre.

## Wichtige Hinweise

### 1. Erstaufruf
Beim ersten Deployment müssen die Daten erst einmal generiert werden. Das geschieht automatisch mit dem ersten Workflow-Lauf (dauert ca. 1-2 Minuten).

### 2. Daten-Verzögerung
Google braucht ca. 28 Tage, um Daten zu sammeln und zu veröffentlichen. Der Bericht für Januar ist also erst Ende Februar/Anfang März vollständig verfügbar.

### 3. Maximale Historie
Die Google API liefert maximal ca. 6 Monate Historie auf einmal. Durch die monatliche Speicherung bauen wir aber langsam einen vollständigen 12-Monats-Verlauf auf.

### 4. URL-Konfiguration
Standardmäßig tracken wir `https://www.canyon.com`. Das kann im Workflow geändert werden (siehe `fetch_history.js`, Variable `CONFIG.origin`).

## Technische Details (kurz)

### Frontend & Hosting
- **Frontend:** HTML/JavaScript mit Chart.js für die Visualisierung
- **Hosting:** GitHub Pages (kostenlos, automatisch deployed)
- **Daten-Format:** JSON-Dateien, die monatlich aktualisiert werden
- **Rendering:** Client-Side, kein Backend nötig

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
- **Rate Limit:** Keine strikte Begrenzung, aber bei Massenabfragen sollte man 1 Sekunde Pause zwischen Calls einbauen (wird vom Tool bereits gemacht)

Für unseren Use Case (ca. 2 API-Calls pro Monat für Mobile + Desktop) sind wir weit unter dem Limit.

**Daten-Verfügbarkeit**
- Google sammelt Daten über 28 Tage und veröffentlicht dann
- Die API liefert historische Daten der letzten ~25 Wochen (ca. 6 Monate)
- Ältere Daten müssen über das Archiv-System oder selbst gespeichert werden

## Support & Anpassungen

**Neue URL tracken:**
1. In `.github/workflows/fetch-cron.yml` die `origin` Variable anpassen
2. Workflow manuell starten
3. Fertig

**Manuellen Report erstellen:**
1. GitHub Actions öffnen
2. "Fetch Monthly CWV Data" oder "Manual Fetch" auswählen
3. "Run workflow" klicken
4. Nach ca. 1 Minute ist die Seite aktualisiert

**PDF erstellen:**
1. Dashboard öffnen
2. Gewünschtes Gerät auswählen (Mobile/Desktop)
3. Auf "PDF Export" klicken
4. Fertig – die PDF enthält alle drei Charts

---

*Projekt erstellt: Februar 2026 | Automatisiert via GitHub Actions | Daten: Google CrUX*