<template>
  <div class="caregiver-profile" v-if="caregiver">
    <h2>Caregiver Profile</h2>

    <div v-if="!editMode">
      <p><strong>First Name:</strong> {{ caregiver.first_name || '-' }}</p>
      <p><strong>Last Name:</strong> {{ caregiver.last_name || '-' }}</p>
      <p><strong>Email:</strong> {{ caregiver.email }}</p>

      <button @click="editMode = true" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">Edit Profile</button>
    </div>

    <div v-else class="edit-form">
      <h3>Edit Profile</h3>
      <form @submit.prevent="updateProfile">
        <label>First Name: <input v-model="edit.first_name" /></label><br />
        <label>Last Name: <input v-model="edit.last_name" /></label><br />
        <label>Email: <input v-model="edit.email" type="email" /></label><br />

        <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded mt-2">Save</button>
        <button type="button" @click="editMode = false" class="bg-gray-500 text-white px-4 py-2 rounded ml-2">Cancel</button>
      </form>
    </div>

    <div v-if="patients.length > 0" class="mt-6">
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

  <div v-else>
    <p>Loading caregiver information...</p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CaregiverProfile',
  data() {
    return {
      caregiver: null,
      patients: [],
      edit: {},
      editMode: false,
      error: null,
    }
  },
  async created() {
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      const res = await axios.get(`/api/caregivers/${userId}/linked-patients`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      this.caregiver = res.data.caregiver
      this.patients = res.data.patients
      this.edit = { ...res.data.caregiver } // Prepare editable copy
    } catch (err) {
      console.error('[CaregiverProfile.vue] Error fetching data:', err)
      this.error = err.response?.data?.error || 'Failed to load caregiver profile.'
    }
  },
  methods: {
  async updateProfile() {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const res = await axios.put(
        `/api/users/caregivers/by-user/${userId}/update-profile`,
        this.edit,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      this.caregiver = res.data;
      this.editMode = false;
    } catch (err) {
      console.error('[CaregiverProfile.vue] Update error:', err);
      this.error = err.response?.data?.error || 'Failed to update caregiver profile.';
      alert(this.error);
    }
  },
}

}
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

.edit-form label {
  display: block;
  margin-bottom: 0.8rem;
}

.edit-form input {
  width: 100%;
  padding: 0.4rem;
  margin-top: 0.2rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
