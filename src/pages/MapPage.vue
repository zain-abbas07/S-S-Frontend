<template>
    <div class="map-page">
      <h2>Patient Live Location</h2>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="loading">Loading map...</div>
      <div v-else>
        <div id="map" class="map"></div>
        <div v-if="location">
          <p>
            <strong>Latitude:</strong> {{ location.latitude }}<br>
            <strong>Longitude:</strong> {{ location.longitude }}<br>
            <strong>Last updated:</strong> {{ formatDate(location.timestamp) }}
          </p>
        </div>
        <div v-else>
          <p>No location data available.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    name: "MapPage",
    data() {
      return {
        location: null,
        loading: true,
        error: null,
        map: null,
        marker: null,
        intervalId: null
      };
    },
    mounted() {
      this.initMap();
      this.fetchLocation();
      // Poll every 10 seconds for live updates
      this.intervalId = setInterval(this.fetchLocation, 10000);
    },
    beforeDestroy() {
      clearInterval(this.intervalId);
    },
    methods: {
      async fetchLocation() {
        this.error = null;
        try {
          // You may want to fetch deviceId from user profile or localStorage
          const deviceId = localStorage.getItem("deviceId") || 1; // fallback to 1
          const token = localStorage.getItem("token");
          const res = await axios.get(`/api/devices/${deviceId}/location/latest`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.location = res.data;
          this.loading = false;
          this.updateMap();
        } catch (err) {
          this.error = err.response?.data?.error || "Failed to load location";
          this.loading = false;
        }
      },
      initMap() {
        // Wait for Google Maps script to load
        if (!window.google) {
          const script = document.createElement("script");
// Use this in your MapPage.vue
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}`;          script.defer = true;
          script.onload = this.renderMap;
          document.head.appendChild(script);
        } else {
          this.renderMap();
        }
      },
      renderMap() {
        this.map = new window.google.maps.Map(document.getElementById("map"), {
          center: { lat: 0, lng: 0 },
          zoom: 15
        });
        this.marker = new window.google.maps.Marker({
          map: this.map,
          position: { lat: 0, lng: 0 }
        });
      },
      updateMap() {
        if (this.map && this.location) {
          const pos = {
            lat: parseFloat(this.location.latitude),
            lng: parseFloat(this.location.longitude)
          };
          this.map.setCenter(pos);
          this.marker.setPosition(pos);
        }
      },
      formatDate(dt) {
        if (!dt) return "-";
        return new Date(dt).toLocaleString();
      }
    }
  };
  </script>
  
  <style scoped>
  .map-page {
    max-width: 700px;
    margin: 2rem auto;
    background: #fff;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px #0001;
  }
  .map {
    width: 100%;
    height: 400px;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  .error {
    color: #d32f2f;
    margin-bottom: 1rem;
    text-align: center;
  }
  </style>