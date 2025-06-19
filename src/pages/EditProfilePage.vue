<template>
  <div class="edit-profile-page">
    <div class="header">
      <button @click="$router.go(-1)" class="back-button">← Back</button>
      <h2>Edit Profile</h2>
    </div>

    <!-- Error message display -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null" class="close-error">×</button>
    </div>

    <!-- Success message display -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
      <button @click="successMessage = null" class="close-success">×</button>
    </div>

    <div v-if="profile" class="edit-form">
      <form @submit.prevent="updateProfile">
        <div class="form-section">
          <h3>Personal Information</h3>
          <div class="form-row">
            <label>First Name: <input v-model="edit.first_name" /></label>
            <label>Last Name: <input v-model="edit.last_name" /></label>
          </div>
          <div class="form-row">
            <label>Address: <input v-model="edit.address" /></label>
            <label>Phone: <input v-model="edit.phone" /></label>
          </div>
          <div class="form-row">
            <label>Date of Birth: <input v-model="edit.date_of_birth" type="date" /></label>
            <label>Gender: <input v-model="edit.gender" /></label>
          </div>
        </div>

        <div class="form-section">
          <h3>Emergency Contact</h3>
          <div class="form-row">
            <label>Emergency Name: <input v-model="edit.emergency_name" /></label>
            <label>Emergency Phone: <input v-model="edit.emergency_phone" /></label>
          </div>
        </div>

        <div class="form-section">
          <h3>Medical Information</h3>
          <label>Medical Info: <textarea v-model="edit.medical_info" rows="3"></textarea></label>
          <label>Blood Type: <input v-model="edit.blood_type" /></label>
          <label>Allergies: <textarea v-model="edit.allergies" rows="3"></textarea></label>
          <label>Chronic Conditions: <textarea v-model="edit.chronic_conditions" rows="3"></textarea></label>
          <label>Current Medications: <textarea v-model="edit.current_medications" rows="3"></textarea></label>
          <label>Past Surgeries: <textarea v-model="edit.past_surgeries" rows="3"></textarea></label>
        </div>

        <div class="form-section">
          <h3>Healthcare Providers</h3>
          <div class="form-row">
            <label>Primary Care Physician: <input v-model="edit.primary_physician" /></label>
            <label>Physician Contact: <input v-model="edit.physician_contact" /></label>
          </div>
          <label>Preferred Pharmacy: <input v-model="edit.preferred_pharmacy" /></label>
        </div>

        <div class="form-section">
          <h3>Insurance Information</h3>
          <div class="form-row">
            <label>Insurance Provider: <input v-model="edit.insurance_provider" /></label>
            <label>Insurance Policy #: <input v-model="edit.insurance_policy" /></label>
          </div>
        </div>

        <div class="form-section">
          <h3>Additional Information</h3>
          <label>Vaccination Records: <textarea v-model="edit.vaccination_records" rows="3"></textarea></label>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="isLoading" class="save-button">
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
          <button type="button" @click="cancelEdit" :disabled="isLoading" class="cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div v-else-if="isLoading" class="loading">
      <p>Loading profile...</p>
    </div>
    <div v-else class="error">
      <p>Failed to load profile. Please try refreshing the page.</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "EditProfilePage",
  data() {
    return {
      profile: null,
      edit: {},
      error: null,
      successMessage: null,
      isLoading: false
    };
  },
  created() {
    this.fetchProfile();
  },
  methods: {
    async fetchProfile() {
      this.isLoading = true;
      this.error = null;
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        const res = await axios.get(`/api/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.profile = res.data;
        this.edit = { ...res.data };
      } catch (err) {
        console.error('Error fetching profile:', err);
        this.error = err.response?.data?.error || err.message || 'Failed to load profile';
      } finally {
        this.isLoading = false;
      }
    },
    async updateProfile() {
      this.isLoading = true;
      this.error = null;
      this.successMessage = null;
      
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
          throw new Error('Authentication required. Please log in again.');
        }
        
        // Clean up the edit data - remove undefined values
        const cleanEditData = {};
        Object.keys(this.edit).forEach(key => {
          if (this.edit[key] !== undefined && this.edit[key] !== null) {
            cleanEditData[key] = this.edit[key];
          }
        });
        
        const res = await axios.put(`/api/profile/${userId}`, cleanEditData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.profile = res.data;
        this.successMessage = 'Profile updated successfully!';
        
        // Redirect back to profile page after 2 seconds
        setTimeout(() => {
          this.$router.push('/profile');
        }, 2000);
        
      } catch (err) {
        console.error('Error updating profile:', err);
        if (err.response?.data?.errors) {
          const errorMessages = err.response.data.errors.map(e => e.msg).join(', ');
          this.error = `Validation errors: ${errorMessages}`;
        } else {
          this.error = err.response?.data?.error || err.message || 'Failed to update profile';
        }
      } finally {
        this.isLoading = false;
      }
    },
    cancelEdit() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
.edit-profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: #ffffff;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  color: #005f99;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.back-button {
  background: transparent;
  color: #007BFF;
  border: 1px solid #007BFF;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #007BFF;
  color: white;
}

.header h2 {
  margin: 0;
  color: #005f99;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
  position: relative;
}

.success-message {
  background-color: #efe;
  color: #363;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #cfc;
  position: relative;
}

.close-error, .close-success {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

.edit-form {
  background: #f9f9f9;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #ddd;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  color: #005f99;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

input, textarea {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.3rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.save-button {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover:not(:disabled) {
  background: #218838;
}

.cancel-button {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error {
  color: #c33;
}

@media (max-width: 768px) {
  .edit-profile-page {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 