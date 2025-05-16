<template>
    <div class="calendar-page">
      <h2>My Calendar</h2>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="loading">Loading events...</div>
      <div v-else>
        <ul class="event-list">
          <li v-for="event in events" :key="event.event_id" class="event-item">
            <div>
              <strong>{{ event.title }}</strong>
              <span class="event-type">({{ event.type || 'General' }})</span>
              <div>{{ formatDate(event.start_time) }} - {{ formatDate(event.end_time) }}</div>
              <div>{{ event.description }}</div>
            </div>
            <button @click="deleteEvent(event.event_id)">Delete</button>
          </li>
        </ul>
        <div v-if="events.length === 0">No events yet.</div>
      </div>
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
        adding: false,
        newEvent: {
          title: "",
          description: "",
          start_time: "",
          end_time: "",
          type: "general"
        }
      };
    },
    created() {
      this.fetchEvents();
    },
    methods: {
      formatDate(dt) {
        if (!dt) return "-";
        const d = new Date(dt);
        return d.toLocaleString();
      },
      async fetchEvents() {
        this.loading = true;
        this.error = null;
        try {
          const userId = localStorage.getItem("userId");
          const token = localStorage.getItem("token");
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
          await axios.post(
            "/api/events",
            {
              user_id: userId,
              ...this.newEvent
            },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
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
      async deleteEvent(eventId) {
        if (!confirm("Delete this event?")) return;
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/events/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.fetchEvents();
        } catch (err) {
          this.error = err.response?.data?.error || "Failed to delete event";
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .calendar-page {
    max-width: 700px;
    margin: 2rem auto;
    background: #fff;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px #0001;
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
  .error {
    color: #d32f2f;
    margin-bottom: 1rem;
    text-align: center;
  }
  </style>