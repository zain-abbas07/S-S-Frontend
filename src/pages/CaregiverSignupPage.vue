<template>
  <div class="signup-page">
    <h2>Caregiver Sign Up</h2>
    <form @submit.prevent="signup">
      <div class="form-group">
        <label for="first_name">First Name</label>
        <input v-model="first_name" id="first_name" type="text" required placeholder="First name" />
      </div>
      <div class="form-group">
        <label for="last_name">Last Name</label>
        <input v-model="last_name" id="last_name" type="text" required placeholder="Last name" />
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input v-model="email" id="email" type="email" required autocomplete="username" placeholder="Enter your email" />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input v-model="password" id="password" type="password" required autocomplete="new-password" placeholder="Enter your password" />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input v-model="confirmPassword" id="confirmPassword" type="password" required autocomplete="new-password" placeholder="Confirm your password" />
      </div>
      <button type="submit" :disabled="loading">
        <span v-if="loading">Signing up...</span>
        <span v-else>Sign Up</span>
      </button>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CaregiverSignupPage',
  data() {
    return {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      error: null,
      success: null,
      loading: false
    };
  },
  methods: {
    async signup() {
      this.error = null;
      this.success = null;
      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match.';
        return;
      }
      this.loading = true;
      try {
        await axios.post('/api/auth/register', {
          first_name: this.first_name,
          last_name: this.last_name,
          email: this.email,
          password: this.password,
          role: 'caregiver'
        });
        this.success = 'Signup successful! Redirecting to login...';
        setTimeout(() => {
          this.$router.push('/login');
        }, 1500);
      } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
          this.error = err.response.data.error;
        } else if (err.response && err.response.data && err.response.data.errors) {
          this.error = err.response.data.errors.map(e => e.msg).join(', ');
        } else {
          this.error = 'Signup failed. Please try again.';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.signup-page {
  max-width: 500px;
  margin: 3rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #0001;
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
input[type="password"],
input[type="text"] {
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
.success {
  color: #388e3c;
  margin-top: 1rem;
  text-align: center;
}
</style>