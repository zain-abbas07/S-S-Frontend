<template>
  <div class="patient-view">
    <div class="patient-header">
      <button @click="$router.go(-1)" class="back-button">
        ← Back
      </button>
      <h2>{{ patientName || 'Patient Details' }}</h2>
    </div>

    <!-- Error message display -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null" class="close-error">×</button>
    </div>

    <div v-if="loading" class="loading">
      <p>Loading patient information...</p>
    </div>

    <div v-else-if="patient" class="patient-content">
      <div class="patient-overview">
        <div class="overview-card">
          <h3>Basic Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Name:</label>
              <span>{{ getPatientName(patient) }}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>{{ patient.users?.email || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Phone:</label>
              <span>{{ patient.users?.phone || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Age:</label>
              <span>{{ calculateAge(patient.users?.date_of_birth) || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Gender:</label>
              <span>{{ patient.users?.gender || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Blood Type:</label>
              <span>{{ patient.users?.blood_type || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <h3>Emergency Contact</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Emergency Contact:</label>
              <span>{{ patient.users?.emergency_name || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <label>Emergency Phone:</label>
              <span>{{ patient.users?.emergency_phone || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="overview-card">
          <h3>Medical Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Allergies:</label>
              <span>{{ patient.users?.allergies || 'None reported' }}</span>
            </div>
            <div class="info-item">
              <label>Chronic Conditions:</label>
              <span>{{ patient.users?.chronic_conditions || 'None reported' }}</span>
            </div>
            <div class="info-item">
              <label>Current Medications:</label>
              <span>{{ patient.users?.current_medications || 'None reported' }}</span>
            </div>
            <div class="info-item">
              <label>Primary Physician:</label>
              <span>{{ patient.users?.primary_physician || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="patient-actions">
        <button @click="viewMedicalRecords" class="action-btn medical-btn">
          📋 Medical Records
        </button>
        <button @click="viewAlerts" class="action-btn alerts-btn">
          🚨 Alerts ({{ activeAlertsCount }})
        </button>
        <button @click="viewCalendar" class="action-btn calendar-btn">
          📅 Calendar
        </button>
        <button @click="viewMap" class="action-btn map-btn">
          🗺️ Location
        </button>
      </div>

      <div class="recent-activity">
        <h3>Recent Activity</h3>
        <div v-if="recentAlerts.length === 0" class="no-activity">
          <p>No recent alerts or activity</p>
        </div>
        <div v-else class="activity-list">
          <div 
            v-for="alert in recentAlerts" 
            :key="alert.id" 
            class="activity-item"
            @click="viewAlertDetails(alert)"
          >
            <div class="activity-icon">🚨</div>
            <div class="activity-content">
              <div class="activity-title">{{ alert.message }}</div>
              <div class="activity-time">{{ formatDate(alert.created_at) }}</div>
            </div>
            <div class="activity-status" :class="{ 'handled': alert.handled }">
              {{ alert.handled ? 'Handled' : 'Active' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-found">
      <h3>Patient Not Found</h3>
      <p>The patient you're looking for could not be found or you don't have access to view this patient.</p>
      <button @click="$router.push('/caregiver-dashboard')" class="back-to-dashboard">
        Back to Dashboard
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PatientView',
  data() {
    return {
      patient: null,
      recentAlerts: [],
      loading: true,
      error: null,
      patientName: null
    };
  },
  computed: {
    activeAlertsCount() {
      return this.recentAlerts.filter(alert => !alert.handled).length;
    }
  },
  async created() {
    await this.fetchPatientData();
    await this.fetchRecentAlerts();
  },
  methods: {
    async fetchPatientData() {
      try {
        const patientId = this.$route.params.id;
        const token = localStorage.getItem('token');
        
        if (!patientId || !token) {
          throw new Error('Missing patient ID or authentication token');
        }
        
        const response = await axios.get(`/api/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.patient = response.data;
        this.patientName = this.getPatientName(this.patient);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        this.error = err.response?.data?.error || err.message || 'Failed to load patient information';
      } finally {
        this.loading = false;
      }
    },

    async fetchRecentAlerts() {
      try {
        const patientId = this.$route.params.id;
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`/api/alerts?patient_id=${patientId}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.recentAlerts = response.data.slice(0, 5);
      } catch (err) {
        console.error('Error fetching recent alerts:', err);
      }
    },

    getPatientName(patient) {
      const user = patient?.users;
      if (user?.first_name && user?.last_name) {
        return `${user.first_name} ${user.last_name}`;
      } else if (user?.first_name) {
        return user.first_name;
      } else if (user?.email) {
        return user.email;
      }
      return `Patient ${patient?.id}`;
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

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    viewMedicalRecords() {
      localStorage.setItem('viewingPatientId', this.patient.id);
      localStorage.setItem('viewingPatientName', this.patientName);
      this.$router.push(`/patient/${this.patient.id}/medical-records`);
    },

    viewAlerts() {
      localStorage.setItem('viewingPatientId', this.patient.id);
      localStorage.setItem('viewingPatientName', this.patientName);
      this.$router.push(`/patient/${this.patient.id}/alerts`);
    },

    viewCalendar() {
      localStorage.setItem('viewingPatientId', this.patient.id);
      localStorage.setItem('viewingPatientName', this.patientName);
      this.$router.push(`/patient/${this.patient.id}/calendar`);
    },

    viewMap() {
      localStorage.setItem('viewingPatientId', this.patient.id);
      localStorage.setItem('viewingPatientName', this.patientName);
      this.$router.push(`/patient/${this.patient.id}/map`);
    },

    viewAlertDetails(alert) {
      this.$router.push(`/alerts/${alert.id}`);
    }
  }
};
</script>

<style scoped>
.patient-view {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #5a6268;
}

.patient-header h2 {
  margin: 0;
  color: #007bff;
}

.patient-content {
  display: grid;
  gap: 2rem;
}

.patient-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.overview-card h3 {
  margin: 0 0 1rem 0;
  color: #007bff;
  font-size: 1.1rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 600;
  color: #495057;
  min-width: 120px;
}

.info-item span {
  color: #212529;
  text-align: right;
  flex: 1;
}

.patient-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 1rem;
}

.medical-btn {
  background: #17a2b8;
  color: white;
}

.medical-btn:hover {
  background: #138496;
  transform: translateY(-1px);
}

.alerts-btn {
  background: #ffc107;
  color: #212529;
}

.alerts-btn:hover {
  background: #e0a800;
  transform: translateY(-1px);
}

.calendar-btn {
  background: #28a745;
  color: white;
}

.calendar-btn:hover {
  background: #218838;
  transform: translateY(-1px);
}

.map-btn {
  background: #6f42c1;
  color: white;
}

.map-btn:hover {
  background: #5a32a3;
  transform: translateY(-1px);
}

.recent-activity {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.recent-activity h3 {
  margin: 0 0 1rem 0;
  color: #007bff;
  font-size: 1.1rem;
}

.no-activity {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid #e9ecef;
}

.activity-item:hover {
  background: #e9ecef;
}

.activity-icon {
  font-size: 1.5rem;
  min-width: 40px;
  text-align: center;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.85rem;
  color: #6c757d;
}

.activity-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #dc3545;
  color: white;
}

.activity-status.handled {
  background: #28a745;
}

.loading, .not-found {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.not-found h3 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.not-found p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.back-to-dashboard {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.back-to-dashboard:hover {
  background: #0056b3;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
  position: relative;
}

.close-error {
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
  .patient-overview {
    grid-template-columns: 1fr;
  }
  
  .patient-actions {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .info-item span {
    text-align: left;
  }
}
</style> 