<template>
  <div class="signup-page">
    <h2>Sign Up</h2>
    <form @submit.prevent="signup">
      <div class="form-group">
        <label for="role">I am a:</label>
        <select v-model="role" id="role" required>
          <option disabled value="">Select role</option>
          <option value="patient">Patient</option>
          <option value="caregiver">Caregiver</option>
        </select>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input v-model="email" type="email" id="email" required autocomplete="username" placeholder="Enter your email" />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input v-model="password" type="password" id="password" required autocomplete="new-password" placeholder="Enter your password" />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input v-model="confirmPassword" type="password" id="confirmPassword" required autocomplete="new-password" placeholder="Confirm your password" />
      </div>
      <div class="form-group">
        <label for="first_name">First Name</label>
        <input v-model="first_name" id="first_name" type="text" placeholder="First name" />
      </div>
      <div class="form-group">
        <label for="last_name">Last Name</label>
        <input v-model="last_name" id="last_name" type="text" placeholder="Last name" />
      </div>
      <div class="form-group">
        <label for="address">Address</label>
        <input v-model="address" id="address" type="text" placeholder="Address" />
      </div>
      <div class="form-group">
        <label for="phone">Phone</label>
        <input v-model="phone" id="phone" type="text" placeholder="Phone" />
      </div>
      <div class="form-group">
        <label for="emergency_name">Emergency Contact Name</label>
        <input v-model="emergency_name" id="emergency_name" type="text" placeholder="Emergency Contact Name" />
      </div>
      <div class="form-group">
        <label for="emergency_phone">Emergency Contact Phone</label>
        <input v-model="emergency_phone" id="emergency_phone" type="text" placeholder="Emergency Contact Phone" />
      </div>
      <div class="form-group">
        <label for="medical_info">Medical Info</label>
        <textarea v-model="medical_info" id="medical_info" placeholder="Medical Info"></textarea>
      </div>
      <!-- Health & Medical Details -->
      <div class="form-group">
        <label for="date_of_birth">Date of Birth</label>
        <input v-model="date_of_birth" id="date_of_birth" type="date" />
      </div>
      <div class="form-group">
        <label for="gender">Gender</label>
        <input v-model="gender" id="gender" type="text" />
      </div>
      <div class="form-group">
        <label for="blood_type">Blood Type</label>
        <input v-model="blood_type" id="blood_type" type="text" />
      </div>
      <div class="form-group">
        <label for="allergies">Allergies</label>
        <textarea v-model="allergies" id="allergies"></textarea>
      </div>
      <div class="form-group">
        <label for="chronic_conditions">Chronic Conditions</label>
        <textarea v-model="chronic_conditions" id="chronic_conditions"></textarea>
      </div>
      <div class="form-group">
        <label for="current_medications">Current Medications</label>
        <textarea v-model="current_medications" id="current_medications"></textarea>
      </div>
      <div class="form-group">
        <label for="past_surgeries">Past Surgeries</label>
        <textarea v-model="past_surgeries" id="past_surgeries"></textarea>
      </div>
      <div class="form-group">
        <label for="primary_physician">Primary Care Physician</label>
        <input v-model="primary_physician" id="primary_physician" type="text" />
      </div>
      <div class="form-group">
        <label for="physician_contact">Physician Contact</label>
        <input v-model="physician_contact" id="physician_contact" type="text" />
      </div>
      <div class="form-group">
        <label for="preferred_pharmacy">Preferred Pharmacy</label>
        <input v-model="preferred_pharmacy" id="preferred_pharmacy" type="text" />
      </div>
      <div class="form-group">
        <label for="insurance_provider">Insurance Provider</label>
        <input v-model="insurance_provider" id="insurance_provider" type="text" />
      </div>
      <div class="form-group">
        <label for="insurance_policy">Insurance Policy #</label>
        <input v-model="insurance_policy" id="insurance_policy" type="text" />
      </div>
      <div class="form-group">
        <label for="vaccination_records">Vaccination Records</label>
        <textarea v-model="vaccination_records" id="vaccination_records"></textarea>
      </div>
      <button type="submit" :disabled="loading">
        <span v-if="loading">Signing up...</span>
        <span v-else>Sign Up</span>
      </button>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
    </form>
    <p>
      Already have an account?
      <router-link to="/login">Login here</router-link>
    </p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SignupPage",
  data() {
    return {
      role: "",
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
      address: "",
      phone: "",
      emergency_name: "",
      emergency_phone: "",
      medical_info: "",
      date_of_birth: "",
      gender: "",
      blood_type: "",
      allergies: "",
      chronic_conditions: "",
      current_medications: "",
      past_surgeries: "",
      primary_physician: "",
      physician_contact: "",
      preferred_pharmacy: "",
      insurance_provider: "",
      insurance_policy: "",
      vaccination_records: "",
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
        this.error = "Passwords do not match.";
        return;
      }
      if (!this.role) {
        this.error = "Please select if you are a patient or caregiver.";
        return;
      }
      this.loading = true;
      try {
        await axios.post("/api/auth/register", {
          email: this.email,
          password: this.password,
          role: this.role,
          first_name: this.first_name,
          last_name: this.last_name,
          address: this.address,
          phone: this.phone,
          emergency_name: this.emergency_name,
          emergency_phone: this.emergency_phone,
          medical_info: this.medical_info,
          date_of_birth: this.date_of_birth,
          gender: this.gender,
          blood_type: this.blood_type,
          allergies: this.allergies,
          chronic_conditions: this.chronic_conditions,
          current_medications: this.current_medications,
          past_surgeries: this.past_surgeries,
          primary_physician: this.primary_physician,
          physician_contact: this.physician_contact,
          preferred_pharmacy: this.preferred_pharmacy,
          insurance_provider: this.insurance_provider,
          insurance_policy: this.insurance_policy,
          vaccination_records: this.vaccination_records
        });
        this.success = "Signup successful! Redirecting to login...";
        setTimeout(() => {
          this.$router.push("/login");
        }, 1500);
      } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
          this.error = err.response.data.error;
        } else if (err.response && err.response.data && err.response.data.errors) {
          this.error = err.response.data.errors.map(e => e.msg).join(", ");
        } else {
          this.error = "Signup failed. Please try again.";
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
input[type="password"],
input[type="text"],
select,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-size: 1rem;
}
textarea {
  min-height: 60px;
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