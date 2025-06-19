<template>
    <div class="medical-records-page">
      <div class="page-header">
        <button v-if="isViewingOtherPatient" @click="goBackToPatient" class="back-button">
          ← Back to Patient
        </button>
        <h2>{{ isViewingOtherPatient ? `${patientName} - Medical Records` : 'Medical Records' }}</h2>
        <div v-if="isViewingOtherPatient" class="viewing-indicator">
          <span>👁️ Viewing as Caregiver</span>
        </div>
      </div>
      
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="loading">Loading records...</div>
      <div v-else>
        <ul class="record-list">
          <li v-for="record in records" :key="record.record_id" class="record-item">
            <div v-if="editId !== record.record_id">
              <strong>{{ record.medical_condition || 'No Condition' }}</strong>
              <div><em>{{ formatDate(record.created_at) }}</em></div>
              <div>{{ record.notes }}</div>
              <!-- Only show edit/delete buttons if not viewing as caregiver -->
              <div v-if="!isViewingOtherPatient" class="record-actions">
                <button @click="startEdit(record)">Edit</button>
                <button @click="deleteRecord(record.record_id)">Delete</button>
              </div>
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
      
      <!-- Only show add record form if not viewing as caregiver -->
      <div v-if="!isViewingOtherPatient" class="add-record">
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
        },
        patientName: null
      };
    },
    computed: {
      isViewingOtherPatient() {
        return this.$route.params.id && this.$route.params.id !== localStorage.getItem('patientId');
      }
    },
    async created() {
      await this.fetchRecords();
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
          // Get patientId from route params or localStorage
          const patientId = this.$route.params.id || localStorage.getItem("patientId");
          const token = localStorage.getItem("token");
          
          if (!patientId || !token) {
            throw new Error('Missing patient ID or authentication token');
          }
          
          const res = await axios.get(`/api/medical/patient/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.records = res.data;
          
          // Set patient name for display
          if (this.isViewingOtherPatient) {
            this.patientName = localStorage.getItem('viewingPatientName') || `Patient ${patientId}`;
          }
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
          const patientId = this.$route.params.id || localStorage.getItem("patientId");
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
      },
      
      goBackToPatient() {
        const patientId = this.$route.params.id;
        this.$router.push(`/patient/${patientId}`);
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.page-header h2 {
  margin: 0;
  color: #007bff;
}

.back-button {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #5a6268;
}

.viewing-indicator {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
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

.record-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.record-actions button {
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

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .record-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .record-actions button {
    margin-right: 0;
  }
}
</style>