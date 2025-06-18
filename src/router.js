import Vue from 'vue';
import Router from 'vue-router';
import ProfilePage from './pages/ProfilePage.vue';
import LoginPage from './pages/LoginPage.vue';
import SignupPage from './pages/SignupPage.vue';
import CalendarPage from './pages/calendarPage.vue';
import MapPage from './pages/MapPage.vue';
import MedicalRecordsPage from './pages/MedicalRecordsPage.vue';
import CaregiverSignupPage from './pages/CaregiverSignupPage.vue';
import HomePage from './pages/HomePage.vue';
import LinkPage from './pages/LinkPage.vue';
import LinkCaregiver from './pages/LinkCaregiver.vue';

import SubscriptionPage from './pages/SubscriptionPage.vue';
import VoiceChat from '@/pages/VoiceChat.vue';
import AlertsPage from './pages/AlertsPage.vue';
import AlertDetailsPage from './pages/AlertDetails.vue';
import AssignDeviceToPatient from './pages/AssignDeviceToPatient.vue';



Vue.use(Router);

const router = new Router({
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
      path: '/caregiver-signup',
      name: 'CaregiverSignup',
      component: CaregiverSignupPage,
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
      path: '/subscription',
      name: 'Subscription',
      component: SubscriptionPage
    },
    {
      path: '/voice-chat',
      name: 'VoiceChat',
      component: VoiceChat,
        meta: { requiresAuth: true }
      },
      {
        path: '/link-patient',
        name: 'LinkPatient',
        component: LinkPage,
        meta: { requiresAuth: true }
    },
    {
      path: '/link-caregiver',
      name: 'LinkCaregiver',
      component: LinkCaregiver,
      meta: { requiresAuth: true }
    },
    {
      path: '*',
      redirect: '/'
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: AlertsPage
    },
    {
      path: '/alerts/:id',
      name: 'AlertDetails',
      component: AlertDetailsPage,
      props: true
    },
    {
      path: '/assign-device',
      name: 'AssignDeviceToPatient',
      component: AssignDeviceToPatient
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
});

// Navigation guard
router.beforeEach((to, from, next) => {
  // Clear any existing auth data when accessing public routes
  if (to.meta.requiresAuth === false) {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('patientId');
  }
  
  const isAuthenticated = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/signup' || to.path === '/caregiver-signup') && isAuthenticated) {
    next('/profile');
  } else {
    next();
  }
});

export default router;