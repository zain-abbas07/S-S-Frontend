<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-brand">
        <router-link to="/profile">Smart Safety</router-link>
      </div>
        
      <ul class="navbar-links">
        <li v-if="isLoggedIn"><router-link to="/profile">Profile</router-link></li>
        
        <!-- Caregiver-specific navigation -->
        <li v-if="isLoggedIn && (isCaregiver || userRole === 'caregiver')">
          <router-link to="/caregiver-dashboard">Dashboard</router-link>
        </li>
        <li v-if="isLoggedIn && (isCaregiver || userRole === 'caregiver')">
          <router-link to="/link-caregiver">Link Patient</router-link>
        </li>
        
        <!-- Patient-specific navigation -->
        <li v-if="isLoggedIn && (userRole === 'patient' || userRole === 'USER') && !isCaregiver">
          <router-link to="/link-patient">Patient ID</router-link>
        </li>
        
        <!-- Common navigation -->
        <li v-if="isLoggedIn"><router-link to="/calendar">Calendar</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/map">Map</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/voice-chat">Voice Chat</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/subscription">Subscription</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/medical-records">Medical Records</router-link></li>
        <li v-if="isLoggedIn">
          <router-link to="/alerts">
            Alerts <span v-if="hasActiveAlerts" style="color: red;">!</span>
          </router-link>
        </li>
        <li v-if="isLoggedIn"><router-link to="/login">Logout</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/role-selection">Signup</router-link></li>
      </ul>
      <div class="navbar-user" v-if="isLoggedIn && userName">
        <span>Welcome, {{ userName }}</span>
        <button @click="logout">Logout</button>
      </div>
    </div>
  </nav>
</template>
  
  <script>
  import { eventBus } from '@/eventBus';
  import axios from 'axios';

  export default {
    name: "AppNavbar",
    data() {
      return {
        userName: null,
        isLoggedIn: false,
        isCaregiver: false,
        userRole: null,
        hasActiveAlerts: false,
        previousAlertIds: []
      };
    },
    async created() {
      this.setUser();
      await this.checkUserRole();
      this.checkActiveAlerts();
      eventBus.on('alerts-updated', this.checkActiveAlerts);
    },
    mounted() {
      console.log('Navbar mounted!');
      this.checkActiveAlerts();
      this.alertCheckInterval = setInterval(this.checkActiveAlerts, 10000); // every 10 seconds
    },
    beforeDestroy() {
      clearInterval(this.alertCheckInterval);
      eventBus.off('alerts-updated', this.checkActiveAlerts);
    },
    watch: {
      $route() {
        this.setUser();
        this.checkUserRole();
      }
    },
    methods: {
      setUser() {
        const token = localStorage.getItem("token");
        this.isLoggedIn = !!token;
        const profile = JSON.parse(localStorage.getItem("profile") || "null");
        if (profile && profile.first_name) {
          this.userName = profile.first_name;
          this.userRole = profile.role || null;
        } else {
          this.userName = null;
          this.userRole = null;
        }
      },
      
      async checkUserRole() {
        try {
          const userId = localStorage.getItem('userId');
          const token = localStorage.getItem('token');
          
          if (!userId || !token) return;
          
          // Check if user is a caregiver
          const response = await axios.get(`/api/caregivers?user_id=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          this.isCaregiver = response.data.length > 0;
        } catch (err) {
          console.error('Error checking user role:', err);
          this.isCaregiver = false;
        }
      },
      
      logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("patientId");
        localStorage.removeItem("profile");
        this.isLoggedIn = false;
        this.userName = null;
        this.isCaregiver = false;
        this.$router.push("/login");
      },
      
      async checkActiveAlerts() {
        const token = localStorage.getItem("token");
        let profile = JSON.parse(localStorage.getItem("profile") || "null");
        if (!profile) {
          profile = JSON.parse(localStorage.getItem("user") || "null");
        }
        const patientId = localStorage.getItem("patientId");
        console.log('[Navbar] token:', token);
        console.log('[Navbar] profile:', profile);
        console.log('[Navbar] profile.role:', profile && profile.role);
        console.log('[Navbar] patientId:', patientId);
        try {
          if (!token || !profile) return;

          let url = "";

          if (profile.role === "caregiver" || this.isCaregiver) {
            // For caregivers, get all alerts for their linked patients
            url = "/api/alerts/for-caregiver";
          } else if (profile.role === "patient" || profile.role === "USER") {
            if (!patientId) return;
            url = `/api/alerts?patient_id=${patientId}`;
          } else {
            return; // not a role that should fetch alerts
          }

          console.log('[Navbar] Fetching alerts from:', url);
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (!response.ok) {
            console.error('[Navbar] Alerts API error:', response.status, response.statusText);
            // If it's a 404 for caregiver, they might not have a caregiver record yet
            if (response.status === 404 && (profile.role === "caregiver" || this.isCaregiver)) {
              console.log('[Navbar] No caregiver record found, setting empty alerts');
              this.hasActiveAlerts = false;
              this.previousAlertIds = [];
            }
            return;
          }

          const alerts = await response.json();
          console.log('[Navbar] Received alerts:', alerts);
          
          // Ensure alerts is an array
          const alertsArray = Array.isArray(alerts) ? alerts : [];
          this.hasActiveAlerts = alertsArray.some(alert => alert.handled === false);
          console.log('[Navbar] hasActiveAlerts:', this.hasActiveAlerts);
          
          // New alert notification logic
          const unhandledAlerts = alertsArray.filter(alert => alert.handled === false);
          const newIds = unhandledAlerts.map(a => a.id);
          console.log('[Navbar] Previous unhandled IDs:', this.previousAlertIds, 'New unhandled IDs:', newIds);
          if (this.previousAlertIds.length > 0) {
            const newAlertFound = newIds.some(id => !this.previousAlertIds.includes(id));
            console.log('[Navbar] New unhandled alert found:', newAlertFound);
            if (newAlertFound) {
              console.log('[Navbar] Emitting global-notification event');
              // Always emit via eventBus and ensure message is set
              if (typeof require === 'function') {
                try {
                  const { eventBus } = require('@/eventBus');
                  eventBus.emit('global-notification', { message: 'New emergency alert received!', type: 'info' });
                } catch (e) {
                  // fallback if require fails
                  if (window.eventBus) {
                    window.eventBus.emit('global-notification', { message: 'New emergency alert received!', type: 'info' });
                  }
                }
              } else if (window.eventBus) {
                window.eventBus.emit('global-notification', { message: 'New emergency alert received!', type: 'info' });
              }
            }
          }
          this.previousAlertIds = newIds;
        } catch (err) {
          console.error("Failed to check alerts:", err);
        }
      }
    }
  };
  
  </script>
  
  <style scoped>
.navbar {
  position: sticky;
  top: 0;
  width: 100%;
  background: #ffffff;
  color: #005f99;
  z-index: 1000;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: none;
  padding: 0.5rem 1rem;
}

.navbar-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 100%;
}

.navbar-brand {
  font-size: 1.4rem;
  font-weight: bold;
  color: #000;
}

.navbar-links {
  list-style: none;
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
}

.navbar-links li {
  display: inline-block;
}

.navbar-links a {
  text-decoration: none;
  font-weight: bold;
  color: #007BFF;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.navbar-links a.router-link-exact-active,
.navbar-links a:hover {
  background-color: #e6f0ff;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.navbar-user button {
  background: black;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.4rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.navbar-user button:hover {
  background: #222;
}

  </style>