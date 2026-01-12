import api from "./api";

export const bookingAPI = {
  // Fetch timeslots for resource/date
  // Backend expects from/to (YYYY-MM-DD). We accept either:
  // - (resourceId, date)
  // - (resourceId, from, to)
  getTimeslots: async (resourceId, fromOrDate, maybeTo) => {
    const from = maybeTo ? fromOrDate : fromOrDate;
    const to = maybeTo ? maybeTo : fromOrDate;
    const res = await api.get(`/resources/${resourceId}/timeslots`, {
      params: { from, to },
    });
    return res.data;
  },

  // Create booking (requires auth)
  createBooking: async (bookingData) => {
    const res = await api.post(`/bookings`, bookingData);
    return res.data;
  },

  // Search bookings by email
  getBookingsByEmail: async (email) => {
    const res = await api.get(`/bookings/by-email`, {
      params: { email },
    });
    return res.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    const res = await api.post(`/bookings/${bookingId}/cancel`);
    return res.data;
  },
};
