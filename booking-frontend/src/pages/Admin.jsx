// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../contexts/I18nContext.jsx";
import {
  Building,
  GitBranch,
  Box,
  Calendar,
  RefreshCw,
  Clock,
  Activity,
  Users,
  LayoutDashboard
} from "lucide-react";

import { adminAPI } from "../services/admin";

const Admin = () => {
  const { t } = useI18n();
  const [dashboardData, setDashboardData] = useState({
    organizationsCount: 0,
    totalBookings: 0,
    systemStatus: "Online",
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  const fetchRealData = async () => {
    try {
      setError(null);

      const orgsData = (await adminAPI.getOrganizations()).data;
      setOrganizations(orgsData);

      const bookingsData = (await adminAPI.getBookings({ limit: 5 })).data;
      setRecentBookings(bookingsData);

      const orgsCount = Array.isArray(orgsData) ? orgsData.length : 0;
      const bookingsCount = Array.isArray(bookingsData)
        ? bookingsData.length
        : 0;

      setDashboardData({
        organizationsCount: orgsCount,
        totalBookings: bookingsCount,
        systemStatus: "Online",
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/admin/login", { replace: true, state: { reason: "unauthorized" } });
        return;
      }

      setError("Using demo data - " + (err?.response?.data?.error || err.message));

      setOrganizations([
        { id: 1, name: "Main Organization", status: "active" },
        { id: 2, name: "Branch Office", status: "active" },
      ]);
      setRecentBookings([
        {
          id: "c936404f-1234-5678-9abc-def123456789",
          status: "confirmed",
          guest_count: 2,
          created_at: "2025-11-22T10:30:00.000Z",
          customer_name: "John Doe",
          resource_name: "Conference Room A",
        },
        {
          id: "f5222a8a-9876-5432-1abc-def654321098",
          status: "confirmed",
          guest_count: 2,
          created_at: "2025-11-22T14:45:00.000Z",
          customer_name: "Jane Smith",
          resource_name: "Meeting Room B",
        },
      ]);
      setDashboardData({
        organizationsCount: 2,
        totalBookings: 2,
        systemStatus: "Online",
      });
    }
  };

  const fetchDataWithLoading = async () => {
    setLoading(true);
    await fetchRealData();
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchRealData();
    setRefreshing(false);
  };

  const manageOrganizations = () => {
    navigate("/admin/organizations");
  };

  const manageBranches = () => {
    navigate("/admin/branches");
  };

  const manageResources = () => {
    // هيفتح صفحة Manage Resources اللي فيها الـ Time Configuration
    navigate("/admin/resources");
  };

  const viewAllBookings = () => {
    navigate("/admin/bookings");
  };
  const manageResourceTime = () => {
    navigate("/admin/resource-time");
  };
  useEffect(() => {
    fetchDataWithLoading();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (err) {
      return new Date().toLocaleDateString("en-US");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">
          Loading real data from server...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Refresh */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <LayoutDashboard className="text-blue-600" size={32} />
                {t("admin.dashboard.title")}
              </h1>
              <p className="text-gray-500 mt-2">Welcome back. Here's what's happening today.</p>
            </div>

            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-5 rounded-xl transition duration-200 shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Building className="text-blue-600" size={24} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {dashboardData.organizationsCount}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">Total Organizations</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Calendar className="text-indigo-600" size={24} />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">All Time</span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {dashboardData.totalBookings}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">Total Bookings</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                <Activity className="text-green-600" size={24} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Stable</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {dashboardData.systemStatus}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">System Status</h3>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="border-b border-gray-100 px-8 py-5 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Last 5 Bookings
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Guests</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-8 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                      {String(booking.id).substring(0, 8)}...
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${booking.status === "confirmed"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : booking.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${booking.status === "confirmed" ? "bg-green-500" :
                          booking.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                          }`}></span>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        {booking.guest_count || booking.guests || 0}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(booking.created_at || booking.createdAt)}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.user_name ||
                        booking.customer_name ||
                        booking.customer?.name ||
                        booking.user_email ||
                        booking.email ||
                        "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <button
            onClick={manageOrganizations}
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building size={28} />
            </div>
            <span className="font-semibold text-gray-900">Organizations</span>
            <span className="text-xs text-gray-500 mt-1">Manage Org Structure</span>
          </button>

          <button
            onClick={manageBranches}
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GitBranch size={28} />
            </div>
            <span className="font-semibold text-gray-900">Branches</span>
            <span className="text-xs text-gray-500 mt-1">Setup Locations</span>
          </button>

          <button
            onClick={manageResources}
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Box size={28} />
            </div>
            <span className="font-semibold text-gray-900">Resources</span>
            <span className="text-xs text-gray-500 mt-1">Rooms & Equipment</span>
          </button>

          <button
            onClick={manageResourceTime}
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock size={28} />
            </div>
            <span className="font-semibold text-gray-900">Scheduling</span>
            <span className="text-xs text-gray-500 mt-1">Timeslots & Availability</span>
          </button>
        </div>

        {/* Status note */}
        <div className="flex justify-center">
          <div
            className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-xs font-medium border ${error
              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
              : "bg-green-50 border-green-200 text-green-700"
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${error ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`}></div>
            <span>
              {error ? "Using Demo Data Mode" : "System Connected"}
            </span>
            <span className="text-gray-300">|</span>
            <span className="opacity-75">
              Ping: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
