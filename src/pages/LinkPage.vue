<template>
  <div class="link-page">
    <h2>Patient Link</h2>
    <p v-if="patientId && typeof patientId === 'number'">Your patient ID: {{ patientId }}</p>
    <p v-else-if="loading">Loading patient ID...</p>
    <p v-else>{{ patientId }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LinkPage',
  data() {
    return {
      patientId: null,
      loading: true,
    };
  },
  async created() {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        this.patientId = 'Missing user ID or token';
        return;
      }

      // First try to get the patient
      const res = await axios.get(`/api/patients?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.length > 0) {
        // Patient already exists
        this.patientId = res.data[0].id;
        localStorage.setItem('patientId', res.data[0].id);
      } else {
        // No patient found, so create one
        const createRes = await axios.post('/api/patients', {
          user_id: parseInt(userId)
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        this.patientId = createRes.data.id;
        localStorage.setItem('patientId', createRes.data.id);
      }
    } catch (err) {
      console.error('Error loading/creating patient:', err);
      this.patientId = 'Error loading patient ID';
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.link-page {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #0001;
  text-align: center;
}
</style>
