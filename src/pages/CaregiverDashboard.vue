<template>
  <div class="caregiver-dashboard">
    <h2>Caregiver Dashboard</h2>
    
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

    <div class="dashboard-header">
      <div class="stats">
        <div class="stat-card">
          <h3>{{ linkedPatients.length }}</h3>
          <p>Linked Patients</p>
        </div>
        <div class="stat-card">
          <h3>{{ totalAlerts }}</h3>
          <p>Active Alerts</p>
        </div>
      </div>
      
      <div class="actions">
        <button @click="$router.push('/link-caregiver')" class="action-button">
          <span>🔗</span> Link New Patient
        </button>
        <button @click="$router.push('/calendar')" class="action-button calendar-action">
          <span>📅</span> View All Calendars
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>Loading your patients...</p>
    </div>

    <div v-else-if="linkedPatients.length === 0" class="no-patients">
      <h3>No Patients Linked</h3>
      <p>You haven't linked to any patients yet. Use the button above to link to a patient.</p>
    </div>

    <div v-else class="patients-grid">
      <div 
        v-for="patient in linkedPatients" 
        :key="patient.id" 
        class="patient-card"
        @click="viewPatient(patient)"
      >
        <div class="patient-header">
          <h3>{{ getPatientName(patient) }}</h3>
          <span class="patient-id">ID: {{ patient.id }}</span>
        </div>
        
        <div class="patient-info">
          <p><strong>Email:</strong> {{ patient.users?.email || 'N/A' }}</p>
          <p><strong>Phone:</strong> {{ patient.users?.phone || 'N/A' }}</p>
          <p><strong>Age:</strong> {{ calculateAge(patient.users?.date_of_birth) || 'N/A' }}</p>
        </div>

        <div class="patient-actions">
          <button @click.stop="viewPatientProfile(patient)" class="view-btn">
            View Profile
          </button>
          <button @click.stop="viewMedicalRecords(patient)" class="medical-btn">
            Medical Records
          </button>
          <button @click.stop="viewAlerts(patient)" class="alerts-btn">
            Alerts ({{ getPatientAlertCount(patient.id) }})
          </button>
          <button @click.stop="viewCalendar(patient)" class="calendar-btn">
            📅 Calendar
          </button>
        </div>

        <div class="unlink-section">
          <button @click.stop="unlinkPatient(patient)" class="unlink-btn">
            Unlink Patient
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CaregiverDashboard',
  data() {
    return {
      linkedPatients: [],
      allAlerts: [],
      loading: true,
      error: null,
      successMessage: null
    };
  },
  computed: {
    totalAlerts() {
      return this.allAlerts.filter(alert => !alert.handled).length;
    }
  },
  async created() {
    await this.fetchLinkedPatients();
    await this.fetchAllAlerts();
  },
  methods: {
    async fetchLinkedPatients() {
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        // Use the dedicated endpoint to get linked patients directly
        const response = await axios.get(`/api/caregivers/my-patients?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.linkedPatients = Array.isArray(response.data) ? response.data : [];
        console.log('Fetched linked patients:', this.linkedPatients);
      } catch (err) {
        console.error('Error fetching linked patients:', err);
        if (err.response?.status === 404) {
          this.error = 'No caregiver record found. Please contact support.';
        } else {
          this.error = err.response?.data?.error || err.message || 'Failed to load patients';
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchAllAlerts() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/alerts/for-caregiver', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Ensure we always have an array
        this.allAlerts = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Error fetching alerts:', err);
        // If it's a 404, the user might not have a caregiver record yet
        if (err.response?.status === 404) {
          console.log('No caregiver record found, setting empty alerts');
          this.allAlerts = [];
        } else {
          this.allAlerts = []; // Set empty array on error
        }
      }
    },

    getPatientName(patient) {
      const user = patient.users;
      if (user?.first_name && user?.last_name) {
        return `${user.first_name} ${user.last_name}`;
      } else if (user?.first_name) {
        return user.first_name;
      } else if (user?.email) {
        return user.email;
      }
      return `Patient ${patient.id}`;
    },

    calculateAge(dateOfBirth) {
      if (!dateOfBirth) return null;
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    },

    getPatientAlertCount(patientId) {
      return this.allAlerts.filter(alert => alert.patient_id === patientId && !alert.handled).length;
    },

    viewPatient(patient) {
      // Store patient info in localStorage for the patient view page
      localStorage.setItem('viewingPatientId', patient.id);
      localStorage.setItem('viewingPatientName', this.getPatientName(patient));
      this.$router.push(`/patient/${patient.id}`);
    },

    viewPatientProfile(patient) {
      localStorage.setItem('viewingPatientId', patient.id);
      localStorage.setItem('viewingPatientName', this.getPatientName(patient));
      this.$router.push(`/patient/${patient.id}/profile`);
    },

    viewMedicalRecords(patient) {
      localStorage.setItem('viewingPatientId', patient.id);
      localStorage.setItem('viewingPatientName', this.getPatientName(patient));
      this.$router.push(`/patient/${patient.id}/medical-records`);
    },

    viewAlerts(patient) {
      localStorage.setItem('viewingPatientId', patient.id);
      localStorage.setItem('viewingPatientName', this.getPatientName(patient));
      this.$router.push(`/patient/${patient.id}/alerts`);
    },

    viewCalendar(patient) {
      localStorage.setItem('viewingPatientId', patient.id);
      localStorage.setItem('viewingPatientName', this.getPatientName(patient));
      this.$router.push(`/patient/${patient.id}/calendar`);
    },

    async unlinkPatient(patient) {
      if (!confirm(`Are you sure you want to unlink from ${this.getPatientName(patient)}?`)) {
        return;
      }

      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        await axios.delete('/api/caregivers/unlink-patient', {
          data: {
            user_id: parseInt(userId),
            patient_id: parseInt(patient.id)
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.successMessage = `Successfully unlinked from ${this.getPatientName(patient)}`;
        await this.fetchLinkedPatients();
      } catch (err) {
        console.error('Error unlinking patient:', err);
        this.error = err.response?.data?.error || 'Failed to unlink patient';
      }
    }
  }
};
</script>

<style scoped>
.caregiver-dashboard {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stats {
  display: flex;
  gap: 2rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  min-width: 100px;
}

.stat-card h3 {
  font-size: 2rem;
  color: #007bff;
  margin: 0;
}

.stat-card p {
  margin: 0.5rem 0 0 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.action-button:hover {
  background: #218838;
}

.calendar-action {
  background: #17a2b8;
}

.calendar-action:hover {
  background: #138496;
}

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.patient-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e9ecef;
}

.patient-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.patient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.patient-header h3 {
  margin: 0;
  color: #007bff;
  font-size: 1.2rem;
}

.patient-id {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #6c757d;
}

.patient-info {
  margin-bottom: 1.5rem;
}

.patient-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #495057;
}

.patient-info strong {
  color: #212529;
}

.patient-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.view-btn, .medical-btn, .alerts-btn, .calendar-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.view-btn {
  background: #007bff;
  color: white;
}

.view-btn:hover {
  background: #0056b3;
}

.medical-btn {
  background: #17a2b8;
  color: white;
}

.medical-btn:hover {
  background: #138496;
}

.alerts-btn {
  background: #ffc107;
  color: #212529;
}

.alerts-btn:hover {
  background: #e0a800;
}

.calendar-btn {
  background: #6c757d;
  color: white;
}

.calendar-btn:hover {
  background: #5a6268;
}

.unlink-section {
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.unlink-btn {
  width: 100%;
  padding: 0.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.unlink-btn:hover {
  background: #c82333;
}

.loading, .no-patients {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.no-patients h3 {
  color: #6c757d;
  margin-bottom: 1rem;
}

.no-patients p {
  color: #6c757d;
  margin: 0;
}

.error-message, .success-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  position: relative;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.close-error, .close-success {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stats {
    justify-content: center;
  }
  
  .patients-grid {
    grid-template-columns: 1fr;
  }
}
</style> 