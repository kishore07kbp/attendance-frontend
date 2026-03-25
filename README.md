# BunkTracer Frontend: Student & Faculty Portal

The BunkTracer web portal provides a rich, responsive interface for students to register their face data and track attendance, and for faculty members to manage courses and monitor student presence in real time.

## 🎨 UI Features

- **Professional Design**: Indigo/Slate themed modern UI with premium components.
- **Live Attendance Dashboard**: Real-time status updates via Socket.io.
- **Integrated Face Recognition**: Modal-driven face scanning for enrollment and marking.
- **Mobile Linking Center**: QR-code based instructions for installing the BunkTracer mobile app.
- **Comprehensive Analytics**: Faculty-only charts for day-level, course-level, and student-level stats.
- **Course Management**: Interface for faculty to define course-to-class mappings.

## 🛠️ Technical Details

- **Framework**: React.js (Vite)
- **Styling**: Vanilla CSS with custom design tokens for a premium look.
- **Face AI**: Using `face-api.js` for on-device neural network processing of facial features.
- **State Management**: React Context API for authentication and global states.
- **Real-time**: Socket.io integration for instant hardware scan synchronization.

## ⚙️ Installation

### 1. Prerequisites
- Node.js (v16+)
- Access to the BunkTracer Backend API

### 2. Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Face Models
Ensure that the `public/models` directory contains the required neural network weights for:
- `tiny_face_detector`
- `face_landmark_68`
- `face_recognition`

## 👥 User Roles

### Students
1. Register and sign in.
2. Link mobile device via the **Bunk Tracer** card in the Profile.
3. Enroll face via the Face Data Status card.
4. Mark attendance daily from the Dashboard.

### Faculty
1. Access the Faculty Portal.
2. Define Subject/Courses and assign them to specific Years/Classes.
3. View the **Live Attendance Log** during lectures.
4. Review analytics and export history for reporting.
