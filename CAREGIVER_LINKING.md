# Caregiver-Patient Linking System

## Overview

The S&S application now supports linking caregivers to multiple patients, allowing caregivers to access and manage all their linked patients' information from a centralized dashboard.

## Features

### For Caregivers

1. **Caregiver Dashboard** (`/caregiver-dashboard`)
   - View all linked patients in a grid layout
   - See patient statistics (number of linked patients, active alerts)
   - Quick access to patient information and actions
   - Unlink patients when needed

2. **Patient Management**
   - Link to new patients using patient IDs
   - View individual patient details
   - Access patient medical records (read-only)
   - View patient alerts and emergency notifications
   - Navigate to patient calendar and location data

3. **Navigation**
   - Dedicated "Dashboard" link in navbar for caregivers
   - "Link Patient" option to add new patients
   - Context-aware navigation showing when viewing as caregiver

### For Patients

1. **Patient ID Display**
   - View their unique patient ID for sharing with caregivers
   - Generate patient ID if not already created

2. **Caregiver Access**
   - Caregivers can view patient profiles, medical records, and alerts
   - Patients maintain control over their own data editing

## How to Use

### Linking a Patient to a Caregiver

1. **Patient Side:**
   - Patient logs in and goes to Profile page
   - Clicks "View Patient ID" to see their unique ID
   - Shares this ID with their caregiver

2. **Caregiver Side:**
   - Caregiver logs in and navigates to "Link Patient"
   - Enters the patient ID provided by the patient
   - Patient is now linked and appears in caregiver dashboard

### Accessing Patient Information

1. **From Dashboard:**
   - Caregiver clicks on any patient card
   - Views comprehensive patient overview
   - Accesses medical records, alerts, calendar, and location

2. **Direct Navigation:**
   - Use navbar links to access specific patient sections
   - All pages show context when viewing as caregiver

## Technical Implementation

### Database Schema

The system uses a many-to-many relationship through the `caregiverpatientlinks` table:

```sql
caregiverpatientlinks {
  link_id (Primary Key)
  caregiver_id (Foreign Key to caregivers)
  patient_id (Foreign Key to patients)
}
```

### API Endpoints

- `GET /api/caregivers/my-patients?user_id={id}` - Get all patients linked to a caregiver
- `POST /api/caregivers/{id}/patients` - Link a patient to a caregiver
- `DELETE /api/caregivers/{id}/patients/{patientId}` - Unlink a patient from a caregiver
- `GET /api/patients/{id}` - Get patient details (with caregiver access control)

### Frontend Routes

- `/caregiver-dashboard` - Main caregiver dashboard
- `/patient/{id}` - Individual patient view
- `/patient/{id}/profile` - Patient profile (caregiver view)
- `/patient/{id}/medical-records` - Patient medical records (caregiver view)
- `/patient/{id}/alerts` - Patient alerts (caregiver view)
- `/link-caregiver` - Link new patients

## Security & Permissions

- Caregivers can only view patients they are explicitly linked to
- Patients maintain full control over their own data editing
- Caregivers have read-only access to patient medical records
- All access is authenticated and authorized through JWT tokens

## User Experience

### Visual Indicators

- "👁️ Viewing as Caregiver" indicator on patient pages
- Different navigation options for caregivers vs patients
- Context-aware page titles and headers
- Clear back navigation to patient overview

### Responsive Design

- Mobile-friendly dashboard layout
- Adaptive navigation for different screen sizes
- Touch-friendly patient cards and actions

## Future Enhancements

- Bulk patient linking
- Patient grouping and categorization
- Advanced filtering and search
- Caregiver activity logs
- Patient consent management
- Emergency contact integration 