<template>
    <div class="profile-page" v-if="profile">
      <div class="profile-header">
        <h2>{{ isViewingOtherPatient ? `${patientName} - Profile` : 'My Profile' }}</h2>
        <div v-if="isViewingOtherPatient" class="viewing-indicator">
          <span>👁️ Viewing as Caregiver</span>
        </div>
      </div>
      
      <!-- Error message display -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button @click="error = null" class="close-error">×</button>
      </div>
      
      <!-- Success message display -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
        <button @click="successMessage = null" class="close-success">×</button>
      </div>
      
      <div class="profile-details">
        <div><strong>Email:</strong> {{ profile.email }}</div>
        <div><strong>First Name:</strong> {{ profile.first_name || '-' }}</div>
        <div><strong>Last Name:</strong> {{ profile.last_name || '-' }}</div>
        <div><strong>Address:</strong> {{ profile.address || '-' }}</div>
        <div><strong>Phone:</strong> {{ profile.phone || '-' }}</div>
        <div><strong>Emergency Contact Name:</strong> {{ profile.emergency_name || '-' }}</div>
        <div><strong>Emergency Contact Phone:</strong> {{ profile.emergency_phone || '-' }}</div>
        <div><strong>Medical Info:</strong> {{ profile.medical_info || '-' }}</div>
        <div><strong>Date of Birth / Age:</strong> {{ profile.date_of_birth ? profile.date_of_birth.substr(0,10) : '-' }}</div>
        <div><strong>Gender:</strong> {{ profile.gender || '-' }}</div>
        <div><strong>Blood Type:</strong> {{ profile.blood_type || '-' }}</div>
        <div><strong>Allergies:</strong> {{ profile.allergies || '-' }}</div>
        <div><strong>Chronic Conditions:</strong> {{ profile.chronic_conditions || '-' }}</div>
        <div><strong>Current Medications:</strong> {{ profile.current_medications || '-' }}</div>
        <div><strong>Past Surgeries:</strong> {{ profile.past_surgeries || '-' }}</div>
        <div><strong>Primary Care Physician:</strong> {{ profile.primary_physician || '-' }}</div>
        <div><strong>Physician Contact:</strong> {{ profile.physician_contact || '-' }}</div>
        <div><strong>Preferred Pharmacy:</strong> {{ profile.preferred_pharmacy || '-' }}</div>
        <div><strong>Insurance Provider:</strong> {{ profile.insurance_provider || '-' }}</div>
        <div><strong>Insurance Policy #:</strong> {{ profile.insurance_policy || '-' }}</div>
        <div><strong>Vaccination Records:</strong> {{ profile.vaccination_records || '-' }}</div>
      </div>
      
      <div class="profile-actions">
        <!-- Show different actions based on user role and context -->
        <template v-if="!isViewingOtherPatient">
          <!-- Patient viewing their own profile -->
          <button @click="$router.push('/edit-profile')" class="edit-button">Edit Profile</button>
          <button @click="$router.push('/link-patient')" class="view-button">View Patient ID</button>
        </template>
        
        <template v-else>
          <!-- Caregiver viewing patient profile -->
          <button @click="goBackToPatient" class="back-button">← Back to Patient</button>
          <button @click="goToPatientMedicalRecords" class="medical-button">Medical Records</button>
          <button @click="goToPatientAlerts" class="alerts-button">View Alerts</button>
        </template>
        
        <!-- Show caregiver dashboard button for caregivers -->
        <template v-if="isCaregiver && !isViewingOtherPatient">
          <button @click="$router.push('/caregiver-dashboard')" class="dashboard-button">Caregiver Dashboard</button>
        </template>
      </div>
    </div>
    <div v-else-if="isLoading">
      <p>Loading profile...</p>
    </div>
    <div v-else>
      <p>Failed to load profile. Please try refreshing the page.</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: "ProfilePage",
    data() {
      return {
        profile: null,
        error: null,
        successMessage: null,
        isLoading: false,
        isCaregiver: false,
        patientName: null
      };
    },
    computed: {
      isViewingOtherPatient() {
        return this.$route.params.id && this.$route.params.id !== localStorage.getItem('userId');
      }
    },
    async created() {
      await this.checkUserRole();
      await this.fetchProfile();
    },
    methods: {
      async checkUserRole() {
        try {
          const userId = localStorage.getItem('userId');
          const token = localStorage.getItem('token');
          
          if (!userId || !token) return;
          
          // Check if user is a caregiver
          const caregiverResponse = await axios.get(`/api/caregivers?user_id=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          this.isCaregiver = caregiverResponse.data.length > 0;
        } catch (err) {
          console.error('Error checking user role:', err);
        }
      },
      
      async fetchProfile() {
        this.isLoading = true;
        this.error = null;
        try {
          const userId = this.$route.params.id || localStorage.getItem('userId');
          const token = localStorage.getItem('token');
          
          if (!userId || !token) {
            throw new Error('Authentication required. Please log in again.');
          }
          
          const res = await axios.get(`/api/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.profile = res.data;
          
          // Set patient name for display
          if (this.isViewingOtherPatient) {
            this.patientName = this.getPatientName(this.profile);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          this.error = err.response?.data?.error || err.message || 'Failed to load profile';
        } finally {
          this.isLoading = false;
        }
      },
      
      getPatientName(profile) {
        if (profile?.first_name && profile?.last_name) {
          return `${profile.first_name} ${profile.last_name}`;
        } else if (profile?.first_name) {
          return profile.first_name;
        } else if (profile?.email) {
          return profile.email;
        }
        return `Patient ${this.$route.params.id}`;
      },
      
      goBackToPatient() {
        const patientId = this.$route.params.id;
        this.$router.push(`/patient/${patientId}`);
      },
      
      goToPatientMedicalRecords() {
        const patientId = this.$route.params.id;
        this.$router.push(`/patient/${patientId}/medical-records`);
      },
      
      goToPatientAlerts() {
        const patientId = this.$route.params.id;
        this.$router.push(`/patient/${patientId}/alerts`);
      }
    }
  };
  </script>
  
  <style scoped>
  .profile-page {
  max-width: 500px;
  margin: 2rem auto;
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  font-family: system-ui, sans-serif;
  color: #005f99;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.profile-header h2 {
  margin: 0;
  color: #007bff;
}

.viewing-indicator {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
  position: relative;
}

.success-message {
  background-color: #efe;
  color: #363;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #cfc;
  position: relative;
}

.close-error, .close-success {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

.profile-details > div {
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 0.75rem;
  background-color: #fefefe;
  font-size: 0.95rem;
  line-height: 1.4;
}

.profile-details strong {
  display: inline-block;
  min-width: 200px;
  color: #005f99;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.edit-button, .view-button, .back-button, .medical-button, .alerts-button, .dashboard-button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.edit-button {
  background: #007BFF;
  color: white;
}

.edit-button:hover {
  background: #0056b3;
}

.view-button {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.view-button:hover {
  background: #6c757d;
  color: white;
}

.back-button {
  background: #6c757d;
  color: white;
}

.back-button:hover {
  background: #5a6268;
}

.medical-button {
  background: #17a2b8;
  color: white;
}

.medical-button:hover {
  background: #138496;
}

.alerts-button {
  background: #ffc107;
  color: #212529;
}

.alerts-button:hover {
  background: #e0a800;
}

.dashboard-button {
  background: #28a745;
  color: white;
}

.dashboard-button:hover {
  background: #218838;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .profile-actions {
    flex-direction: column;
  }
  
  .profile-details strong {
    min-width: 150px;
  }
}
  </style>