<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-brand">
        <router-link to="/profile">Smart Safety</router-link>

        </div>
        
      
      <ul class="navbar-links">
        <li v-if="isLoggedIn"><router-link to="/profile">Profile</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/calendar">Calendar</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/map">Map</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/voice-chat">Voice Chat</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/subscription">Subscription</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/medical-records">Medical Records</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/alerts">Alerts</router-link></li>
        <li v-if="isLoggedIn"><router-link to="/login">Logout</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/login">Login</router-link></li>
        <li v-if="!isLoggedIn"><router-link to="/signup">Signup</router-link></li>
      </ul>
      <div class="navbar-user" v-if="isLoggedIn && userName">
        <span>Welcome, {{ userName }}</span>
        <button @click="logout">Logout</button>
      </div>
    </div>
  </nav>
</template>
  
  <script>
  export default {
    name: "AppNavbar",
    data() {
      return {
        userName: null,
        isLoggedIn: false
      };
    },
    created() {
      this.setUser();
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
        this.isLoggedIn = false;
        this.userName = null;
        this.$router.push("/login");
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