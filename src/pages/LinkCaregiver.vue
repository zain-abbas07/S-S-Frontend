<template>
  <div class="link-page">
    <h2 class="text-xl font-semibold mb-4">Link to Patient</h2>

    <input
      v-model="inputPatientId"
      type="number"
      placeholder="Enter Patient ID"
      class="border p-2 rounded w-full mb-4"
    />

    <button
      @click="linkPatient"
      class="bg-blue-600 text-white px-4 py-2 rounded w-full"
    >
      Link Patient
    </button>

    <p v-if="successMessage" class="text-green-600 mt-4">{{ successMessage }}</p>
    <p v-if="errorMessage" class="text-red-600 mt-4">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const inputPatientId = ref('')
const successMessage = ref('')
const errorMessage = ref('')

const linkPatient = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  const userId = localStorage.getItem('userId')
  const token = localStorage.getItem('token')

  if (!userId || !token) {
    errorMessage.value = 'You must be logged in as a caregiver.'
    return
  }

  try {
    // Step 1: Get caregiver record by userId
    const caregiverRes = await axios.get(`/api/caregivers?user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!caregiverRes.data.length) {
      errorMessage.value = 'No caregiver record found for your account.'
      return
    }

    const caregiverId = caregiverRes.data[0].id

    // Step 2: Link caregiver to patient
    const linkRes = await axios.post('/api/caregivers/link-patient', {
      caregiverId,
      patientId: Number(inputPatientId.value)
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    successMessage.value = linkRes.data.message || 'Linked successfully.'
    inputPatientId.value = ''
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Error linking patient.'
    console.error(err)
  }
}
</script>

<style scoped>
.link-page {
  max-width: 420px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
</style>
