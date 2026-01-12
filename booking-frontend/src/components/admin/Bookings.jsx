// src/components/admin/Bookings.jsx
import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/admin";
import LoadingSpinner from "../common/LoadingSpinner";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getBookings({ status: statusFilter || undefined });
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
    try {
      await adminAPI.updateBookingStatus(id, newStatus);
      // Refresh list to show new status
      await loadBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Booking Management</h1>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-Show</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left tracking-wider">ID</th>
                <th className="px-4 py-3 text-left tracking-wider">User</th>
                <th className="px-4 py-3 text-left tracking-wider">Resource</th>
                <th className="px-4 py-3 text-left tracking-wider">Date & Time</th>
                <th className="px-4 py-3 text-left tracking-wider">Status</th>
                <th className="px-4 py-3 text-left tracking-wider">Guests</th>
                <th className="px-4 py-3 text-left tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500">
                    {String(b.id).substring(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.user_name || "Guest"}</p>
                    <p className="text-xs text-gray-500">{b.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.resource_name || b.resource_id}</p>
                    <p className="text-xs text-gray-500">{b.branch_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.timeslot_start ? formatDate(b.timeslot_start) : formatDate(b.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${b.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : b.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : b.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.guest_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {b.status !== "confirmed" && b.status !== "cancelled" && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, "confirmed")}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-1 rounded"
                        >
                          Confirm
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, "cancelled")}
                          className="text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => handleStatusUpdate(b.id, "no-show")}
                          className="text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded"
                        >
                          No-Show
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
