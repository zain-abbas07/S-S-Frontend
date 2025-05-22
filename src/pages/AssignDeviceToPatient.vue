<template>
  <div class="assign-device-container">
    <h2>🔗 Assign Device to Patient</h2>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else>
      <label for="device">Select Device:</label>
      <select v-model="selectedDeviceId">
        <option disabled value="">-- Select a device --</option>
        <option v-for="device in devices" :key="device.id" :value="device.id">
          {{ device.name }} (MAC: {{ device.mac }})
        </option>
      </select>

      <label for="patient" class="mt-4">Select Patient:</label>
      <select v-model="selectedPatientId">
        <option disabled value="">-- Select a patient --</option>
        <option v-for="patient in patients" :key="patient.id" :value="patient.id">
          {{ patient.users.first_name }} {{ patient.users.last_name }}
        </option>
      </select>

      <button @click="assignDevice" :disabled="!selectedDeviceId || !selectedPatientId" class="assign-btn">
        Assign
      </button>

      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AssignDeviceToPatient',
  data() {
    return {
      devices: [],
      patients: [],
      selectedDeviceId: '',
      selectedPatientId: '',
      loading: true,
      successMessage: '',
      errorMessage: ''
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.errorMessage = '❌ Please log in to access this feature.';
          this.loading = false;
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const [devicesRes, patientsRes] = await Promise.all([
          axios.get('/api/devices', { headers }),
          axios.get('/api/patients?includeUser=true', { headers })
        ]);

        if (devicesRes.data && patientsRes.data) {
          this.devices = devicesRes.data;
          this.patients = patientsRes.data;
          this.errorMessage = '';
        } else {
          throw new Error('Invalid response data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 401) {
            this.errorMessage = '❌ Please log in to access this feature.';
          } else if (err.response.status === 403) {
            this.errorMessage = '❌ You do not have permission to access this feature.';
          } else {
            this.errorMessage = `❌ Server error: ${err.response.data?.error || 'Failed to load devices or patients'}`;
          }
        } else if (err.request) {
          // The request was made but no response was received
          this.errorMessage = '❌ Unable to connect to the server. Please check your connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          this.errorMessage = '❌ Failed to load devices or patients. Please try again.';
        }
      } finally {
        this.loading = false;
      }
    },
    async assignDevice() {
      if (!this.selectedPatientId) {
        this.errorMessage = '❌ Please select a patient first.';
        return;
      }

      if (!this.selectedDeviceId) {
        this.errorMessage = '❌ Please select a device first.';
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.errorMessage = '❌ Please log in to perform this action.';
          return;
        }

        await axios.put(
          `/api/devices/${this.selectedDeviceId}`,
          { patient_id: this.selectedPatientId },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        this.successMessage = '✅ Device successfully assigned to patient.';
        this.errorMessage = '';
        
        // Clear selections after successful assignment
        this.selectedDeviceId = '';
        this.selectedPatientId = '';
        
        // Refresh the data
        await this.fetchData();
      } catch (err) {
        console.error('Error assigning device:', err);
        if (err.response) {
          if (err.response.status === 400) {
            this.errorMessage = '❌ Invalid patient or device selection.';
          } else if (err.response.status === 401) {
            this.errorMessage = '❌ Please log in to perform this action.';
          } else if (err.response.status === 403) {
            this.errorMessage = '❌ You do not have permission to assign devices.';
          } else {
            this.errorMessage = `❌ Server error: ${err.response.data?.error || 'Failed to assign device'}`;
          }
        } else if (err.request) {
          this.errorMessage = '❌ Unable to connect to the server. Please check your connection.';
        } else {
          this.errorMessage = '❌ Failed to assign device. Please try again.';
        }
        this.successMessage = '';
      }
    }
  }
};
</script>

<style scoped>
.assign-device-container {
  max-width: 500px;
  margin: auto;
  padding: 1.5rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
label {
  display: block;
  margin: 1rem 0 0.3rem;
}
select {
  width: 100%;
  padding: 0.4rem;
}
button.assign-btn {
  margin-top: 1.2rem;
  padding: 0.6rem 1.2rem;
  background-color: #2c7be5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button.assign-btn:disabled {
  background-color: #bbb;
}
.success {
  color: green;
  margin-top: 1rem;
}
.error {
  color: red;
  margin-top: 1rem;
}
.loading {
  text-align: center;
  padding: 2rem;
}
</style>
