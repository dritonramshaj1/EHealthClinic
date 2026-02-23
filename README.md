# EHealth Clinic — Sistemi i Menaxhimit të Klinikës

EHealth Clinic është një sistem i plotë për menaxhimin e klinikave mjekësore. Nga regjistrimi i pacientëve deri te faturimi, radhët e pritjes, laboratori, farmacia dhe burimet njerëzore — gjithçka në një vend.

---

## Çfarë mund të bëjë sistemi?

### Për Mjekun
- Shikon listën e pacientëve të tij dhe historinë mjekësore
- Krijon dhe menaxhon takimet (appointments)
- Lëshon receta mjekësore
- Porosit analiza laboratorike dhe shikon rezultatet
- Shikon dokumentet e ngarkuara të pacientëve

### Për Recepsionistin
- Regjistron pacientë të rinj
- Menaxhon radhën e pritjes (queue)
- Krijo dhe menaxhon takimet
- Ngarkon dokumentet e pacientëve

### Për Teknikun e Laboratorit
- Shikon urdhrat e analizave
- Plotëson rezultatet e testeve

### Për Farmacistin
- Shikon recetat e lëshuara nga mjekët
- Menaxhon inventarin e barnave dhe materialeve mjekësore

### Për HR Manager
- Menaxhon turnët e stafit
- Aprovonjë ose refuzon kërkesat për leje

### Për Administratorin
- Menaxhon të gjithë përdoruesit dhe rolet
- Shikon regjistrin e auditit (kush ka bërë çfarë dhe kur)
- Menaxhon degët e klinikës
- Eksporton të dhëna në PDF, Word, Excel, CSV
- Importon pacientë nga CSV/Excel
- Shikon analitikë dhe raporte

### Për Pacientin
- Regjistrohet vetë dhe shikon historinë e tij mjekësore
- Shikon faturat dhe recetat e tij

---

## Teknologjitë

| Shtresa | Teknologjia |
|---------|-------------|
| **Frontend** | React 18 + Vite |
| **Backend** | ASP.NET Core 8 (C#) |
| **Databaza kryesore** | SQL Server (Entity Framework Core) |
| **Databaza dytësore** | MongoDB (dokumente, audit, njoftime) |
| **Autentifikim** | JWT (JSON Web Tokens) + ASP.NET Identity |
| **Komunikim real-time** | SignalR (WebSocket) |
| **Export** | QuestPDF (PDF), ClosedXML (Excel), OpenXML (Word) |

---

## Rolet dhe Lejet

Sistemi ka **7 role** me leje të ndryshme:

| Roli | Shqip |
|------|-------|
| `Admin` | Administrator |
| `Doctor` | Mjek |
| `Patient` | Pacient |
| `Receptionist` | Recepsionist |
| `LabTechnician` | Teknik Laboratori |
| `Pharmacist` | Farmacist |
| `HRManager` | Menaxher HR |

Çdo rol ka akses vetëm te funksionet e tij — p.sh. farmacisti nuk mund të shikojë HR-in, mjeku nuk mund të fshijë përdorues, etj.

---

## Si ta nisësh projektin

### Kërkesat paraprake
- [.NET SDK 8](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- SQL Server (LocalDB ose Express)
- MongoDB (lokal ose Docker)

---

### 1. Konfiguro Backend

Hap skedarin:
```
backend/EHealthClinic.Api/appsettings.json
```

Ndrysho këto vlera sipas mjedisit tënd:

```json
{
  "ConnectionStrings": {
    "SqlServer": "Server=localhost;Database=EHealthClinic;Trusted_Connection=True;"
  },
  "Mongo": {
    "ConnectionString": "mongodb://localhost:27017",
    "Database": "EHealthClinic"
  },
  "Jwt": {
    "Key": "nje-secret-shume-i-gjate-32-karaktere-minimum",
    "Issuer": "EHealthClinic",
    "Audience": "EHealthClinicUsers"
  }
}
```

### 2. Nis Backend

```bash
cd backend/EHealthClinic.Api
dotnet restore
dotnet run
```

Backend do të nisë te:
- API: `https://localhost:5001`
- Swagger (dokumentacion): `https://localhost:5001/swagger`

> Migrimi i bazës së të dhënave bëhet automatikisht kur backend startohet.

#### Llogaria default e Adminit (për testim)
```
Email:    admin@ehealth.local
Fjalëkalim: admin.1234
```

---

### 3. Konfiguro Frontend

```bash
cd frontend
cp .env.example .env   # nëse ekziston, ose krijo .env manual
npm install
npm run dev
```

Frontend do të jetë i aksesueshëm te:
```
http://localhost:5173
```

> Sigurohu që URL-ja e API-t në `.env` të tregojë drejt backend-it.

---

### Problem me certifikatën HTTPS (herë të parë)?

```bash
dotnet dev-certs https --trust
```

---

## Struktura e Projektit

```
EHealthClinic/
├── frontend/                  # React aplikacioni
│   └── src/
│       ├── pages/             # Të gjitha faqet e aplikacionit
│       ├── components/        # Komponentët e ripërdorshëm (UI, Layout)
│       ├── api/services/      # Thirrjet HTTP drejt backend-it
│       ├── state/             # Context (Auth, UI, Language)
│       └── styles/            # CSS (Design System, Layout, Komponente)
│
└── backend/
    └── EHealthClinic.Api/
        ├── Controllers/       # 22 endpoint grupe (REST API)
        ├── Services/          # Logjika e biznesit
        ├── Entities/          # Modelet e bazës SQL
        ├── Dtos/              # Objektet e transferit të të dhënave
        ├── Mongo/Documents/   # Modelet MongoDB
        ├── Authorization/     # RBAC me leje granulare
        └── Data/              # DbContext + SeedData
```

---

## Modulet Kryesore

| Moduli | Çfarë bën |
|--------|-----------|
| **Pacientët** | Regjistrim, profil, histori mjekësore |
| **Takimet** | Caktim, konfirmim, anulim |
| **Radha** | Menaxhim i radhës së pritjes në kohë reale |
| **Recetat** | Lëshim, aprovim, farmaci |
| **Laboratori** | Urdhrat e testeve dhe rezultatet |
| **Faturimi** | Fatura, pagesa, sigurimi shëndetësor |
| **Inventari** | Barna dhe materiale mjekësore, lëvizje stoku |
| **Burimet Njerëzore** | Turnët e stafit, kërkesat për leje |
| **Dokumentet** | Ngarkim dhe menaxhim i dokumenteve të pacientëve |
| **Mesazhet** | Komunikim i brendshëm midis stafit |
| **Njoftime** | Njoftime në kohë reale (SignalR WebSocket) |
| **Eksport/Import** | PDF, Word, Excel, CSV, JSON |
| **Audit** | Regjistrim i plotë i çdo veprimi në sistem |
| **Analitikë** | Dashboard me statistika dhe raporte |
| **Degët** | Mbështetje për shumë lokacione/degë |

---

## API Endpoints kryesore

```
POST   /api/auth/register          Regjistro përdorues të ri
POST   /api/auth/login             Logohu dhe merr token JWT
POST   /api/auth/refresh           Rifresko token-in

GET    /api/users                  Lista e përdoruesve (Admin)
POST   /api/users                  Krijo përdorues (Admin)

GET    /api/appointments           Lista e takimeve
POST   /api/appointments           Krijo takim

GET    /api/prescriptions          Lista e recetave
POST   /api/prescriptions          Lësho recetë (Mjek)

GET    /api/lab/orders             Urdhrat e laboratorit
POST   /api/lab/orders/{id}/results  Shto rezultate

GET    /api/invoices               Lista e faturave
GET    /api/queue                  Radha aktuale

GET    /api/audit                  Regjistri i auditit (Admin)
GET    /api/export/{entity}        Eksporto të dhëna

GET    /hubs/notifications         SignalR WebSocket (njoftime live)
```

---

## Zhvilluesit

Projekti është zhvilluar nga ekipi i EHealth Clinic.

- Driton Ramshaj — Backend & Arkitekturë
- Blenda Biqkaj — Frontend & UI/UX

---

> Për çdo problem teknik, shiko seksionin Swagger (`/swagger`) për dokumentacion të plotë të API-t.
