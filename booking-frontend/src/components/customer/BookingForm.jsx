// src/components/customer/BookingForm.jsx
import React, { useEffect, useState } from "react";

// In Docker/prod, nginx serves the SPA and proxies the backend under the "/api" prefix.
// Using window.location.origin breaks API calls like "/admin/..." (they hit the SPA and return HTML).
const API_PREFIX = "/api";

const BookingForm = () => {
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [resources, setResources] = useState([]);
  const [timeslots, setTimeslots] = useState([]);

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeslotId, setSelectedTimeslotId] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // helpers
  const todayISO = () => new Date().toISOString().slice(0, 10);

  const formatTimeslot = (slot) => {
    if (!slot?.start_at || !slot?.end_at) return "Invalid timeslot";
    const start = new Date(slot.start_at);
    const end = new Date(slot.end_at);
    const fmt = (d) =>
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${fmt(start)} - ${fmt(end)}`;
  };

  // ========= initial load: orgs + branches =========
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setError("");

      try {
        // organizations
        const orgRes = await fetch(`${API_PREFIX}/admin/organizations`);
        if (!orgRes.ok) throw new Error("Failed to load organizations");
        const orgData = await orgRes.json();
        const orgs = Array.isArray(orgData) ? orgData : [];
        setOrganizations(orgs);

        if (orgs.length === 0) {
          setError("No organizations found in the system.");
          setLoading(false);
          return;
        }

        const orgId = orgs[0].id;
        setSelectedOrgId(orgId);

        // branches for first org
        const brRes = await fetch(`${API_PREFIX}/admin/organizations/${orgId}/branches`);
        if (!brRes.ok) throw new Error("Failed to load branches");
        const brData = await brRes.json();
        const brs = Array.isArray(brData) ? brData : [];
        setBranches(brs);

        if (brs.length > 0) {
          const branchId = brs[0].id;
          setSelectedBranchId(branchId);
          await loadResources(branchId);
        }

        setSelectedDate(todayISO());
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========= load resources for branch =========
  const loadResources = async (branchId) => {
    try {
      setResources([]);
      setTimeslots([]);
      setSelectedResourceId("");
      setSelectedTimeslotId("");

      if (!branchId) return;

      const res = await fetch(`${API_PREFIX}/admin/branches/${branchId}/resources`);
      if (!res.ok) throw new Error("Failed to load resources");
      const data = await res.json();
      const rs = Array.isArray(data) ? data : [];
      setResources(rs);

      if (rs.length > 0) {
        const resourceId = rs[0].id;
        setSelectedResourceId(resourceId);
        await loadTimeslots(resourceId, selectedDate || todayISO());
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading resources");
    }
  };

  // ========= load timeslots for resource + date =========
  const loadTimeslots = async (resourceId, date) => {
    try {
      setTimeslots([]);
      setSelectedTimeslotId("");

      if (!resourceId || !date) return;

      const qs = `from=${date}&to=${date}`;
      const res = await fetch(`${API_PREFIX}/resources/${resourceId}/timeslots?${qs}`);
      if (!res.ok) throw new Error("Failed to load timeslots");
      const data = await res.json();
      const ts = Array.isArray(data) ? data : [];
      setTimeslots(ts);

      if (ts.length > 0) setSelectedTimeslotId(ts[0].id);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading timeslots");
    }
  };

  // ========= handlers =========
  const handleOrgChange = async (e) => {
    const orgId = e.target.value;
    setSelectedOrgId(orgId);
    setBranches([]);
    setResources([]);
    setTimeslots([]);
    setSelectedBranchId("");
    setSelectedResourceId("");
    setSelectedTimeslotId("");

    if (!orgId) return;

    try {
      const res = await fetch(`${API_PREFIX}/admin/organizations/${orgId}/branches`);
      if (!res.ok) throw new Error("Failed to load branches");
      const data = await res.json();
      const brs = Array.isArray(data) ? data : [];
      setBranches(brs);

      if (brs.length > 0) {
        const branchId = brs[0].id;
        setSelectedBranchId(branchId);
        await loadResources(branchId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading branches");
    }
  };

  const handleBranchChange = async (e) => {
    const branchId = e.target.value;
    setSelectedBranchId(branchId);
    await loadResources(branchId);
  };

  const handleResourceChange = async (e) => {
    const resourceId = e.target.value;
    setSelectedResourceId(resourceId);
    await loadTimeslots(resourceId, selectedDate || todayISO());
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (selectedResourceId) {
      await loadTimeslots(selectedResourceId, date);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedResourceId || !selectedTimeslotId) {
      setError("Please select resource and timeslot");
      return;
    }

    if (!email) {
      setError("Email is required (used later in My Bookings).");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer_name: fullName || "Guest",
        customer_email: email,
        customer_phone: phone || undefined,
        resource_id: selectedResourceId,
        timeslot_id: selectedTimeslotId,
        guest_count: Number(guestCount) || 1,
        special_requests: specialRequests || undefined,
      };

      const res = await fetch(`${API_PREFIX}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create booking");
      }

      const booking = await res.json();
      setSuccessMessage(
        `Booking created successfully. ID: ${booking.id?.substring(0, 8)}...`
      );

      // keep selections, reset only details
      setGuestCount(1);
      setSpecialRequests("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error submitting booking");
    } finally {
      setSubmitting(false);
    }
  };

  // ========= UI =========
  if (loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="text-gray-600">Loading booking data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Book a Resource</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Org + Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={handleOrgChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={selectedBranchId}
              onChange={handleBranchChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resource + Date + Timeslot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource
            </label>
            <select
              value={selectedResourceId}
              onChange={handleResourceChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select resource</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {resources.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No resources for this branch. Check Admin &gt; Resources.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeslot
            </label>
            <select
              value={selectedTimeslotId}
              onChange={(e) => setSelectedTimeslotId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select timeslot</option>
              {timeslots.map((t) => (
                <option key={t.id} value={t.id}>
                  {formatTimeslot(t)}
                </option>
              ))}
            </select>
            {timeslots.length === 0 && selectedResourceId && selectedDate && (
              <p className="mt-1 text-xs text-gray-500">
                No open timeslots for this date. Try another date or generate
                timeslots in Admin.
              </p>
            )}
          </div>
        </div>

        {/* Customer info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests
            </label>
            <input
              type="number"
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Special requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requests
          </label>
          <textarea
            rows={3}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {submitting ? "Submitting..." : "Confirm Booking"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
