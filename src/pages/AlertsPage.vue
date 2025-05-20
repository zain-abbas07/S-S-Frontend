<template>
  <div class="alerts-container">
    <div class="content">
      <div class="alerts-section">
        <div class="section-header">
          <h2 class="section-title">🚨 Emergency Alerts</h2>
          <select v-model="filterStatus" class="filter-dropdown">
            <option value="all">All Alerts</option>
            <option value="unhandled">Active</option>
            <option value="handled">Handled</option>
          </select>
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
            <div class="alert-header">
              <h3>{{ alert.handled ? 'Resolved Alert' : '⚠️ Active Alert' }}</h3>
              <span class="timestamp">{{ formatTime(alert.created_at) }}</span>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <div class="alert-meta">
              <span>Device: {{ alert.device_id }}</span>
              <span v-if="alert.users">User: {{ getUserName(alert.users) }}</span>
              <span v-if="alert.lat && alert.lng">
                <a :href="`https://maps.google.com/?q=${alert.lat},${alert.lng}`" target="_blank">📍 Location</a>
              </span>
            </div>
            <div class="alert-actions">
              <button v-if="!alert.handled" class="btn handle" @click="markAsHandled(alert.id)">
                Mark as Handled
              </button>
              <button class="btn info" @click="showDetails(alert)">Details</button>
              <button class="btn contact" @click="contactEmergency(alert)">Call User</button>
            </div>
          </div>
        </div>

        <div class="test-emergency-btn">
          <button @click="triggerTestAlert" :disabled="triggering" class="btn trigger">
            {{ triggering ? 'Sending...' : 'Test Emergency Alert' }}
          </button>
        </div>
      </div>
    </div>
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
      currentUser: JSON.parse(localStorage.getItem('profile')) || { id: null, device_id: null, email: null }
    };
  },
    created() {
    if (this.currentUser?.id) {
        this.registerDeviceForUser(); // 🔁 Assign device on load
        this.fetchAlerts();
    } else {
        this.loading = false;
    }

  },
  computed: {
    filteredAlerts() {
      const filtered = this.filterStatus === 'all'
        ? this.alerts
        : this.alerts.filter(alert => this.filterStatus === 'handled' ? alert.handled : !alert.handled);
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  },
  methods: {
    async fetchAlerts() {
      this.loading = true;
      try {
        const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(`${baseUrl}/alerts`, {
          //params: { userId: this.currentUser.id },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.alerts = response.data || [];
        console.log('Fetched alerts:', this.alerts);
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
          message: '🚨 Test emergency alert from frontend',
          device_id: this.currentUser.device_id
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data?.alert) {
          this.alerts.unshift(response.data.alert);
          this.showNotification('✅ Test alert sent successfully');
        }
      } catch (error) {
        console.error('Failed to trigger test alert:', error);
        this.showNotification('❌ Failed to trigger test alert', true);
      } finally {
        this.triggering = false;
      }
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
      } catch (error) {
        console.error('Failed to update alert:', error);
        this.showNotification('❌ Failed to update alert', true);
      }
    },
    showDetails(alert) {
      alert(`Details:\n\nMessage: ${alert.message}\nCreated: ${this.formatFullDate(alert.created_at)}`);
    },
    contactEmergency(alert) {
      if (alert.users?.phone) {
        window.location.href = `tel:${alert.users.phone}`;
      } else {
        this.showNotification('No phone number available.', true);
      }
    },
    getUserName(user) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User';
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
    }
  }
};
</script>

<style scoped>
.alerts-container {
  padding: 2rem;
  max-width: 1000px;
  margin: auto;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-title {
  font-size: 1.5rem;
}
.filter-dropdown {
  padding: 0.5rem;
  font-size: 1rem;
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
</style>
