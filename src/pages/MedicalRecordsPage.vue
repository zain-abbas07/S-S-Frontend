<template>
    <div class="medical-records-page">
      <h2>Medical Records</h2>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="loading">Loading records...</div>
      <div v-else>
        <ul class="record-list">
          <li v-for="record in records" :key="record.record_id" class="record-item">
            <div v-if="editId !== record.record_id">
              <strong>{{ record.medical_condition || 'No Condition' }}</strong>
              <div><em>{{ formatDate(record.created_at) }}</em></div>
              <div>{{ record.notes }}</div>
              <button @click="startEdit(record)">Edit</button>
              <button @click="deleteRecord(record.record_id)">Delete</button>
            </div>
            <div v-else>
              <form @submit.prevent="saveEdit(record.record_id)">
                <input v-model="editRecord.medical_condition" placeholder="Medical Condition" required />
                <textarea v-model="editRecord.notes" placeholder="Notes"></textarea>
                <button type="submit">Save</button>
                <button type="button" @click="cancelEdit">Cancel</button>
              </form>
            </div>
          </li>
        </ul>
        <div v-if="records.length === 0">No medical records yet.</div>
      </div>
      <div class="add-record">
        <h3>Add Medical Record</h3>
        <form @submit.prevent="addRecord">
          <div class="form-group">
            <label>Medical Condition</label>
            <input v-model="newRecord.medical_condition" required />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="newRecord.notes"></textarea>
          </div>
          <button type="submit" :disabled="adding">Add Record</button>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    name: "MedicalRecordsPage",
    data() {
      return {
        records: [],
        loading: false,
        error: null,
        adding: false,
        newRecord: {
          medical_condition: "",
          notes: ""
        },
        editId: null,
        editRecord: {
          medical_condition: "",
          notes: ""
        }
      };
    },
    created() {
      this.fetchRecords();
    },
    methods: {
      formatDate(dt) {
        if (!dt) return "-";
        return new Date(dt).toLocaleString();
      },
      async fetchRecords() {
        this.loading = true;
        this.error = null;
        try {
          // Get patientId from localStorage or user profile
          const patientId = localStorage.getItem("patientId");
          const token = localStorage.getItem("token");
          const res = await axios.get(`/api/medical/patient/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.records = res.data;
        } catch (err) {
          this.error = err.response?.data?.error || "Failed to load records";
        } finally {
          this.loading = false;
        }
      },
      async addRecord() {
        this.adding = true;
        this.error = null;
        try {
          const patientId = localStorage.getItem("patientId");
          const token = localStorage.getItem("token");
          await axios.post(
            "/api/medical",
            {
              patient_id: patientId,
              ...this.newRecord
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          this.newRecord = { medical_condition: "", notes: "" };
          this.fetchRecords();
        } catch (err) {
          this.error = err.response?.data?.error || "Failed to add record";
        } finally {
          this.adding = false;
        }
      },
      startEdit(record) {
        this.editId = record.record_id;
        this.editRecord = {
          medical_condition: record.medical_condition,
          notes: record.notes
        };
      },
      cancelEdit() {
        this.editId = null;
        this.editRecord = { medical_condition: "", notes: "" };
      },
      async saveEdit(recordId) {
        this.error = null;
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/medical/${recordId}`,
            { ...this.editRecord },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          this.editId = null;
          this.editRecord = { medical_condition: "", notes: "" };
          this.fetchRecords();
        } catch (err) {
          this.error = err.response?.data?.error || "Failed to update record";
        }
      },
      async deleteRecord(recordId) {
        if (!confirm("Delete this medical record?")) return;
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/medical/${recordId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.fetchRecords();
        } catch (err) {
          this.error = err.response?.data?.error || "Failed to delete record";
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .medical-records-page {
  max-width: 700px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px #0001;
}

.record-list {
  list-style: none;
  padding: 0;
}

.record-item {
  border: 1px solid #ddd;
  background: #fafafa;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.record-item > *:not(:last-child) {
  margin-bottom: 0.5rem;
}

.record-item button {
  margin-right: 0.5rem;
}

.record-item form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-record {
  margin-top: 2rem;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  margin-top: 0.5rem;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
}

button:disabled {
  background: #b2dfdb;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  margin-bottom: 1rem;
  text-align: center;
}

  </style>