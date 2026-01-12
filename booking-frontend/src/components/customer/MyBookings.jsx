import React, { useState } from "react";
import { bookingAPI } from "../../services/booking.js";

const MyBookings = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // optional filter
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await bookingAPI.getBookingsByEmail(
        email,
        status || undefined
      );
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to load bookings.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">My Bookings</h2>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email used for booking
          </label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status (optional)
          </label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No show</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="button">
          {loading ? "Loading..." : "Search Bookings"}
        </button>
      </form>

      {/* Results */}
      {loading && <p>Loading bookings...</p>}

      {!loading && bookings.length === 0 && !error && (
        <p className="text-gray-500 text-sm">
          No bookings found. Try searching with the email you used when booking.
        </p>
      )}

      {!loading && bookings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border">Booking ID</th>
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border">Guest Count</th>
                <th className="px-3 py-2 border">Resource</th>
                <th className="px-3 py-2 border">Timeslot</th>
                <th className="px-3 py-2 border">Created At</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-3 py-2 border">{b.id}</td>
                  <td className="px-3 py-2 border capitalize">{b.status}</td>
                  <td className="px-3 py-2 border">{b.guest_count}</td>
                  <td className="px-3 py-2 border">{b.resource_id}</td>
                  <td className="px-3 py-2 border">
                    {b.timeslot_id}
                  </td>
                  <td className="px-3 py-2 border">
                    {b.created_at
                      ? new Date(b.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
