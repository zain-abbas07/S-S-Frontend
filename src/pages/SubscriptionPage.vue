<template>
    <div class="subscription-page">
      <h2>Premium Subscription</h2>
      <div class="plans">
        <div class="plan" v-for="plan in plans" :key="plan.id">
          <h3>{{ plan.label }}</h3>
          <p>{{ plan.description }}</p>
          <p class="price">{{ plan.price }}</p>
          <button @click="subscribe(plan.id)" :disabled="loading">
            <span v-if="loading && loadingPlan === plan.id">Processing...</span>
            <span v-else>Buy Now</span>
          </button>
        </div>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </template>
  
  <script>
//   import { loadStripe } from '@stripe/stripe-js';
  import axios from 'axios';
  
  export default {
    name: "SubscriptionPage",
    data() {
      return {
        plans: [
          {
            id: '1month',
            label: '1 Month Premium',
            description: 'Full access for 1 month.',
            price: '€5.99'
          },
          {
            id: '3month',
            label: '3 Months Premium',
            description: 'Full access for 3 months.',
            price: '€15.99'
          },
          {
            id: '12month',
            label: '12 Months Premium',
            description: 'Full access for 1 year.',
            price: '€49.99'
          }
        ],
        loading: false,
        loadingPlan: null,
        error: null
      };
    },
    methods: {
      async subscribe(planId) {
        this.loading = true;
        this.loadingPlan = planId;
        this.error = null;
        try {
          const userId = localStorage.getItem("userId");
          const token = localStorage.getItem("token");
          // Map planId to backend plan string
          let plan = '';
          if (planId === '1month') plan = 'premium_1m';
          if (planId === '3month') plan = 'premium_3m';
          if (planId === '12month') plan = 'premium_12m';
  
          const res = await axios.post(
            '/api/subscriptions/create-checkout-session',
            { user_id: userId, plan },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        //   const stripe = await loadStripe('pk_test_51ROPvAPctqOdZhsAW1ql07j4Ck44Bd1xwGxEf4b7gyIOh1UqsfNG7TLmDL03jcIsbitbZXwKCtHCqwjFT4tEHsfX009YFyI2ys'); // <-- Your Stripe publishable key
        // Just redirect to the URL Stripe provides
        window.location.href = res.data.url;        } catch (err) {
          this.error = err.response?.data?.error || "Failed to start checkout.";
        } finally {
          this.loading = false;
          this.loadingPlan = null;
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .subscription-page {
    max-width: 700px;
    margin: 2rem auto;
    background: #fff;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px #0001;
    text-align: center;
  }
  .plans {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 2rem;
  }
  .plan {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
    width: 200px;
    box-shadow: 0 1px 4px #0001;
  }
  .price {
    font-size: 1.3rem;
    font-weight: bold;
    margin: 1rem 0;
  }
  button {
    background: #42b983;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
  }
  button:disabled {
    background: #b2dfdb;
    cursor: not-allowed;
  }
  .error {
    color: #d32f2f;
    margin-top: 1rem;
  }
  </style>