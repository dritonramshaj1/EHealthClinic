# E-Health Clinic (React + ASP.NET Core + SQL Server + MongoDB)

Ky projekt është një **Clinic Management System** (E-Health Management) me:
- **ASP.NET Core Web API (.NET 8)**
- **SQL Server (EF Core + Identity)**
- **MongoDB** (Medical Records + Notifications + Activity Logs)
- **React (Vite)** frontend

## 1) Kërkesat (Prerequisites)
Instalo:
- .NET SDK 8
- Node.js (>= 18 / 20 recommended)
- SQL Server (LocalDB ose SQL Server Express)
- MongoDB (local ose Docker)

## 2) Konfigurimi i Backend
Shko te:
`backend/EHealthClinic.Api/appsettings.json`

Ndrysho:
- `ConnectionStrings:SqlServer` (nëse s’është localhost)
- `Mongo:ConnectionString` dhe `Mongo:Database`
- `Jwt:Key` **DUHET** të jetë një secret i gjatë (32+ chars)

### Run backend
Nga folderi `backend/EHealthClinic.Api`:
```bash
dotnet restore
dotnet ef database update
dotnet run
```

Backend default:
- HTTPS: `https://localhost:5001`
- Swagger: `https://localhost:5001/swagger`

### Default Admin (dev)
Kur backend startohet, krijohet automatikisht:
- Email: `admin@ehealth.local`
- Password: `Admin1234!`

## 3) Konfigurimi i Frontend
Shko te `frontend/` dhe krijo `.env` (mund ta kopjosh nga `.env.example`):
```bash
cp .env.example .env
```

Pastaj:
```bash
npm install
npm run dev
```

Frontend:
- `http://localhost:5173`

## 4) Login / Register
- Mund të logohesh me admin-in default.
- Ose bëj Register si Patient/Doctor/Admin (për demo).

## 5) Çfarë është ku?
### SQL Server (EF Core)
- Users / Roles (Identity)
- Doctors, Patients
- Appointments, Payments
- RefreshTokens (për refresh token rotation)

### MongoDB
- `medical_records` (historia mjekësore)
- `notifications` (njoftime)
- `activity_logs` (audit/log)

## 6) API endpoints kryesore
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/appointments`
- `POST /api/appointments` (Admin/Doctor)
- `GET /api/medical-records/me` (Patient)
- `POST /api/medical-records/{patientId}/entries` (Admin/Doctor)
- `GET /api/notifications`

---

Nëse ke problem me HTTPS cert (local), provo:
```bash
dotnet dev-certs https --trust
```
