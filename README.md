# NexusERP — AI-Powered Multi-Tenant ERP System

A complete enterprise-grade ERP platform with AI capabilities powered by Groq.

## Features
- Multi-tenant architecture (multiple organizations, isolated data)
- AI-powered assistant (Groq LLaMA 3)
- Employee management with RBAC
- Real-time attendance tracking (Socket.IO)
- Task/Document management with Kanban board
- Payroll generation & management
- Leave management system
- Internal chat system
- Analytics & reporting
- Super Admin panel
- Email notifications (SMTP)

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Socket.IO
- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion
- **AI**: Groq (LLaMA 3)
- **Auth**: JWT + Refresh Tokens

## Setup

### Backend
```bash
cd backend
npm install
# Edit .env with your credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Login Credentials
- **Super Admin**: Use the email and password you provided
- **Organization owners**: Register at /register
- **Employees**: Login with company code + email + password

## Ports
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
