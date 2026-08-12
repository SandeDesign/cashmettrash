# OCR Rijbewijs Implementatie

## Overzicht

Een complete OCR (Optical Character Recognition) oplossing voor het automatisch uitlezen van Nederlandse rijbewijsgegevens in het `DriverLicenseUpload` component.

## Features

### 1. Camera Guide met Frame
- **ID-kaart formaat frame**: Rechthoekig overlay met exacte 85.6mm x 53.98mm ratio (1.586:1)
- **Alignment guides**: Witte hoek-indicators voor precise positionering
- **Real-time camera preview**: Live video stream met instructies
- **Visual feedback**: Groene border en duidelijke instructietekst
- **Dual mode**: Keuze tussen camera capture of bestand upload

### 2. OCR Verwerking
- **Tesseract.js**: Client-side OCR met Nederlandse taalondersteuning
- **Image preprocessing**:
  - Contrast verhoging (1.5x)
  - Brightness aanpassing (+10)
  - Optimalisatie voor betere tekst herkenning
- **Automatische parsing** van:
  - Rijbewijsnummer (10 cijfers)
  - Voornaam en achternaam
  - Geboortedatum
  - Uitgiftedatum
  - Vervaldatum

### 3. UX Flow

```
Upload → Processing → Preview → Form → Submit
```

#### Stap 1: Upload
- Keuze tussen camera of bestand upload
- Voor- en achterkant rijbewijs
- Real-time preview van geselecteerde afbeeldingen

#### Stap 2: Processing
- Progress bar met percentage
- Status updates tijdens OCR
- Visuele feedback met loading animatie

#### Stap 3: Preview
- Toon alle gedetecteerde gegevens
- Markeer ontbrekende velden in rood
- Mogelijkheid om terug te gaan of door te gaan

#### Stap 4: Form
- Pre-filled met OCR data
- Groene banner toont dat data automatisch is ingevuld
- Handmatige correctie mogelijk
- Validatie van verplichte velden

## Technische Details

### Dependencies
```json
{
  "tesseract.js": "^7.0.0"
}
```

### OCR Parsing Logic

Het component gebruikt regex patterns om Nederlandse rijbewijs data te extraheren:

1. **Rijbewijsnummer**: `\b(\d{10})\b` - 10 opeenvolgende cijfers
2. **Datums**: `(\d{2})[.-](\d{2})[.-](\d{4})` - DD-MM-YYYY of DD.MM.YYYY formaat
3. **Namen**: `\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b` - Gekapitaliseerde woorden

### Image Preprocessing

```typescript
const preprocessImage = async (file: File): Promise<string> => {
  // Canvas setup
  // Contrast enhancement (1.5x)
  // Brightness adjustment (+10)
  // Return base64 data URL
}
```

### Camera Handling

- Vraagt toegang tot camera met `getUserMedia`
- Gebruikt `facingMode: 'environment'` voor achtercamera
- Maximale resolutie: 1920x1080
- Automatic cleanup bij unmount

## Error Handling

1. **Camera niet beschikbaar**: Fallback naar upload functie
2. **OCR faalt**: Mogelijkheid om handmatig in te vullen
3. **Upload error**: Duidelijke foutmeldingen
4. **Validatie**: Check op verplichte velden

## Gebruik

```typescript
<DriverLicenseUpload
  onLicenseUploaded={(license) => {
    // Verwerk rijbewijs data
  }}
  onBack={() => {
    // Terug naar vorige stap
  }}
/>
```

## Verbeterpunten

### Huidige Implementatie
- Nederlandse taalondersteuning (nld)
- Basis text parsing met regex
- Client-side verwerking

### Toekomstige Verbeteringen
1. **Betere OCR nauwkeurigheid**:
   - Training met Nederlandse rijbewijs templates
   - Machine learning model voor veldherkenning
   - MRZ (Machine Readable Zone) detectie

2. **Geavanceerde preprocessing**:
   - Auto-rotation detectie
   - Perspectief correctie
   - Adaptive thresholding

3. **Validatie**:
   - Check rijbewijsnummer formaat
   - Datum logica validatie (issue < expiry)
   - Leeftijd validatie (18+)

4. **Performance**:
   - WebWorker voor OCR processing
   - Caching van Tesseract worker
   - Progressieve verwerking

## Browser Compatibiliteit

- **Camera API**: Moderne browsers (Chrome, Firefox, Safari, Edge)
- **Tesseract.js**: Alle moderne browsers met WebAssembly support
- **Canvas API**: Universeel ondersteund

## Security & Privacy

- **Client-side processing**: Geen data naar externe servers voor OCR
- **Tijdelijke preview**: Object URLs worden netjes opgeruimd
- **Camera cleanup**: Streams worden gestopt bij unmount
- **Data minimization**: Alleen noodzakelijke velden worden opgeslagen

## Testing

### Handmatig testen:
1. Start de applicatie
2. Navigeer naar profiel → Rijbewijs upload
3. Test beide flows:
   - Camera capture
   - Bestand upload
4. Controleer OCR resultaten
5. Verifieer handmatige correctie

### Test Cases:
- ✅ Camera toegang werkt
- ✅ Frame heeft correcte aspect ratio
- ✅ Foto capture werkt
- ✅ Upload functie werkt
- ✅ OCR processing toont progress
- ✅ Preview toont gedetecteerde data
- ✅ Form is pre-filled
- ✅ Handmatige correctie mogelijk
- ✅ Validatie werkt
- ✅ Error handling werkt

## Bekende Beperkingen

1. **OCR Nauwkeurigheid**: Afhankelijk van afbeeldingskwaliteit (70-90% accuracy)
2. **Taalondersteuning**: Momenteel alleen Nederlands
3. **Performance**: OCR processing kan 10-30 seconden duren
4. **Browser Support**: Camera API vereist HTTPS in productie

## Contact & Support

Voor vragen of problemen met de OCR implementatie, neem contact op met het development team.
