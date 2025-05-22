<template>
  <div class="map-page">
    <h2>Patient Live Location</h2>
    <div v-if="error" class="error">{{ error }}</div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading location data...</p>
    </div>
    
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
  name: "MapPage", // Important for keep-alive
  data() {
    return {
      location: null,
      loading: true,
      error: null,
      map: null,
      marker: null,
      infoWindow: null, // Single instance of infoWindow
      intervalId: null,
      mapInitialized: false,
      cachedLocation: null,
      mapScriptLoaded: false
    };
  },
  created() {
    // Load cached location immediately
    this.loadCachedLocation();
  },
  mounted() {
    // Start by loading the map script
    this.loadMapScript();
    
    // Then fetch latest location
    this.fetchLocation();
    
    // Set up polling
    this.intervalId = setInterval(this.fetchLocation, 10000);
  },
  activated() {
    // This runs when returning to this component with keep-alive
    if (this.mapInitialized && this.map) {
      // Map exists, just update with latest location
      this.fetchLocation();
      this.intervalId = setInterval(this.fetchLocation, 10000);
    } else if (this.mapScriptLoaded && !this.mapInitialized) {
      // Script is loaded but map not initialized
      this.initializeMap();
    } else if (!this.mapScriptLoaded) {
      // Script not loaded yet
      this.loadMapScript();
    }
  },
  deactivated() {
    // Clear interval when component is inactive but kept alive
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },
  beforeDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
  methods: {
    loadMapScript() {
  // Check if script is already loaded
  if (window.google && window.google.maps) {
    console.log("Google Maps already loaded");
    this.mapScriptLoaded = true;
    this.initializeMap();
    return;
  }
  
  // Check if the script tag is already added but not loaded yet
  const existingScript = document.getElementById('google-maps-script');
  if (existingScript) {
    console.log("Google Maps script tag exists but not loaded yet");
    const checkLoaded = setInterval(() => {
      if (window.google && window.google.maps) {
        clearInterval(checkLoaded);
        console.log("Google Maps finished loading");
        this.mapScriptLoaded = true;
        this.initializeMap();
      }
    }, 100);
    return;
  }
  
  // Create and add the script tag
  console.log("Adding Google Maps script to page");
  const script = document.createElement('script');
  script.id = 'google-maps-script';
  
  // Use your new API key here
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}`;
  script.async = true;
  script.defer = true;
  
  script.onload = () => {
    console.log("Google Maps script loaded successfully");
    this.mapScriptLoaded = true;
    this.initializeMap();
  };
  
  script.onerror = (error) => {
    console.error("Error loading Google Maps script:", error);
    this.error = "Failed to load Google Maps. Please try again later.";
    this.loading = false;
  };
  
  document.head.appendChild(script);
},
    
    loadCachedLocation() {
      const cachedData = localStorage.getItem('lastKnownLocation');
      if (cachedData) {
        try {
          this.cachedLocation = JSON.parse(cachedData);
          this.location = this.cachedLocation; // Set location immediately from cache
          this.loading = false;
        } catch (e) {
          console.error("Failed to parse cached location");
        }
      }
    },
    
    async fetchLocation() {
      try {
        const deviceId = localStorage.getItem("deviceId") || 1;
        const token = localStorage.getItem("token");
        
        const res = await axios.get(`/api/devices/${deviceId}/location/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.location = res.data;
        localStorage.setItem('lastKnownLocation', JSON.stringify(this.location));
        this.loading = false;
        
        // Update map with new location data
        if (this.mapInitialized) {
          this.updateMap();
        } else if (this.mapScriptLoaded) {
          // If map script is loaded but map isn't initialized, initialize it now
          this.initializeMap();
        }
      } catch (err) {
        if (!this.location && this.cachedLocation) {
          this.location = this.cachedLocation;
          this.loading = false;
          if (this.mapInitialized) {
            this.updateMap();
          } else if (this.mapScriptLoaded) {
            this.initializeMap();
          }
        } else if (!this.location) {
          this.error = err.response?.data?.error || "Failed to load location";
          this.loading = false;
        }
      }
    },
    
    initializeMap() {
      // Add error handling to diagnose map loading issues
      console.log("Initializing map...");
      
      const mapEl = document.getElementById("map");
      if (!mapEl) {
        console.error("Map element not found in DOM");
        return;
      }
      
      // Check if Google Maps is available
      if (!window.google || !window.google.maps) {
        console.error("Google Maps API not loaded!");
        this.error = "Could not load Google Maps. Please check your internet connection.";
        this.loading = false;
        return;
      }
      
      try {
        // Initial location
        const locationData = this.location || this.cachedLocation;
        const initialPosition = locationData 
          ? { lat: parseFloat(locationData.latitude), lng: parseFloat(locationData.longitude) }
          : { lat: 0, lng: 0 };
        
        console.log("Creating map with center:", initialPosition);
        
        // Create map
        this.map = new window.google.maps.Map(mapEl, {
          center: initialPosition,
          zoom: 15,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false
        });
        
        // Create marker
        this.marker = new window.google.maps.Marker({
          map: this.map,
          position: initialPosition,
          title: "Patient Location"
        });
        
        this.infoWindow = new window.google.maps.InfoWindow();
        this.mapInitialized = true;
        this.loading = false;
        
        console.log("Map initialized successfully");
      } catch (err) {
        console.error("Error initializing map:", err);
        this.error = "Failed to initialize map: " + err.message;
        this.loading = false;
      }
    },
    
    updateMap() {
      if (!this.mapInitialized || !this.map || !this.location) return;
      
      const pos = {
        lat: parseFloat(this.location.latitude),
        lng: parseFloat(this.location.longitude)
      };
      
      // Only animate map if position has changed
      const currentPos = this.marker.getPosition();
      if (!currentPos || 
          currentPos.lat() !== pos.lat || 
          currentPos.lng() !== pos.lng) {
        
        // Smoothly animate to new position
        this.map.panTo(pos);
        this.marker.setPosition(pos);
        
        // Just update the content - no need to create a new infoWindow
        const content = `<div><strong>Last updated:</strong> ${this.formatDate(this.location.timestamp)}</div>`;
        this.infoWindow.setContent(content);
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
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b983;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>