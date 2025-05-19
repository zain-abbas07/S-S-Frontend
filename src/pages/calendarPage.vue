<template>
      <div class="calendar-page">
    <h2>My Calendar</h2>
    <vue-cal
  v-model="calendarView"
  :events="calendarEvents"
  :time="false"
  :on-event-click="onEventClick"
  :on-cell-click="onCellClick"
  :available-views="['month', 'week', 'day', 'list']"
  style="height: 600px"
/>
    <div class="calendar-toolbar">
      <button v-for="view in ['month', 'week', 'day', 'list']"
              :key="view"
              :class="{active: calendarView === view}"
              @click="calendarView = view">
        {{ view.charAt(0).toUpperCase() + view.slice(1) }} View
      </button>
    </div>
    <div v-if="selectedDayEvents.length" class="day-events">
      <h3>Events on {{ selectedDayLabel }}</h3>
      <ul>
        <li v-for="event in selectedDayEvents" :key="event.id">
          <strong>{{ event.title }}</strong> ({{ event.type || 'General' }})<br>
          {{ event.description }}<br>
          {{ formatDate(event.start) }} - {{ formatDate(event.end) }}
        </li>
      </ul>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading">Loading events...</div>


      <div class="add-event">
        <h3>Add Event</h3>
        <form @submit.prevent="addEvent">
          <div class="form-group">
            <label>Title</label>
            <input v-model="newEvent.title" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input v-model="newEvent.description" />
          </div>
          <div class="form-group">
            <label>Start Time</label>
            <input v-model="newEvent.start_time" type="datetime-local" required />
          </div>
          <div class="form-group">
            <label>End Time</label>
            <input v-model="newEvent.end_time" type="datetime-local" required />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select v-model="newEvent.type">
              <option value="appointment">Appointment</option>
              <option value="reminder">Reminder</option>
              <option value="medication">Medication</option>
              <option value="general">General</option>
            </select>
          </div>
          <button type="submit" :disabled="adding">Add Event</button>
        </form>
      </div>
    </div>
  </template>
  
  <script>
import axios from "axios";
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'

export default {
  name: "CalendarPage",
  components: { VueCal },
  data() {
    return {
      events: [],
      loading: false,
      error: null,
      calendarView: 'month',
      selectedDayEvents: [],
      selectedDayLabel: '',
      newEvent: {
  title: "",
  description: "",
  start_time: "",
  end_time: "",
  type: "general"
},
adding: false,
    };
  },
  computed: {
    calendarEvents() {
      // Map your events to vue-cal's format
      return this.events.map(ev => ({
        ...ev,
        id: ev.event_id,
        start: ev.start_time,
        end: ev.end_time,
        title: ev.title,
        content: ev.description,
        class: ev.type // You can use this for color coding
      }));
    }
  },
  created() {
    this.fetchEvents();
  },
  methods: {
    formatDate(dt) {
      if (!dt) return "-";
      return new Date(dt).toLocaleString();
    },
    async fetchEvents() {
  this.loading = true;
  this.error = null;

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    this.error = "User not authenticated.";
    this.loading = false;
    return;
  }

  try {
    const res = await axios.get(`/api/events/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    this.events = res.data;
  } catch (err) {
    this.error = err.response?.data?.error || "Failed to load events";
  } finally {
    this.loading = false;
  }
},
    async addEvent() {
  this.adding = true;
  this.error = null;
  try {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    await axios.post("/api/events", {
      user_id: userId,
      ...this.newEvent
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Clear form and reload events
    this.newEvent = {
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      type: "general"
    };
    this.fetchEvents();
  } catch (err) {
    this.error = err.response?.data?.error || "Failed to add event";
  } finally {
    this.adding = false;
  }
},
    onEventClick(event) {
      // Optionally show event details in a modal
      alert(`Event: ${event.title}\n${event.content}`);
    },
    onCellClick({ date, events }) {
      this.selectedDayLabel = new Date(date).toLocaleDateString();
      this.selectedDayEvents = events;
    }
  }
};
</script>
  
  <style scoped>
.calendar-page {
  max-width: 900px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px #0001;
}
.calendar-toolbar {
  margin: 1rem 0;
  text-align: center;
}
.calendar-toolbar button {
  margin: 0 0.5rem;
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 4px;
  background: #42b983;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}
.calendar-toolbar button.active {
  background: #388e3c;
}
.day-events {
  margin-top: 2rem;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 6px;
}
.error {
  color: #d32f2f;
  margin-bottom: 1rem;
  text-align: center;
}
  .event-list {
    list-style: none;
    padding: 0;
  }
  .event-item {
    border-bottom: 1px solid #eee;
    padding: 1rem 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .event-type {
    color: #42b983;
    margin-left: 0.5rem;
  }
  .add-event {
    margin-top: 2rem;
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 6px;
  }
  .form-group {
    margin-bottom: 1rem;
  }
  label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: bold;
  }
  input, select {
    width: 100%;
    padding: 0.4rem;
    border: 1px solid #bbb;
    border-radius: 4px;
    font-size: 1rem;
  }
  button {
    margin-top: 0.5rem;
    background: #42b983;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
    cursor: pointer;
  }
  button:disabled {
    background: #b2dfdb;
    cursor: not-allowed;
  }
  .vuecal__event.appointment { background: #42b983 !important; color: #fff; }
.vuecal__event.reminder { background: #ff9800 !important; color: #fff; }
.vuecal__event.medication { background: #1976d2 !important; color: #fff; }
.vuecal__event.general { background: #757575 !important; color: #fff; }
  </style>