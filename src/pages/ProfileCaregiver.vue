<template>
  <div class="caregiver-profile">
    <h2>Caregiver Profile</h2>

     <p v-if="error" style="color: red;">{{ error }}</p>

    <div v-if="caregiver">
      <p><strong>First Name:</strong> {{ caregiver.first_name || '-' }}</p>
      <p><strong>Last Name:</strong> {{ caregiver.last_name || '-' }}</p>
      <p><strong>Email:</strong> {{ caregiver.email }}</p>
    </div>
    <div v-else-if="!error">
        <p>Loading caregiver information...</p>
    </div>
    <div v-else>
        <p style="color: red;">{{ error }}</p>
    </div>


    <div v-if="patients.length > 0">
      <h3>Linked Patients</h3>
      <ul>
        <li v-for="(patient, index) in patients" :key="index" class="patient-card">
          <p><strong>First Name:</strong> {{ patient.first_name || '-' }}</p>
          <p><strong>Last Name:</strong> {{ patient.last_name || '-' }}</p>
          <p><strong>Email:</strong> {{ patient.email }}</p>
          <p><strong>Phone:</strong> {{ patient.phone || '-' }}</p>
          <p><strong>Address:</strong> {{ patient.address || '-' }}</p>
        </li>
      </ul>
    </div>
    <div v-else-if="caregiver">
      <p>No patients linked to this caregiver.</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "CaregiverProfile",
  data() {
    return {
      caregiver: null,
      patients: [],
      error: null
    };
  },
    async created() {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const res = await axios.get(`/api/caregivers/${userId}/linked-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      this.caregiver = res.data.caregiver;
      this.patients = res.data.patients;
    } catch (err) {
      console.error('[CaregiverProfile.vue] Error fetching data:', err); // ✅ ADD THIS
      this.error = err.response?.data?.error || "Failed to load caregiver profile.";
    }
  }
};
</script>

<style scoped>
.caregiver-profile {
  max-width: 600px;
  margin: 2rem auto;
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px #0002;
}

.patient-card {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f7f7f7;
  border-radius: 8px;
  box-shadow: 0 1px 4px #ccc;
}
</style>
