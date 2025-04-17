# EAF Builder

**AI-Powered Expense Authorization Form Generator**

## 📌 Introduction

The EAF Builder is an AI-powered web application designed to streamline the generation of Expense Authorization Forms (EAFs) for local governments and First Nation communities applying for emergency management funds. This README provides a comprehensive guide to setting up, deploying, and managing the application.

---

## ⚙️ Prerequisites

Before installation, ensure the following tools and accounts are available:

- [Node.js (v18+)](https://nodejs.org/en/)
- [Python 3.9+](https://www.python.org/downloads/)
- [Git](https://git-scm.com/downloads)
- [Docker](https://www.docker.com/products/docker-desktop/) & [Docker Compose](https://docs.docker.com/compose/)
- [Firebase Project](https://console.firebase.google.com/) for:
  - Authentication (OAuth, Email/Password)
  - Firestore (NoSQL database)
  - Cloud Storage (for EAF documents)
- [OpenAI API Key](https://platform.openai.com/signup) with GPT-4o access

To set up Firebase:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable Authentication (Google sign-in and Email/Password).
3. Set up Firestore and Cloud Storage.
4. Generate web app credentials for your frontend `.env`.

---

## 🗂 Repository Structure

```
eaf-builder/
├── frontend/           # React + Tailwind CSS frontend
├── backend/            # FastAPI backend and AI model integration
├── docker-compose.yml  # Container orchestration
└── .env                # Environment variables
```

---

## 🔐 Environment Configuration

Create `.env` files in both `frontend/` and `backend/` directories:

### `frontend/.env`
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

### `backend/.env`
```
OPENAI_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=path_to_your_service_account.json
```

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/eaf-builder.git
cd eaf-builder
```

### 2. Build and run using Docker

```bash
docker-compose up --build
```

### 3. Or run manually

#### Frontend:

```bash
cd frontend
npm install
npm start
```

#### Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload
```

---

## 🚀 Using the App

1. Sign in with Google or Email/Password
2. Enter EAF details (incident, budget, dates)
3. Review the AI-generated draft
4. Regenerate or download the document
5. Manage account or data settings from the profile page

---

## 🔌 Third-Party Services

- **Firebase**: Authentication, Firestore (metadata), Cloud Storage (EAF files)
- **OpenAI**: GPT-4o model for generating draft content
- **Docker**: Containerization for the backend services

---

## ⚙️ Configuration Notes

- Replace Firebase configuration values in `.env` with your own.
- Ensure CORS policies are configured in the backend.
- Update Axios base URLs if the backend IP or port is changed.
- Default ports:
  - Frontend: `3000`
  - Backend: `8000`

---

## 📈 Monitoring and Logs

- Docker logs: Use `docker logs <container_name>` for runtime diagnostics.
- Firebase Console: Monitor authentication and Firestore/Storage activity.
- For advanced monitoring, consider Prometheus, Grafana, or Firebase Crashlytics.

---

## 🐛 Issue Reporting

Submit issues via the [GitHub Issues tab](https://github.com/your-org/eaf-builder/issues).  
Use labels like `bug`, `enhancement`, or `question` and include relevant details/screenshots.

---

## 🧑‍💻 License and Contribution

Licensed under the MIT License. For internal and educational use.

### To Contribute:

1. Fork the repository
2. Create a branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push and open a Pull Request
