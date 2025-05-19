<template>
  <div class="calendar-page">
    <h2>🗓️ My Custom Calendar</h2>

    <div class="date-selector">
      <label>Select Date</label>
      <input type="date" v-model="selectedDate" @change="filterEvents" />
    </div>

    <div v-if="filteredEvents.length" class="day-events">
      <h3>Events on {{ selectedDate }}</h3>
      <ul>
        <li v-for="event in filteredEvents" :key="event.id">
          <strong>{{ event.title }}</strong> ({{ event.type || 'General' }})<br />
          {{ event.description }}<br />
          {{ formatDate(event.start_time) }} - {{ formatDate(event.end_time) }} <br/>
        </li>
        <br>
      </ul>
    </div>
    <div v-else>
      <p>No events on this date.</p>
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

export default {
  name: "CalendarPage",
  data() {
    return {
      events: [],
      loading: false,
      error: null,
      selectedDate: new Date().toISOString().split("T")[0],
      filteredEvents: [],
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
  created() {
    this.fetchEvents();
  },
  methods: {
    formatDate(dt) {
      return new Date(dt).toLocaleString();
    },
    filterEvents() {
      this.filteredEvents = this.events.filter(ev => {
        const date = new Date(ev.start_time).toISOString().split("T")[0];
        return date === this.selectedDate;
      });
    },
    async fetchEvents() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/events/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.events = res.data;
        this.filterEvents();
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
        const token = localStorage.getItem("token");
        await axios.post("/api/events", {
          title: this.newEvent.title,
          description: this.newEvent.description,
          start_time: this.newEvent.start_time,
          end_time: this.newEvent.end_time,
          type: this.newEvent.type
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.newEvent = {
          title: "",
          description: "",
          start_time: "",
          end_time: "",
          type: "general"
        };
        await this.fetchEvents();
      } catch (err) {
        this.error = err.response?.data?.error || "Failed to add event";
      } finally {
        this.adding = false;
      }
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
.date-selector {
  margin-bottom: 1rem;
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
</style>
