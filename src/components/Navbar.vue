<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-brand">
        <router-link to="/profile">Smart Safety</router-link>
      </div>

      <ul class="navbar-links">
        <li v-if="isLoggedIn"><router-link to="/profile-account">Profile</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/calendar">Calendar</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/map">Map</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/voice-chat">Voice Chat</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/subscription">Subscription</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/medical-records">Medical Records</router-link></li>
        
        <!-- ✅ Conditionally render Link Account -->
        <li v-if="isLoggedIn && (userRole === 'patient' || userRole === 'caregiver')">
          <router-link to="/link-account">Link Account</router-link>
        </li>

        <li v-if="isLoggedIn">
          <router-link to="/alerts">
            Alerts <span v-if="hasActiveAlerts" style="color: red;">!</span>
          </router-link>
        </li>

        
        <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/role-selection">Signup</router-link></li>
      </ul>

      <div class="navbar-user" v-if="isLoggedIn">
        <span>Welcome, {{ userName }}</span>
        <button @click="logout">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script>
import { eventBus } from '@/eventBus';

export default {
  name: "AppNavbar",
  data() {
    return {
      userName: null,
      isLoggedIn: false,
      userRole: null,
      hasActiveAlerts: false,
      previousAlertIds: []
    };
  },
  created() {
    this.setUser();
    this.checkActiveAlerts();
    eventBus.on('alerts-updated', this.checkActiveAlerts);
  },
  mounted() {
    console.log('Navbar mounted!');
    this.checkActiveAlerts();
    this.alertCheckInterval = setInterval(this.checkActiveAlerts, 10000);
  },
  beforeDestroy() {
    clearInterval(this.alertCheckInterval);
    eventBus.off('alerts-updated', this.checkActiveAlerts);
  },
  watch: {
    $route() {
      this.setUser();
    }
  },
  methods: {
    setUser() {
      const token = localStorage.getItem("token");
      this.isLoggedIn = !!token;

      const profile = JSON.parse(localStorage.getItem("profile") || "null");
      const role = localStorage.getItem("role"); // Fetch role from localStorage
      this.userRole = role;

      console.log("[Navbar] role:", role); // ✅ Debug log

      if (profile && profile.first_name) {
        this.userName = profile.first_name;
      } else {
        this.userName = null;
      }
    },
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("patientId");
      localStorage.removeItem("profile");
      localStorage.removeItem("role");
      this.isLoggedIn = false;
      this.userName = null;
      this.$router.push("/login");
    },
    async checkActiveAlerts() {
      const token = localStorage.getItem("token");
      let profile = JSON.parse(localStorage.getItem("profile") || "null");
      if (!profile) {
        profile = JSON.parse(localStorage.getItem("user") || "null");
      }
      const patientId = localStorage.getItem("patientId");

      try {
        if (!token || !profile) return;

        let url = "";
        if (profile.role === "caregiver") {
          url = "/api/alerts/for-caregiver";
        } else if (profile.role === "patient" || profile.role === "USER") {
          if (!patientId) return;
          url = `/api/alerts?patientId=${patientId}`;
        } else {
          return;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const alerts = await response.json();
        this.hasActiveAlerts = alerts.some(alert => alert.handled === false);

        const unhandledAlerts = alerts.filter(alert => alert.handled === false);
        const newIds = unhandledAlerts.map(a => a.id);
        if (this.previousAlertIds.length > 0) {
          const newAlertFound = newIds.some(id => !this.previousAlertIds.includes(id));
          if (newAlertFound) {
            if (window.eventBus) {
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
  background: #42b983;
  color: #fff;
  z-index: 1000;
  box-shadow: 0 2px 8px #0002;
}
.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.5rem 1.5rem;
}
.navbar-brand {
  font-size: 1.4rem;
  font-weight: bold;
}
.navbar-links {
  list-style: none;
  display: flex;
  gap: 1.2rem;
  margin: 0;
  padding: 0;
}
.navbar-links li {
  display: inline-block;
}
.navbar-links a {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.navbar-links a.router-link-exact-active {
  text-decoration: underline;
}
.navbar-links a:hover {
  color: #e0f2f1;
}
.navbar-user {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.navbar-user button {
  background: #fff;
  color: #42b983;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.8rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}
.navbar-user button:hover {
  background: #e0f2f1;
}
</style>
