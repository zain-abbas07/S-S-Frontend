<template>
  <div class="calendar-page">
    <h2>📆 {{ pageTitle }}</h2>

    <!-- Caregiver Controls -->
    <div v-if="isCaregiver" class="caregiver-controls">
      <div class="view-toggle">
        <label>
          <input 
            type="radio" 
            v-model="viewMode" 
            value="all" 
            @change="fetchEvents"
          />
          All Events (Mine + Patients)
        </label>
        <label>
          <input 
            type="radio" 
            v-model="viewMode" 
            value="mine" 
            @change="fetchEvents"
          />
          My Events Only
        </label>
        <label v-if="selectedPatient">
          <input 
            type="radio" 
            v-model="viewMode" 
            value="patient" 
            @change="fetchEvents"
          />
          {{ selectedPatient.users.first_name }}'s Events
        </label>
      </div>

      <!-- Patient Selector -->
      <div v-if="viewMode === 'patient'" class="patient-selector">
        <label>Select Patient:</label>
        <select v-model="selectedPatientId" @change="onPatientChange">
          <option value="">Choose a patient...</option>
          <option 
            v-for="patient in linkedPatients" 
            :key="patient.id" 
            :value="patient.id"
          >
            {{ patient.users.first_name }} {{ patient.users.last_name }}
          </option>
        </select>
      </div>
    </div>

    <div class="month-navigation">
      <button @click="goToPreviousMonth">◀</button>
      <span>{{ formatMonthLabel }}</span>
      <button @click="goToNextMonth">▶</button>
    </div>

    <!-- Color Legend for Caregivers -->
    <div v-if="isCaregiver && viewMode === 'all'" class="color-legend">
      <h4>Event Legend:</h4>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-color event-caregiver"></div>
          <span>Your Events</span>
        </div>
        <div 
          v-for="patient in linkedPatients" 
          :key="patient.id"
          class="legend-item"
        >
          <div :class="getLegendColorClass(patient.users.id)"></div>
          <span>{{ patient.users.first_name }} {{ patient.users.last_name }}</span>
        </div>
      </div>
    </div>

    <div class="calendar-grid">
      <!-- Day headers -->
      <div class="day-header" v-for="dayName in dayNames" :key="dayName">
        {{ dayName }}
      </div>
      
      <!-- Calendar days -->
      <div 
        v-for="day in calendarDays" 
        :key="day.date.toISOString()"
        :class="getDayClass(day)"
      >
        <div class="day-number">{{ day.date.getDate() }}</div>
        <div class="day-events">
          <div 
            v-for="event in day.events" 
            :key="event.id"
            :class="getEventClass(event)"
            :title="getEventTooltip(event)"
          >
            <div class="event-title">{{ event.title }}</div>
            <div class="event-patient" v-if="isCaregiver && event.event_owner === 'patient'">
              {{ getPatientName(event) }}
            </div>
            <div class="event-time">{{ formatTime(event.start_time) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading">Loading events...</div>

    <!-- Add Event Form - Only show for caregiver's own events or when not in patient view -->
    <div v-if="canAddEvents" class="add-event">
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
  props: {
    patientId: {
      type: String,
      default: null
    }
  },
  data() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      events: [],
      loading: false,
      error: null,
      currentMonth: startOfMonth,
      newEvent: {
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        type: "general"
      },
      adding: false,
      isCaregiver: false,
      viewMode: 'all', // 'all', 'mine', 'patient'
      linkedPatients: [],
      selectedPatientId: null,
      selectedPatient: null,
      dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };
  },
  computed: {
    calendarDays() {
      const days = [];
      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      
      // Get first day of month
      const firstDay = new Date(year, month, 1);
      // Get last day of month
      const lastDay = new Date(year, month + 1, 0);
      
      // Get start of week for first day (Sunday)
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - firstDay.getDay());
      
      // Get end of week for last day (Saturday)
      const endDate = new Date(lastDay);
      endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
      
      // Generate all days
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayStr = currentDate.toISOString().split('T')[0];
        const dayEvents = this.events.filter(ev =>
          new Date(ev.start_time).toISOString().startsWith(dayStr)
        );
        
        days.push({
          date: new Date(currentDate),
          events: dayEvents,
          isCurrentMonth: currentDate.getMonth() === month,
          isToday: currentDate.toDateString() === new Date().toDateString()
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return days;
    },
    formatMonthLabel() {
      return this.currentMonth.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long'
      });
    },
    pageTitle() {
      if (this.patientId) {
        return `📆 ${this.selectedPatient?.users?.first_name || 'Patient'}'s Calendar`;
      }
      if (this.isCaregiver && this.viewMode === 'patient' && this.selectedPatient) {
        return `📆 ${this.selectedPatient.users.first_name}'s Calendar`;
      }
      if (this.isCaregiver && this.viewMode === 'mine') {
        return '📆 My Calendar';
      }
      if (this.isCaregiver && this.viewMode === 'all') {
        return '📆 All Events Calendar';
      }
      return '📆 My Monthly Calendar';
    },
    canAddEvents() {
      // Can add events if not viewing a specific patient or if viewing own events
      return !this.patientId && (this.viewMode !== 'patient' || !this.selectedPatientId);
    }
  },
  async created() {
    await this.checkUserRole();
    await this.fetchEvents();
  },
  methods: {
    formatTime(dt) {
      return new Date(dt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    getDayClass(day) {
      const classes = ['calendar-day'];
      if (!day.isCurrentMonth) classes.push('other-month');
      if (day.isToday) classes.push('today');
      return classes.join(' ');
    },
    getEventClass(event) {
      const baseClass = 'calendar-event';
      if (this.isCaregiver && event.event_owner) {
        if (event.event_owner === 'caregiver') {
          return `${baseClass} event-caregiver`;
        } else if (event.event_owner === 'patient') {
          // Add patient-specific color based on user ID
          const patientId = event.users?.id || 0;
          const colorIndex = patientId % 5; // Use 5 different colors
          return `${baseClass} event-patient patient-color-${colorIndex}`;
        }
      }
      return baseClass;
    },
    getEventTooltip(event) {
      let tooltip = `${event.title} (${event.type})\n`;
      tooltip += `${event.description}\n`;
      tooltip += `${this.formatTime(event.start_time)} - ${this.formatTime(event.end_time)}`;
      if (this.isCaregiver && event.owner_name) {
        tooltip += `\n${event.owner_name}`;
      }
      return tooltip;
    },
    goToPreviousMonth() {
      const prev = new Date(this.currentMonth);
      prev.setMonth(prev.getMonth() - 1);
      this.currentMonth = prev;
    },
    goToNextMonth() {
      const next = new Date(this.currentMonth);
      next.setMonth(next.getMonth() + 1);
      this.currentMonth = next;
    },
    async checkUserRole() {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        
        // Check if user is a caregiver
        const caregiverRes = await axios.get(`/api/caregivers/my-patients?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.isCaregiver = true;
        this.linkedPatients = caregiverRes.data;
        
        // Set initial view mode based on route
        if (this.patientId) {
          this.viewMode = 'patient';
          this.selectedPatientId = this.patientId;
          this.selectedPatient = this.linkedPatients.find(p => p.id.toString() === this.patientId);
        }
      } catch (error) {
        // User is not a caregiver or error occurred
        this.isCaregiver = false;
      }
    },
    async fetchEvents() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem("token");
        let endpoint = "/api/events/me";
        
        if (this.isCaregiver) {
          if (this.viewMode === 'all') {
            endpoint = "/api/events/caregiver";
          } else if (this.viewMode === 'patient' && this.selectedPatientId) {
            endpoint = `/api/events/patient/${this.selectedPatientId}`;
          }
          // For 'mine' mode, use the default /me endpoint
        }
        
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.events = res.data;
      } catch (err) {
        this.error = err.response?.data?.error || "Failed to load events";
      } finally {
        this.loading = false;
      }
    },
    async onPatientChange() {
      if (this.selectedPatientId) {
        this.selectedPatient = this.linkedPatients.find(p => p.id.toString() === this.selectedPatientId);
      } else {
        this.selectedPatient = null;
      }
      await this.fetchEvents();
    },
    async addEvent() {
      this.adding = true;
      this.error = null;
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          "/api/events",
          {
            title: this.newEvent.title,
            description: this.newEvent.description,
            start_time: this.newEvent.start_time,
            end_time: this.newEvent.end_time,
            type: this.newEvent.type
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
        await this.fetchEvents();
      } catch (err) {
        this.error = err.response?.data?.error || "Failed to add event";
      } finally {
        this.adding = false;
      }
    },
    getPatientName(event) {
      if (event.event_owner === 'patient' && event.users) {
        return `${event.users.first_name} ${event.users.last_name}`;
      }
      return "Unknown Patient";
    },
    getLegendColorClass(patientId) {
      const colorIndex = patientId % 5; // Use 5 different colors
      return `legend-color patient-color-${colorIndex}`;
    }
  }
};
</script>

<style scoped>
.calendar-page {
  max-width: 1200px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px #0001;
}

.caregiver-controls {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.view-toggle {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.view-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.patient-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.patient-selector label {
  font-weight: 500;
}

.patient-selector select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.month-navigation button {
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
}

.month-navigation button:hover {
  background: #3aa876;
}

.month-navigation span {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #ddd;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.day-header {
  background: #f8f9fa;
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: bold;
  color: #495057;
  border-bottom: 1px solid #ddd;
}

.calendar-day {
  background: white;
  min-height: 120px;
  padding: 0.5rem;
  border-right: 1px solid #eee;
  border-bottom: 1px solid #eee;
  position: relative;
}

.calendar-day.other-month {
  background: #f8f9fa;
  color: #adb5bd;
}

.calendar-day.today {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.day-number {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.calendar-day.other-month .day-number {
  color: #adb5bd;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.calendar-event {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  border-left: 3px solid #42b983;
  background: #f8f9fa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-event.event-caregiver {
  border-left-color: #2196f3;
  background: #e3f2fd;
}

.calendar-event.event-patient {
  border-left-color: #ff9800;
  background: #fff3e0;
}

/* Patient-specific colors */
.calendar-event.patient-color-0 {
  border-left-color: #ff5722;
  background: #ffebee;
}

.calendar-event.patient-color-1 {
  border-left-color: #9c27b0;
  background: #f3e5f5;
}

.calendar-event.patient-color-2 {
  border-left-color: #3f51b5;
  background: #e8eaf6;
}

.calendar-event.patient-color-3 {
  border-left-color: #009688;
  background: #e0f2f1;
}

.calendar-event.patient-color-4 {
  border-left-color: #ff9800;
  background: #fff3e0;
}

.event-title {
  font-weight: 500;
  margin-bottom: 0.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-patient {
  font-size: 0.7rem;
  color: #333;
  font-weight: 500;
  margin-bottom: 0.1rem;
  font-style: italic;
}

.event-time {
  font-size: 0.7rem;
  color: #666;
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

.color-legend {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-color.event-caregiver {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.legend-color.patient-color-0 {
  background: #ffebee;
  border-left: 3px solid #ff5722;
}

.legend-color.patient-color-1 {
  background: #f3e5f5;
  border-left: 3px solid #9c27b0;
}

.legend-color.patient-color-2 {
  background: #e8eaf6;
  border-left: 3px solid #3f51b5;
}

.legend-color.patient-color-3 {
  background: #e0f2f1;
  border-left: 3px solid #009688;
}

.legend-color.patient-color-4 {
  background: #fff3e0;
  border-left: 3px solid #ff9800;
}

@media (max-width: 768px) {
  .calendar-grid {
    grid-template-columns: repeat(7, 1fr);
    font-size: 0.8rem;
  }
  
  .calendar-day {
    min-height: 80px;
    padding: 0.25rem;
  }
  
  .day-header {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }
  
  .view-toggle {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .patient-selector {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .month-navigation span {
    font-size: 1.2rem;
  }
}
</style>