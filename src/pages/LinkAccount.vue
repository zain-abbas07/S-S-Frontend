<template>
  <div>
    <LinkPage v-if="role === 'patient'" />
    <LinkCaregiver v-else-if="role === 'caregiver'" />
    <div v-else class="text-red-500 p-4 text-center">
      Unknown or missing role. Please log in again.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LinkPage from './LinkPage.vue'
import LinkCaregiver from './LinkCaregiver.vue'

const role = ref(null)

onMounted(() => {
  const storedRole = localStorage.getItem('role')
  if (storedRole) {
    role.value = storedRole.toLowerCase()
  }
})
</script>
