import Vue from 'vue';
import Router from 'vue-router';
import ProfilePage from './pages/ProfilePage.vue';
import LoginPage from './pages/LoginPage.vue';
import SignupPage from './pages/SignupPage.vue';
import CalendarPage from './pages/calendarPage.vue';
import MapPage from './pages/MapPage.vue';
import MedicalRecordsPage from './pages/MedicalRecordsPage.vue';
import HomePage from './pages/HomePage.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomePage,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/signup',
      name: 'Signup',
      component: SignupPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: ProfilePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: CalendarPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/map',
      name: 'Map',
      component: MapPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/medical-records',
      name: 'MedicalRecords',
      component: MedicalRecordsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
});