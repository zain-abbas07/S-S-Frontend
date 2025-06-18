<template>
  <div id="app">
    <!-- Main notification system -->
    <transition name="slide-up">
      <div v-if="notification.visible"
           :class="['global-notification', notificationStyles[notification.type]]">
        <div class="notification-content">
          <div class="icon">
            <svg v-if="notification.type === 'success'" class="icon-success" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5 13l4 4L19 7"/>
            </svg>
            <svg v-else-if="notification.type === 'error'" class="icon-error" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <svg v-else class="icon-info" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="message">
            {{ notification.message }}
          </div>
          <button class="close-btn" @click="hideNotification">✕</button>
        </div>
      </div>
    </transition>
    <Navbar v-if="showNavbar" />
    <keep-alive include="MapPage">
      <router-view/>
    </keep-alive>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import { eventBus } from '@/eventBus';

export default {
  name: 'App',
  components: { Navbar },
  data() {
    return {
      notification: {
        visible: false,
        message: '',
        type: 'info', // success, error, info, warning
      },
      notificationTimeout: null,
      notificationStyles: {
        success: 'bg-green-50 text-green-800 border border-green-200',
        error: 'bg-red-50 text-red-800 border border-red-200',
        info: 'bg-blue-50 text-blue-800 border border-blue-200',
        warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200'
      }
    };
  },
  computed: {
    showNavbar() {
      // Don't show navbar on login and signup pages
      const publicRoutes = ['/login', '/signup', '/'];
      return !publicRoutes.includes(this.$route.path);
    }
  },
  created() {
    eventBus.on('global-notification', this.showNotification);
  },
  mounted() {
  },
  beforeDestroy() {
    eventBus.off('global-notification', this.showNotification);
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
  },
  methods: {
    showNotification({ message, isError = false, type = 'info' }) {
      console.log('[App.vue] showNotification called:', message, type);
      // Fallback message if none provided
      this.notification.message = message || 'Notification';
      this.notification.type = type || (isError ? 'error' : 'success');
      this.notification.visible = true;
      if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
      this.notificationTimeout = setTimeout(() => {
        this.notification.visible = false;
      }, 3500);
    },
    hideNotification() {
      this.notification.visible = false;
      if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
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

.global-notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  min-width: 320px;
  max-width: 420px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: fadein 0.3s ease-in-out;
  font-size: 1.1rem;
  word-break: break-word;
}

@keyframes fadein {
  from { opacity: 0; right: 0; }
  to { opacity: 1; right: 1.5rem; }
}
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter, .slide-up-leave-to {
  transform: translateY(40px);
  opacity: 0;
}
.fixed.bottom-6.right-6 {
  min-width: 340px;
  max-width: 480px;
  padding: 1.5rem 2.25rem;
  font-size: 1.1rem;
  box-sizing: border-box;
  border-radius: 14px;
  word-break: break-word;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.message {
  flex-grow: 1;
  font-size: 1rem;
  font-weight: 500;
  color: inherit;
}

.icon svg {
  height: 24px;
  width: 24px;
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease;
}
.slide-up-enter,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

</style>
