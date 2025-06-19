<template>
    <div class="login-page">
      <h2>Login</h2>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            required
            autocomplete="username"
            placeholder="Enter your email"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            required
            autocomplete="current-password"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" :disabled="loading">
          <span v-if="loading">Logging in...</span>
          <span v-else>Login</span>
        </button>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    name: "LoginPage",
    data() {
      return {
        email: "",
        password: "",
        error: null,
        loading: false
      };
    },
    methods: {
      async login() {
        this.error = null;
        this.loading = true;
        try {
          const res = await axios.post("/api/auth/login", {
            email: this.email,
            password: this.password
          });
          const token = res.data.token;
          // Decode user ID from JWT or fetch user info if needed
          // For now, fetch user info from /api/users/me or /api/users?email=...
          // But your JWT payload has user id, so let's decode it:
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.id;
  
          // Store in localStorage
          localStorage.setItem("token", token);
          localStorage.setItem("userId", userId);
          
          // ✅ Step 1: Fetch the user role
          const userRes = await axios.get(`/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const role = userRes.data.role;
          localStorage.setItem("role", role);

          
            // Fetch patientId for this user (if patient)
            try {
            const res = await axios.get(`/api/patients`, {
                params: { user_id: userId },
                headers: { Authorization: `Bearer ${token}` }
            });
            // If this user is a patient, store their patientId
            if (Array.isArray(res.data) && res.data.length > 0) {
                localStorage.setItem("patientId", res.data[0].id);
            }
            } catch (e) {
            // It's ok if not a patient, just skip
            }
          // Redirect to profile or home
          this.$router.push("/profile-account");
        } catch (err) {
          if (err.response && err.response.data && err.response.data.error) {
            this.error = err.response.data.error;
          } else {
            this.error = "Login failed. Please try again.";
          }
        } finally {
          this.loading = false;
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .login-page {
    max-width: 400px;
    margin: 3rem auto;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px #0001;
  }
  h2 {
    margin-bottom: 1.5rem;
  }
  .form-group {
    margin-bottom: 1.2rem;
    text-align: left;
  }
  label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: bold;
  }
  input[type="email"],
  input[type="password"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #bbb;
    border-radius: 4px;
    font-size: 1rem;
  }
  button {
    width: 100%;
    padding: 0.7rem;
    background: #42b983;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    margin-top: 0.5rem;
  }
  button:disabled {
    background: #b2dfdb;
    cursor: not-allowed;
  }
  .error {
    color: #d32f2f;
    margin-top: 1rem;
    text-align: center;
  }
  </style>