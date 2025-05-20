<template>
  <div class="alerts-container">
    <!-- Content -->
    <div class="content">
      <div class="alerts-section">
        <div class="section-header">
          <h2>Emergency Alerts</h2>
          <div class="filter-dropdown">
            <select v-model="filterStatus">
              <option value="all">All Alerts</option>
              <option value="unhandled">Active</option>
              <option value="handled">Handled</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <p>Loading alerts...</p>
        </div>

        <div v-else-if="filteredAlerts.length === 0" class="no-alerts">
          <p>No alerts to display</p>
        </div>

        <div v-else class="alerts-list">
          <div
            v-for="alert in filteredAlerts"
            :key="alert.id"
            class="alert-card"
            :class="{ urgent: !alert.handled, resolved: alert.handled }"
          >
            <div class="alert-icon">
              <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="alert-content">
              <div class="alert-header">
                <h3>Emergency Alert</h3>
                <span class="alert-time">{{ formatTime(new Date(alert.created_at)) }}</span>
              </div>
              <p class="alert-description">{{ alert.message }}</p>
              <div class="patient-info">
                <span class="patient-name" v-if="alert.users">{{ getUserName(alert.users) }}</span>
                <span class="device-id">Device: {{ alert.device_id }}</span>
                <span v-if="alert.lat && alert.lng" class="location">
                  <a :href="`https://maps.google.com/?q=${alert.lat},${alert.lng}`" target="_blank">View Location</a>
                </span>
              </div>
            </div>
            <div class="alert-actions">
              <button v-if="!alert.handled" class="resolve-btn" @click="markAsHandled(alert.id)">
                Mark Handled
              </button>
              <button v-if="alert.handled" class="details-btn" @click="showDetails(alert)">
                Details
              </button>
              <button v-if="!alert.handled" class="contact-btn" @click="contactEmergency(alert)">
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="test-emergency-btn">
        <button @click="triggerTestAlert" :disabled="triggering">
          {{ triggering ? 'Sending...' : 'Test Emergency Alert' }}
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="detailsModal.show" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Alert Details</h3>
          <button class="close-btn" @click="detailsModal.show = false">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-item"><span class="detail-label">Alert ID:</span> <span class="detail-value">{{ detailsModal.alert.id }}</span></div>
          <div class="detail-item"><span class="detail-label">Message:</span> <span class="detail-value">{{ detailsModal.alert.message }}</span></div>
          <div class="detail-item" v-if="detailsModal.alert.users">
            <span class="detail-label">User:</span>
            <span class="detail-value">{{ getUserName(detailsModal.alert.users) }}</span>
          </div>
          <div class="detail-item"><span class="detail-label">Device ID:</span> <span class="detail-value">{{ detailsModal.alert.device_id }}</span></div>
          <div class="detail-item"><span class="detail-label">Created:</span> <span class="detail-value">{{ formatFullDate(detailsModal.alert.created_at) }}</span></div>
          <div class="detail-item" v-if="detailsModal.alert.lat && detailsModal.alert.lng">
            <span class="detail-label">Location:</span>
            <a :href="`https://maps.google.com/?q=${detailsModal.alert.lat},${detailsModal.alert.lng}`" target="_blank" class="map-link">View on Map</a>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value status" :class="detailsModal.alert.handled ? 'handled' : 'active'">{{ detailsModal.alert.handled ? 'Handled' : 'Active' }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="detailsModal.show = false">Close</button>
          <button v-if="!detailsModal.alert.handled" class="btn-action" @click="markAsHandled(detailsModal.alert.id, true)">
            Mark as Handled
          </button>
        </div>
      </div>
    </div>

    <div class="tab-navigator"><div class="indicator"></div></div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AlertsPage',
  data() {
    return {
      filterStatus: 'all',
      alerts: [],
      loading: true,
      triggering: false,
      detailsModal: {
        show: false,
        alert: {}
      },
      currentUser: {
        id: 1,
        device_id: 1
      }
    };
  },
  created() {
    this.fetchAlerts();
  },
  computed: {
    filteredAlerts() {
      let alerts = this.filterStatus === 'all'
        ? this.alerts
        : this.alerts.filter(alert =>
            this.filterStatus === 'handled' ? alert.handled : !alert.handled
          );
      return alerts.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },
  methods: {
    async fetchAlerts() {
      this.loading = true;
      try {
        const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${baseUrl}/alerts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.alerts = response.data || [];
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        this.loading = false;
      }
    },
    async triggerTestAlert() {
      this.triggering = true;
      try {
        const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
        const response = await axios.post(`${baseUrl}/alerts`, {
          message: 'Test emergency alert triggered from the web interface',
          device_id: this.currentUser.device_id,
          user_id: this.currentUser.id
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data && response.data.alert) {
          this.alerts.unshift(response.data.alert);
          alert('Test alert triggered!');
        }
      } catch (error) {
        console.error('Failed to trigger test alert:', error);
        alert('Failed to trigger test alert.');
      } finally {
        this.triggering = false;
      }
    },
    markAsHandled(alertId, closeModal = false) {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) alert.handled = true;
      if (closeModal) this.detailsModal.show = false;
    },
    showDetails(alert) {
      this.detailsModal.alert = alert;
      this.detailsModal.show = true;
    },
    contactEmergency(alert) {
      if (alert.users && alert.users.phone) {
        window.location.href = `tel:${alert.users.phone}`;
      } else {
        alert('No contact number available.');
      }
    },
    getUserName(user) {
      return `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.email || 'Unknown User';
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
    }
  }
};
</script>

<style scoped>
/* Your existing styles (as you already had) */
</style>
