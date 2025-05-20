import Vue from 'vue';
import Router from 'vue-router';
import ProfilePage from './pages/ProfilePage.vue';
import LoginPage from './pages/LoginPage.vue';
import SignupPage from './pages/SignupPage.vue';
import CalendarPage from './pages/calendarPage.vue';
import MapPage from './pages/MapPage.vue';
import MedicalRecordsPage from './pages/MedicalRecordsPage.vue';
import SubscriptionPage from './pages/SubscriptionPage.vue';
import VoiceChat from '@/pages/VoiceChat.vue';


Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/profile',
      name: 'Profile',
      component: ProfilePage
    },
    {
      path: '*',
      redirect: '/profile'
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage
    },
    {
      path: '/signup',
      name: 'Signup',
      component: SignupPage
    },
    { path: '/calendar', name: 'Calendar', component: CalendarPage },
    { path: '/map', name: 'Map', component: MapPage },
    
{ path: '/medical-records', name: 'MedicalRecords', component: MedicalRecordsPage },
{ path: '/subscription', name: 'Subscription', component: SubscriptionPage },
{
  path: '/voice-chat',
  name: 'VoiceChat',
  component: VoiceChat,
  meta: { requiresAuth: true }
}

  ]
});