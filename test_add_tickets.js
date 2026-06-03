const axios = require('axios');

const API_URL = "http://192.168.1.15:5000";

async function addTickets() {
  try {
    const response = await axios.post(`${API_URL}/api/users/payments/custom`, 
      { tickets: 5 },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU4NjAxNTQ0LTEzZWItNDkxZjQ4IiwiaWF0IjoiU1RVREVOiJ9.eyJpYXR0IjoxNzM2NzQ3LCJleHAiOjE3NzM2Nzd9.In0leHAuOjE3NzM2Nzd9.B9RJxCt04l-VPaCoyHZ9WGtWrgk45xGwGOI2kA7SAsM'
        }
      }
    );

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

addTickets();
