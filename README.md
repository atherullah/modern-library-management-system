# Modern Library Management System

A full-stack web application built with Node.js, Express.js, MongoDB, and Bootstrap 5.

This application allows users to view books, filter by genre, and search by title. Authenticated customers can access their book cart, borrow books, view their profile, and see their borrow history. Admin users have a dashboard to manage the book catalog (CRUD operations), view all users' borrow histories, and manage public user information.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose v5)
- **Frontend:** EJS (Embedded JavaScript templates), Bootstrap 5
- **Authentication:** JWT (JSON Web Tokens), bcrypt for password hashing
- **File Uploads:** Multer (for book covers and user profiles)

---

## 🚀 Getting Started on Windows

Follow these step-by-step instructions to get the project running locally on a Windows machine.

### 1. Prerequisites Installation

You need Node.js and MongoDB installed on your system.

**A. Install Node.js**
1. Open PowerShell.
2. Run the following command using winget:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
3. Restart your PowerShell/Terminal to ensure `node` and `npm` are available in your PATH.

**B. Install MongoDB (Community Server)**
1. In PowerShell, run:
   ```powershell
   winget install MongoDB.Server
   ```
2. MongoDB will run as a background Windows Service automatically.

### 2. Project Setup

**A. Clone and Navigate**
Clone the repository and open the project directory in your terminal:
```powershell
# (Skipped if you already have the files locally)
cd modern-library-management-system
```

**B. Install Dependencies**
Install all required Node.js packages:
```powershell
npm install
```
*(If PowerShell blocks npm scripts, you may need to run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force` first).*

**C. Environment Variables**
The project requires a `.env` file to store configuration secrets.
1. Copy the `.env.example` file and rename it to `.env`.
2. Update the values in `.env`:
   ```env
   PORT=3000
   DB_URL=mongodb://localhost:27017/library-management-system
   JWT_PRIVATE_KEY=your-super-secret-jwt-key
   ```

**D. Create Upload Directories**
If you encounter errors when uploading images or running the app for the first time, ensure the following folders exist:
```powershell
mkdir -p public/images
mkdir -p public/user_images
```

### 3. Running the Application

Start the development server:
```powershell
npm start
```

You should see output similar to:
```text
Alvin's Library | Listening at http://localhost:3000
```

Open your web browser and navigate to [http://localhost:3000](http://localhost:3000) to view the application!

---

## Default Roles
- **Customer (Role 1):** Default role when a new user registers.
- **Admin (Role 0):** To make a user an admin, you currently need to manually update their `role` field to `0` in the MongoDB database using MongoDB Compass or `mongosh`.

## Upcoming Phases
1. **Security Features**
2. **Book Management Features**
3. **UX Enhancements**
