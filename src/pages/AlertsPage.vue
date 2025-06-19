<template>
  <div class="alerts-container">
    <div class="content">
      <div class="alerts-section">
        <div class="section-header">
          <div class="header-left">
            <button v-if="isViewingOtherPatient" @click="goBackToPatient" class="back-button">
              ← Back to Patient
            </button>
            <h2 class="section-title">
              {{ isViewingOtherPatient ? `${patientName} - Emergency Alerts` : '🚨 Emergency Alerts' }}
            </h2>
            <div v-if="isViewingOtherPatient" class="viewing-indicator">
              <span>👁️ Viewing as Caregiver</span>
            </div>
            <div v-else-if="userRole === 'caregiver'" class="viewing-indicator">
              <span>👥 All Linked Patients</span>
            </div>
          </div>
          <div class="header-controls">
            <select 
              v-if="userRole === 'caregiver' && !isViewingOtherPatient" 
              v-model="selectedPatientId" 
              class="patient-select"
              @change="handlePatientChange"
            >
              <option value="">All Linked Patients</option>
              <option 
                v-for="patient in assignedPatients" 
                :key="patient.id" 
                :value="patient.id"
              >
                {{ getPatientName(patient) }}
              </option>
            </select>
            <select v-model="filterStatus" class="filter-dropdown">
              <option value="all">All Alerts</option>
              <option value="unhandled">Active</option>
              <option value="handled">Handled</option>
            </select>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-else-if="loading" class="loading-state">
          <p>Loading alerts...</p>
        </div>

        <div v-else-if="filteredAlerts.length === 0" class="no-alerts">
          <p v-if="userRole === 'caregiver' && !selectedPatientId && !isViewingOtherPatient">
            No alerts from any of your linked patients
          </p>
          <p v-else-if="userRole === 'caregiver' && selectedPatientId">
            No alerts for the selected patient
          </p>
          <p v-else-if="userRole === 'patient'">
            No alerts to display
          </p>
          <p v-else>
            No alerts to display
          </p>
        </div>

        <div v-else class="alerts-list">
          <div
            v-for="alert in filteredAlerts"
            :key="alert.id"
            class="alert-card"
            :class="{ urgent: !alert.handled, resolved: alert.handled }"
          >
            <div class="alert-header">
              <h3>{{ alert.handled ? 'Resolved Alert' : '⚠️ Active Alert' }}</h3>
              <span class="timestamp">{{ formatTime(alert.created_at) }}</span>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <div class="alert-meta">
              <span>Device: {{ alert.devices?.name || alert.device_id }}</span>
              <span v-if="alert.patients?.users">
                Patient: {{ getUserName(alert) }}
                <span v-if="alert.patients.users.phone" class="phone-number">
                  ({{ alert.patients.users.phone }})
                </span>
              </span>
              <span v-if="alert.lat && alert.lng">
                <a :href="`https://maps.google.com/?q=${alert.lat},${alert.lng}`" target="_blank" class="location-link">
                  📍 View Location
                </a>
              </span>
            </div>
            <div class="alert-actions">
              <button v-if="!alert.handled" class="btn handle" @click="markAsHandled(alert.id)">
                Mark as Handled
              </button>
              <button class="btn info" @click="showDetails(alert)">Details</button>
              <button 
                v-if="alert.patients?.users?.phone" 
                class="btn contact" 
                @click="contactEmergency(alert)"
              >
                Call Patient
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { eventBus } from '@/eventBus';

export default {
  name: 'AlertsPage',
  data() {
    return {
      patientId: localStorage.getItem('patientId'),
      selectedPatientId: '',
      assignedPatients: [],
      alerts: [],
      loading: true,
      error: null,
      filterStatus: 'all',
      triggering: false,
      userRole: localStorage.getItem('userRole') || 'patient',
      currentUser: JSON.parse(localStorage.getItem('user') || '{}'),
      previousAlertIds: [],
      patientName: null
    };
  },
  computed: {
    isViewingOtherPatient() {
      return this.$route.params.id && this.$route.params.id !== localStorage.getItem('patientId');
    },
    filteredAlerts() {
      console.log('Computing filteredAlerts - Current alerts:', this.alerts);
      console.log('Current filter status:', this.filterStatus);
      const filtered = this.filterStatus === 'all'
        ? this.alerts
        : this.alerts.filter(alert => this.filterStatus === 'handled' ? alert.handled : !alert.handled);
      const sorted = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      console.log('Filtered and sorted alerts:', sorted);
      return sorted;
    }
  },
  async created() {
    console.log('User Role:', this.userRole);
    console.log('Patient ID:', this.patientId);
    console.log('Current User:', this.currentUser);
    
    // Set patient name if viewing another patient
    if (this.isViewingOtherPatient) {
      this.patientName = localStorage.getItem('viewingPatientName') || `Patient ${this.$route.params.id}`;
      this.patientId = this.$route.params.id;
    }
    
    if (this.userRole === 'caregiver' && !this.isViewingOtherPatient) {
      this.fetchAssignedPatients();
    } else {
      this.fetchAlerts();
    }
    this.pollingInterval = setInterval(this.fetchAlerts, 10000);
  },
  beforeDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  },
  methods: {
    async fetchAssignedPatients() {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token) throw new Error('No authentication token found');

        const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${baseUrl}/caregivers/my-patients?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        this.assignedPatients = response.data;
        if (this.assignedPatients.length > 0) {
          this.selectedPatientId = this.assignedPatients[0].id;
          this.fetchAlerts();
        } else {
          this.error = 'No patients assigned to you';
          this.loading = false;
        }
      } catch (err) {
        console.error('Error fetching assigned patients:', err);
        this.error = 'Failed to load assigned patients';
        this.loading = false;
      }
    },
    
    handlePatientChange() {
      this.patientId = this.selectedPatientId;
      this.fetchAlerts();
    },
    
    getPatientName(patient) {
      if (patient.users) {
        return `${patient.users.first_name || ''} ${patient.users.last_name || ''}`.trim() || 
               patient.users.email || 'Unknown Patient';
      }
      return 'Unknown Patient';
    },
    
    async fetchAlerts() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        // For patients: only show their own alerts
        if (this.userRole === 'patient' && !this.isViewingOtherPatient) {
          console.log('Fetching alerts for current patient using my-alerts endpoint');
          const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
          const res = await axios.get(`${baseUrl}/alerts/my-alerts`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const newAlerts = Array.isArray(res.data) ? res.data : [res.data];
          this.checkForNewAlerts(newAlerts);
          this.alerts = newAlerts;
          eventBus.emit('alerts-updated', this.alerts);
          console.log('Received alerts for patient:', this.alerts);
          return;
        }

        // For caregivers: show alerts for all linked patients
        if (this.userRole === 'caregiver' && !this.isViewingOtherPatient) {
          console.log('Fetching alerts for all linked patients using for-caregiver endpoint');
          const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
          const res = await axios.get(`${baseUrl}/alerts/for-caregiver`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const newAlerts = Array.isArray(res.data) ? res.data : [res.data];
          this.checkForNewAlerts(newAlerts);
          this.alerts = newAlerts;
          eventBus.emit('alerts-updated', this.alerts);
          console.log('Received alerts for all linked patients:', this.alerts);
          return;
        }

        // For viewing a specific patient (caregiver viewing individual patient)
        if (this.isViewingOtherPatient || (this.userRole === 'caregiver' && this.selectedPatientId)) {
          const targetPatientId = this.isViewingOtherPatient ? this.$route.params.id : this.selectedPatientId;
          console.log('Fetching alerts for specific patient:', targetPatientId);
          const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
          const res = await axios.get(`${baseUrl}/alerts?patient_id=${targetPatientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const newAlerts = Array.isArray(res.data) ? res.data : [res.data];
          this.checkForNewAlerts(newAlerts);
          this.alerts = newAlerts;
          eventBus.emit('alerts-updated', this.alerts);
          console.log('Received alerts for specific patient:', this.alerts);
          return;
        }

        // Fallback: get all alerts (should not be reached with proper role handling)
        console.log('Fallback: fetching all alerts');
        const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
        const res = await axios.get(`${baseUrl}/alerts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const newAlerts = Array.isArray(res.data) ? res.data : [res.data];
        this.checkForNewAlerts(newAlerts);
        this.alerts = newAlerts;
        eventBus.emit('alerts-updated', this.alerts);
        console.log('Received all alerts (fallback):', this.alerts);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        this.error = err.response?.data?.error || 'Failed to load alerts';
      } finally {
        this.loading = false;
      }
    },
    checkForNewAlerts(newAlerts) {
      const newIds = newAlerts.map(a => a.id);
      console.log('[AlertsPage] Previous IDs:', this.previousAlertIds, 'New IDs:', newIds);
      if (this.previousAlertIds.length > 0) {
        const newAlertFound = newIds.some(id => !this.previousAlertIds.includes(id));
        console.log('[AlertsPage] New alert found:', newAlertFound);
        if (newAlertFound) {
          console.log('[AlertsPage] Emitting global-notification event');
          eventBus.emit('global-notification', { message: 'New emergency alert received!' });
        }
      }
      this.previousAlertIds = newIds;
    },
    async markAsHandled(alertId) {
      try {
        const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
        const response = await axios.put(`${baseUrl}/alerts/${alertId}`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        const updatedAlert = response.data;
        const index = this.alerts.findIndex(a => a.id === alertId);
        if (index !== -1) {
          this.alerts.splice(index, 1, updatedAlert);
        }

        this.showNotification('✅ Alert marked as handled');
        eventBus.emit('alerts-updated', this.alerts);
      } catch (error) {
        console.error('Failed to update alert:', error);
        this.showNotification('❌ Failed to update alert', true);
      }
    },
    showDetails(alert) {
      this.$router.push({ name: 'AlertDetails', params: { id: alert.id } });
    },
    contactEmergency(alert) {
      if (alert.patients?.users?.phone) {
        window.location.href = `tel:${alert.patients.users.phone}`;
      } else {
        this.showNotification('No phone number available.', true);
      }
    },
    getUserName(alert) {
      if (alert.patients?.users) {
        const user = alert.patients.users;
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User';
      }
      return 'Unknown User';
    },
    formatTime(timestamp) {
      const now = new Date();
      const diff = now - new Date(timestamp);
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
      return new Date(timestamp).toLocaleString();
    },
    formatFullDate(dateString) {
      return new Date(dateString).toLocaleString();
    },
    async registerDeviceForUser() {
      try {
        const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
        const macAddress = process.env.MAC_ADDRESS; 

        await axios.post(`${baseUrl}/devices/register`, { mac: macAddress }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('✅ Device registered to current user');
      } catch (error) {
        console.error('❌ Failed to register device:', error);
      }
    },
    showNotification(message, isError = false) {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.className = `notification ${isError ? 'error' : 'success'}`;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 3000);
    },
    goBackToPatient() {
      const patientId = this.$route.params.id;
      this.$router.push(`/patient/${patientId}`);
    }
  }
};
</script>

<style scoped>
.alerts-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.alerts-section {
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.section-title {
  margin: 0;
  color: #007bff;
  font-size: 1.5rem;
}

.viewing-indicator {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.patient-select, .filter-dropdown {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.patient-select {
  min-width: 200px;
}

.filter-dropdown {
  min-width: 120px;
}

.alerts-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.alert-card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 10px;
  background: #fdfdfd;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.alert-card.urgent {
  border-left: 4px solid #ff3b3b;
  background-color: #fff3f3;
}

.alert-card.resolved {
  background-color: #f0fdf4;
  border-left: 4px solid #34d399;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-message {
  margin: 0.5rem 0;
}

.alert-meta {
  font-size: 0.9rem;
  color: #555;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.alert-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  font-weight: bold;
  border-radius: 5px;
}

.btn.handle {
  background-color: #34d399;
  color: white;
}

.btn.info {
  background-color: #60a5fa;
  color: white;
}

.btn.contact {
  background-color: #fbbf24;
  color: white;
}

.btn.trigger {
  background-color: #ef4444;
  color: white;
}

.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  z-index: 1000;
  animation: fadein 0.3s;
}

.notification.success {
  background-color: #22c55e;
}

.notification.error {
  background-color: #ef4444;
}

@keyframes fadein {
  from { opacity: 0; right: 0; }
  to { opacity: 1; right: 1rem; }
}

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 5px;
  margin: 1rem 0;
}

.phone-number {
  color: #6b7280;
  font-size: 0.9em;
}

.location-link {
  color: #2563eb;
  text-decoration: none;
}

.location-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .header-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .patient-select, .filter-dropdown {
    width: 100%;
  }
}
</style>