<template>
  <div class="home">
    <div class="hero">
      <h1>Welcome to S&S</h1>
      <p>Your one-stop solution for managing your patient's needs</p>
      <div class="cta-buttons">
        <router-link to="/login" class="btn btn-primary">Login</router-link>
        <router-link to="/role-selection" class="btn btn-secondary">Sign Up</router-link>
      </div>
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
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.hero {
  text-align: center;
  padding: 2rem;
  max-width: 800px;
}

h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.8rem 2rem;
  border-radius: 5px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-secondary {
  background-color: #2c3e50;
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
