# EHealth Clinic — Clinic Management System

EHealth Clinic is a complete system for managing medical clinics. From patient registration to billing, waiting queues, the laboratory, the pharmacy and human resources — everything in one place.

---

## What can the system do?

### For Doctors
- View their list of patients and their medical history
- Create and manage appointments
- Issue medical prescriptions
- Order laboratory tests and view the results
- View patients' uploaded documents

### For Receptionists
- Register new patients
- Manage the waiting queue
- Create and manage appointments
- Upload patient documents

### For Lab Technicians
- View test orders
- Enter test results

### For Pharmacists
- View prescriptions issued by doctors
- Manage the inventory of medicines and medical supplies

### For HR Managers
- Manage staff shifts
- Approve or reject leave requests

### For Administrators
- Manage all users and roles
- View the audit log (who did what and when)
- Manage clinic branches
- Export data to PDF, Word, Excel and CSV
- Import patients from CSV/Excel
- View analytics and reports

### For Patients
- Register on their own and view their medical history
- View their invoices and prescriptions

---

## Technologies

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite |
| **Backend** | ASP.NET Core 8 (C#) |
| **Primary database** | SQL Server (Entity Framework Core) |
| **Secondary database** | MongoDB (documents, audit, notifications) |
| **Authentication** | JWT (JSON Web Tokens) + ASP.NET Identity |
| **Real-time communication** | SignalR (WebSocket) |
| **Export** | QuestPDF (PDF), ClosedXML (Excel), OpenXML (Word) |

---

## Roles and Permissions

The system has **7 roles** with different permissions:

| Role | Description |
|------|-------------|
| `Admin` | Administrator |
| `Doctor` | Doctor |
| `Patient` | Patient |
| `Receptionist` | Receptionist |
| `LabTechnician` | Lab Technician |
| `Pharmacist` | Pharmacist |
| `HRManager` | HR Manager |

Each role can access only its own features — for example, a pharmacist cannot view HR, a doctor cannot delete users, and so on.

---

## Getting Started

### Prerequisites
- [.NET SDK 8](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- SQL Server (LocalDB or Express)
- MongoDB (local or Docker)

---

### 1. Configure the Backend

Open the file:
```
backend/EHealthClinic.Api/appsettings.json
```

Change these values to match your environment:

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
    "Key": "a-very-long-secret-at-least-32-characters",
    "Issuer": "EHealthClinic",
    "Audience": "EHealthClinicUsers"
  }
}
```

### 2. Run the Backend

```bash
cd backend/EHealthClinic.Api
dotnet restore
dotnet run
```

The backend will start at:
- API: `https://localhost:5001`
- Swagger (documentation): `https://localhost:5001/swagger`

> Database migrations run automatically when the backend starts.

#### Default Admin account (for testing)
```
Email:    admin@ehealth.local
Password: admin.1234
```

---

### 3. Configure the Frontend

```bash
cd frontend
cp .env.example .env   # if it exists, otherwise create .env manually
npm install
npm run dev
```

The frontend will be available at:
```
http://localhost:5173
```

> Make sure the API URL in `.env` points to the backend.

---

### HTTPS certificate issue (first run)?

```bash
dotnet dev-certs https --trust
```

---

## Project Structure

```
EHealthClinic/
├── frontend/                  # React application
│   └── src/
│       ├── pages/             # All application pages
│       ├── components/        # Reusable components (UI, Layout)
│       ├── api/services/      # HTTP calls to the backend
│       ├── state/             # Context (Auth, UI, Language)
│       └── styles/            # CSS (Design System, Layout, Components)
│
└── backend/
    └── EHealthClinic.Api/
        ├── Controllers/       # 22 endpoint groups (REST API)
        ├── Services/          # Business logic
        ├── Entities/          # SQL database models
        ├── Dtos/              # Data transfer objects
        ├── Mongo/Documents/   # MongoDB models
        ├── Authorization/     # RBAC with granular permissions
        └── Data/              # DbContext + SeedData
```

---

## Main Modules

| Module | What it does |
|--------|--------------|
| **Patients** | Registration, profile, medical history |
| **Appointments** | Scheduling, confirmation, cancellation |
| **Queue** | Real-time waiting queue management |
| **Prescriptions** | Issuing, approval, pharmacy |
| **Laboratory** | Test orders and results |
| **Billing** | Invoices, payments, health insurance |
| **Inventory** | Medicines and medical supplies, stock movements |
| **Human Resources** | Staff shifts, leave requests |
| **Documents** | Uploading and managing patient documents |
| **Messages** | Internal communication between staff |
| **Notifications** | Real-time notifications (SignalR WebSocket) |
| **Export/Import** | PDF, Word, Excel, CSV, JSON |
| **Audit** | Full log of every action in the system |
| **Analytics** | Dashboard with statistics and reports |
| **Branches** | Support for multiple locations/branches |

---

## Main API Endpoints

```
POST   /api/auth/register          Register a new user
POST   /api/auth/login             Log in and receive a JWT token
POST   /api/auth/refresh           Refresh the token

GET    /api/users                  List users (Admin)
POST   /api/users                  Create a user (Admin)

GET    /api/appointments           List appointments
POST   /api/appointments           Create an appointment

GET    /api/prescriptions          List prescriptions
POST   /api/prescriptions          Issue a prescription (Doctor)

GET    /api/lab/orders             Laboratory orders
POST   /api/lab/orders/{id}/results  Add results

GET    /api/invoices               List invoices
GET    /api/queue                  Current queue

GET    /api/audit                  Audit log (Admin)
GET    /api/export/{entity}        Export data

GET    /hubs/notifications         SignalR WebSocket (live notifications)
```

---

## Developers

This project was developed by the EHealth Clinic team.

- Driton Ramshaj — Backend & Architecture
- Blenda Biqkaj — Frontend & UI/UX

---

> For any technical issue, see the Swagger section (`/swagger`) for complete API documentation.
