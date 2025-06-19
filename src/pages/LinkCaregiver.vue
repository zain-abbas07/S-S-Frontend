<template>
  <div class="link-patient-form">
    <h2>Link to a Patient</h2>
    <form @submit.prevent="linkPatient">
      <label for="patientId">Enter Patient ID:</label>
      <input
        v-model="patientId"
        type="number"
        id="patientId"
        required
        placeholder="Paste the patient ID here"
      />
      <button type="submit" :disabled="loading">
        <span v-if="loading">Linking...</span>
        <span v-else>Link Patient</span>
      </button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LinkCaregiver',
  data() {
    return {
      patientId: '',
      error: '',
      successMessage: '',
      loading: false,
    };
  },
  methods: {
    async linkPatient() {
      this.loading = true;
      this.error = '';
      this.successMessage = '';
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        this.error = 'Missing user ID or token';
        this.loading = false;
        return;
      }

      try {
        const response = await axios.post('/api/caregivers/link-patient', {
          user_id: parseInt(userId),
          patient_id: parseInt(this.patientId)
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        this.successMessage = `Successfully linked to patient ID ${this.patientId}`;
        this.patientId = '';
        
        // Redirect to dashboard after successful linking
        setTimeout(() => {
          if (this.$route.path !== '/caregiver-dashboard') {
            this.$router.push('/caregiver-dashboard');
          }
        }, 2000);
      } catch (err) {
        console.error(err);
        this.error = err.response?.data?.error || 'Failed to link patient';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.link-patient-form {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #0001;
  text-align: center;
}
input {
  margin-top: 1rem;
  padding: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
}
button:disabled {
  background-color: #b2dfdb;
}
.error {
  color: red;
  margin-top: 1rem;
}
.success {
  color: green;
  margin-top: 1rem;
}
</style>
