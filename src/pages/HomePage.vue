<template>
  <div class="home">
    <h1>Welcome to S&S App</h1>
    <div class="actions">
      <router-link to="/login" class="btn">Login</router-link>
      <router-link to="/signup" class="btn">Sign Up</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

h1 {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn:first-child {
  background-color: #42b983;
  color: white;
}

.btn:last-child {
  background-color: white;
  color: #42b983;
  border: 2px solid #42b983;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
