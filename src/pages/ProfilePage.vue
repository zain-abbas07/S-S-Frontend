<template>
    <div class="profile-page" v-if="profile">
      <h2>My Profile</h2>
      <div class="profile-details">
        <div><strong>Email:</strong> {{ profile.email }}</div>
        <div><strong>First Name:</strong> {{ profile.first_name || '-' }}</div>
        <div><strong>Last Name:</strong> {{ profile.last_name || '-' }}</div>
        <div><strong>Address:</strong> {{ profile.address || '-' }}</div>
        <div><strong>Phone:</strong> {{ profile.phone || '-' }}</div>
        <div><strong>Emergency Contact Name:</strong> {{ profile.emergency_name || '-' }}</div>
        <div><strong>Emergency Contact Phone:</strong> {{ profile.emergency_phone || '-' }}</div>
        <div><strong>Medical Info:</strong> {{ profile.medical_info || '-' }}</div>
      </div>
      <button @click="editMode = true">Edit Profile</button>
  
      <div v-if="editMode" class="edit-form">
        <h3>Edit Profile</h3>
        <form @submit.prevent="updateProfile">
          <label>First Name: <input v-model="edit.first_name" /></label><br>
          <label>Last Name: <input v-model="edit.last_name" /></label><br>
          <label>Address: <input v-model="edit.address" /></label><br>
          <label>Phone: <input v-model="edit.phone" /></label><br>
          <label>Emergency Name: <input v-model="edit.emergency_name" /></label><br>
          <label>Emergency Phone: <input v-model="edit.emergency_phone" /></label><br>
          <label>Medical Info: <textarea v-model="edit.medical_info"></textarea></label><br>
          <button type="submit">Save</button>
          <button type="button" @click="editMode = false">Cancel</button>
        </form>
      </div>
    </div>
    <div v-else>
      <p>Loading profile...</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: "ProfilePage",
    data() {
      return {
        profile: null,
        edit: {},
        editMode: false,
        error: null
      };
    },
    created() {
      this.fetchProfile();
    },
    methods: {
      async fetchProfile() {
        try {
          // Get userId and token from localStorage or your auth system
          const userId = localStorage.getItem('userId');
          const token = localStorage.getItem('token');
          const res = await axios.get(`/api/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.profile = res.data;
          this.edit = { ...res.data };
        } catch (err) {
          this.error = err.response?.data?.error || 'Failed to load profile';
        }
      },
      async updateProfile() {
        try {
          const userId = localStorage.getItem('userId');
          const token = localStorage.getItem('token');
          const res = await axios.put(`/api/profile/${userId}`, this.edit, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.profile = res.data;
          this.editMode = false;
        } catch (err) {
          this.error = err.response?.data?.error || 'Failed to update profile';
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .profile-page {
    max-width: 500px;
    margin: 2rem auto;
    background: #fff;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px #0001;
  }
  .profile-details > div {
    margin-bottom: 0.5rem;
  }
  .edit-form {
    margin-top: 2rem;
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 6px;
  }
  .edit-form label {
    display: block;
    margin-bottom: 0.5rem;
  }
  .edit-form input, .edit-form textarea {
    width: 100%;
    margin-top: 0.2rem;
    margin-bottom: 0.8rem;
    padding: 0.4rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  button {
    margin-right: 1rem;
  }
  </style>