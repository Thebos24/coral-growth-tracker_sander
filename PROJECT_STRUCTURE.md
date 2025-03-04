# Coral Growth Tracker - Project Structure

## Core Files
- `src/App.js` - Main application component
- `src/index.js` - Application entry point
- `src/firebase.js` - Firebase configuration and initialization

## Components
- `src/components/Login.js` - User authentication component
- `src/components/SignUp.js` - User registration component
- `src/components/Timeline.js` - Photo timeline display component
- `src/components/AlbumGrid.js` - Album overview grid component
- `src/components/DeleteConfirmDialog.js` - Confirmation dialog for deletions

## Services
- `src/services/firebase-db.js` - Firebase service methods (auth, storage, firestore)

## Configuration
- `package.json` - Project dependencies and scripts
- `.env` - Environment variables (Firebase config)

## Component Relationships
```mermaid
graph TD
    A[App.js] --> B[Login.js]
    A --> C[Timeline.js]
    A --> D[DeleteConfirmDialog.js]
    A --> E[firebase-db.js]
    E --> F[firebase.js]