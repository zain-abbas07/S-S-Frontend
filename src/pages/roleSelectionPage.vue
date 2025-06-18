<template>
  <div class="role-selection-container">
    <button class="role-btn" @click="goToCaneUser">
      Are you a cane user?
    </button>
    <button class="role-btn" @click="goToVisitorUser">
      Are you a caregiver?
    </button>
  </div>
</template>

<script>
export default {
  name: 'RoleSelection',
  methods: {
  goToCaneUser() {
    this.$router.push("/signup"); // <-- was "/SignupPage"
  },
  goToVisitorUser() {
    this.$router.push("/caregiver-signup"); // <-- was "/CaregiverSignupPage"
  }
}

};
</script>

<style scoped>
.role-selection-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 100px;
  background: #fff;
}

.role-btn {
  width: 320px;
  padding: 24px 0;
  background: #f9f1fa;
  color: #1976d2;
  font-size: 20px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(44, 44, 44, 0.15);
  cursor: pointer;
  transition: box-shadow 0.2s;
  outline: none;
}

.role-btn:hover {
  box-shadow: 0 4px 16px rgba(44, 44, 44, 0.18);
}
</style>
