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
      loading: false,
    };
  },
  methods: {
    async linkPatient() {
      this.loading = true;
      this.error = '';
      const caregiverId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!caregiverId || !token) {
        this.error = 'Missing caregiver ID or token';
        this.loading = false;
        return;
      }

      try {
        await axios.post(`/api/caregivers/${caregiverId}/patients`, {
          patient_id: parseInt(this.patientId)
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        alert(`Successfully linked to patient ID ${this.patientId}`);
        this.patientId = '';
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
</style>
