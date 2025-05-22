<template>
  <div class="calendar-page">
    <h2>📆 My Weekly Calendar</h2>

    <div class="week-navigation">
      <button @click="goToPreviousWeek">◀</button>
      <span>{{ formatWeekLabel }}</span>
      <button @click="goToNextWeek">▶</button>
    </div>

    <div class="week-grid">
      <div class="day-column" v-for="(day, index) in weekDays" :key="index">
        <h4>{{ formatDateLabel(day) }}</h4>
        <ul>
          <li v-for="event in eventsOnDay(day)" :key="event.id">
            <strong>{{ event.title }}</strong> ({{ event.type }})<br />
            {{ event.description }}<br />
            {{ formatDate(event.start_time) }} - {{ formatDate(event.end_time) }}
          </li>
        </ul>
      </div>
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
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    return {
      events: [],
      loading: false,
      error: null,
      currentWeekStart: new Date(weekStart),
      newEvent: {
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        type: "general"
      },
      adding: false
    };
  },
  computed: {

    weekDays() {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(this.currentWeekStart);
        date.setDate(this.currentWeekStart.getDate() + i);
        days.push(date);
      }
      return days;
    },
    formatWeekLabel() {
      const start = this.weekDays[0].toLocaleDateString();
      const end = this.weekDays[6].toLocaleDateString();
      return `${start} - ${end}`;
    }
  },

  calendarEvents() {
    const mapped = this.events.map(ev => ({
      ...ev,
      id: ev.event_id,
      start: ev.start_time ? new Date(ev.start_time).toISOString() : null,
      end: ev.end_time ? new Date(ev.end_time).toISOString() : null,
      title: ev.title || "Untitled",
      content: ev.description || "",
      class: ev.type || "general"
    }));
    console.log("calendarEvents:", mapped);
    return mapped;
  }
},

  created() {
    this.fetchEvents();
  },
  methods: {
    formatDate(dt) {
      return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    formatDateLabel(date) {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    },
    eventsOnDay(date) {
      const dayStr = date.toISOString().split("T")[0];
      return this.events.filter(ev => new Date(ev.start_time).toISOString().split("T")[0] === dayStr);
    },
    goToPreviousWeek() {
      const prev = new Date(this.currentWeekStart);
      prev.setDate(prev.getDate() - 7);
      this.currentWeekStart = prev;
    },
    goToNextWeek() {
      const next = new Date(this.currentWeekStart);
      next.setDate(next.getDate() + 7);
      this.currentWeekStart = next;
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
      } catch (err) {
        this.error = err.response?.data?.error || "Failed to load events";
      } finally {
        this.loading = false;
      }
    },
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
  max-width: 1000px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px #0001;
}
.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.week-grid {
  display: flex;
  gap: 1rem;
}
.day-column {
  flex: 1;
  background: #f4f4f4;
  border-radius: 6px;
  padding: 0.5rem;
  min-height: 150px;
}
.day-column h4 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
  text-align: center;
}
.day-column ul {
  list-style: none;
  padding-left: 0;
}
.day-column li {
  background: white;
  margin-bottom: 0.5rem;
  padding: 0.4rem;
  border-radius: 4px;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px #0001;
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
input,
select {
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
  margin-top: 1rem;
  text-align: center;
}
</style>
