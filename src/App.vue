<template>
  <div id="app">

    <Navbar v-if="showNavbar" />

   
    <keep-alive include="MapPage">


    <router-view/>
    </keep-alive>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';

export default {
  name: 'App',
  components: { Navbar },
  computed: {
    showNavbar() {
      // Don't show navbar on login and signup pages
      const publicRoutes = ['/login', '/signup', '/'];
      return !publicRoutes.includes(this.$route.path);
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}
</style>
