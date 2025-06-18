<template>
  <div class="details-container" v-if="alert">
    <h2>🚨 Alert Details</h2>

    <div class="info-section">
      <p><strong>Status:</strong> 
        <span :class="alert.handled ? 'badge handled' : 'badge active'">
          {{ alert.handled ? 'Handled' : 'Active' }}
        </span>
      </p>
      <p><strong>Message:</strong> {{ alert.message }}</p>
      <p><strong>Created At:</strong> {{ formatFullDate(alert.created_at) }}</p>
      <p><strong>Device:</strong> {{ alert.devices?.name || alert.device_id }}</p>
    </div>

    <div class="user-section" v-if="alert.patients?.users">
      <h3>👤 Patient Info</h3>
      <p><strong>Name:</strong> {{ getUserName(alert) }}</p>
      <p><strong>Phone:</strong> 
        <span v-if="alert.patients.users.phone">
          <a :href="`tel:${alert.patients.users.phone}`">{{ alert.patients.users.phone }}</a>
        </span>
        <span v-else>N/A</span>
      </p>
      <button 
        class="btn call-btn" 
        v-if="alert.patients.users.phone"
        @click="callPatient(alert.patients.users.phone)"
      >
        📞 Call Patient
      </button>
    </div>

    <div class="map-section" v-if="alert.lat && alert.lng">
      <h3>📍 Alert Location</h3>
      <iframe
        :src="`https://maps.google.com/maps?q=${alert.lat},${alert.lng}&z=15&output=embed`"
        width="100%"
        height="300"
        style="border:0; border-radius: 10px;"
        allowfullscreen
        loading="lazy"
      ></iframe>
      <p>
        <a 
          :href="`https://maps.google.com/?q=${alert.lat},${alert.lng}`" 
          target="_blank" 
          class="map-link"
        >
          Open in Google Maps →
        </a>
      </p>
    </div>

    <router-link to="/alerts" class="btn back-btn">← Back to Alerts</router-link>
  </div>
</template>


<script>
import axios from 'axios';

export default {
  name: 'AlertDetails',
  props: ['id'],
  data() {
    return {
      alert: null,
      error: null
    };
  },
  async created() {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${baseUrl}/alerts/${this.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.alert = response.data;
    } catch (err) {
      this.error = err.response?.data?.error || 'Failed to fetch alert details.';
    }
  },
  methods: {
    getUserName(alert) {
      if (alert.patients?.users) {
        const user = alert.patients.users;
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User';
      }
      return 'Unknown User';
    },
    formatFullDate(dateString) {
      return new Date(dateString).toLocaleString();
    },
    callPatient(phone) {
    window.location.href = `tel:${phone}`;
    }

  }
};
</script>

<style scoped>
.details-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
}
.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #60a5fa;
  color: white;
  border: none;
  border-radius: 5px;
  text-decoration: none;
}
.details-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

h2 {
  margin-bottom: 1rem;
}

.info-section, .user-section, .map-section {
  margin-bottom: 1.5rem;
}

.badge {
  padding: 0.2rem 0.6rem;
  border-radius: 5px;
  font-size: 0.85rem;
  color: white;
}
.badge.handled {
  background-color: #10b981;
}
.badge.active {
  background-color: #ef4444;
}

.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.6rem 1rem;
  background-color: #60a5fa;
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
}
.call-btn {
  background-color: #fbbf24;
}
.back-btn {
  background-color: #6b7280;
}

.map-link {
  color: #2563eb;
  text-decoration: none;
}
.map-link:hover {
  text-decoration: underline;
}

</style>
