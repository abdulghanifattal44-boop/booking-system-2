// src/pages/Customer.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useI18n } from "../contexts/I18nContext.jsx";
import AuthModal from "../components/customer/AuthModal.jsx";
import { publicAPI } from "../services/public";
import { bookingAPI } from "../services/booking";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

const Customer = () => {
  const { user, logout } = useAuth();
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState("new"); // "new" | "my"

  // ====== New Booking state ======
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [resources, setResources] = useState([]);
  const [timeslots, setTimeslots] = useState([]);

  const [orgId, setOrgId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [date, setDate] = useState("");

  const [bookingForm, setBookingForm] = useState({
    guests: 1,
    specialRequests: "",
    timeslotId: "",
  });

  // Auth gating (guests can browse/search, but must register/login before booking)
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register"); // 'register' | 'login'
  const [pendingBooking, setPendingBooking] = useState(null);
  const [authPrefill, setAuthPrefill] = useState({ name: "", email: "", phone: "" });

  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // ====== My Bookings state ======
  const [lookupEmail, setLookupEmail] = useState("");
  const [myBookings, setMyBookings] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState("");
  const [viewBooking, setViewBooking] = useState(null);

  // =============== Helpers =================
  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =============== Load Organizations =================
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const data = await publicAPI.listOrganizations();
        setOrganizations(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setOrgId(data[0].id);
      } catch (err) {
        console.error(err);
        setOrganizations([]);
      }
    };

    loadOrganizations();
  }, []);

  // =============== Load Branches when org changes =================
  useEffect(() => {
    const loadBranches = async () => {
      if (!orgId) {
        setBranches([]);
        setBranchId("");
        return;
      }

      try {
        const data = await publicAPI.listBranchesForOrg(orgId);
        setBranches(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setBranchId(data[0].id);
        } else {
          setBranchId("");
        }
      } catch (err) {
        console.error(err);
        setBranches([]);
        setBranchId("");
      }
    };

    if (orgId) {
      loadBranches();
    }
  }, [orgId]);

  // =============== Load Resources when branch changes =================
  useEffect(() => {
    const loadResources = async () => {
      if (!branchId) {
        setResources([]);
        setResourceId("");
        return;
      }

      try {
        const data = await publicAPI.listResourcesForBranch(branchId);
        setResources(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setResourceId(data[0].id);
        } else {
          setResourceId("");
        }
      } catch (err) {
        console.error(err);
        setResources([]);
        setResourceId("");
      }
    };

    if (branchId) {
      loadResources();
    }
  }, [branchId]);

  // =============== Load Timeslots when resource or date changes =================
  useEffect(() => {
    const loadTimeslots = async () => {
      if (!resourceId || !date) {
        setTimeslots([]);
        setBookingForm((prev) => ({ ...prev, timeslotId: "" }));
        return;
      }

      try {
        const data = await bookingAPI.getTimeslots(resourceId, date);

        setTimeslots(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setBookingForm((prev) => ({ ...prev, timeslotId: data[0].id }));
        } else {
          setBookingForm((prev) => ({ ...prev, timeslotId: "" }));
        }
      } catch (err) {
        console.error(err);
        setTimeslots([]);
        setBookingForm((prev) => ({ ...prev, timeslotId: "" }));
      }
    };

    if (resourceId && date) {
      loadTimeslots();
    }
  }, [resourceId, date]);

  // =============== Handle booking form change =================
  const handleFormChange = (field, value) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitBooking = async ({ resource_id, timeslot_id, guest_count, special_requests }) => {
    // Requires auth token (handled by axios interceptor in services/api.js)
    return bookingAPI.createBooking({
      resource_id,
      timeslot_id,
      guest_count,
      special_requests,
    });
  };

  // =============== Submit new booking =================
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setBookingMessage("");

    if (!resourceId || !bookingForm.timeslotId) {
      setBookingMessage("⚠️ Please select a time before confirming the booking.");
      return;
    }
    // Guests can browse/search, but booking requires registration/login.
    if (!user) {
      setPendingBooking({
        resource_id: resourceId,
        timeslot_id: bookingForm.timeslotId,
        guest_count: Number(bookingForm.guests) || 1,
        special_requests: bookingForm.specialRequests || "",
      });
      setAuthPrefill({ name: "", email: "", phone: "" });
      setAuthMode("register");
      setAuthOpen(true);
      setBookingMessage("ℹ️ Please register/login to confirm the booking.");
      return;
    }

    setBookingLoading(true);
    try {
      await submitBooking({
        resource_id: resourceId,
        timeslot_id: bookingForm.timeslotId,
        guest_count: Number(bookingForm.guests) || 1,
        special_requests: bookingForm.specialRequests || "",
      });
      setBookingMessage(t("customer.msg.success"));
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 409) {
        setBookingMessage(t("customer.msg.slot_taken"));
      } else if (status === 401) {
        setBookingMessage(t("customer.msg.need_login"));
      } else {
        const apiMsg = err?.response?.data?.error;
        setBookingMessage(apiMsg ? `❌ ${apiMsg}` : t("customer.msg.error_create"));
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // =============== My Bookings lookup =================
  const handleLookupBookings = async () => {
    setMyError("");
    setMyBookings([]);

    if (!lookupEmail) {
      setMyError("Please enter your email first.");
      return;
    }

    setMyLoading(true);
    try {
      const data = await bookingAPI.getBookingsByEmail(lookupEmail);
      setMyBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMyError(err.message || "Error while loading bookings.");
    } finally {
      setMyLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm(t("customer.cancel.confirm"))) return;
    try {
      await bookingAPI.cancelBooking(bookingId);

      setMyBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
      alert(t("customer.cancel.success"));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error cancelling booking");
    }
  };

  // =============== Render =================
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          Book Your Appointment
        </h1>

        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex">
            <button
              onClick={() => setActiveTab("new")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "new"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <Calendar size={16} />
              New Booking
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "my"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <User size={16} />
              My Bookings
            </button>
          </div>
        </div>

        {/* ============ TAB: NEW BOOKING ============ */}
        {activeTab === "new" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Make a Reservation</h2>
              <p className="text-sm text-gray-500">Select your preferences below to check availability.</p>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6">
              <div className="grid lg:grid-cols-[1fr,1fr] gap-8">
                {/* Left Column - Selection */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                    <MapPin size={16} />
                    Step 1: Location & Service
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Organization</label>
                      <select
                        value={orgId}
                        onChange={(e) => setOrgId(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      >
                        {organizations.map((o) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                        {organizations.length === 0 && <option value="">No organizations</option>}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Branch</label>
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                        {branches.length === 0 && <option value="">No branches</option>}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Resource</label>
                    <select
                      value={resourceId}
                      onChange={(e) => setResourceId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                    >
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                      {resources.length === 0 && <option value="">No resources</option>}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 uppercase tracking-wider mt-8 mb-4">
                    <Calendar size={16} />
                    Step 2: Date & Time
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Time Slot</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <select
                          value={bookingForm.timeslotId}
                          onChange={(e) => handleFormChange("timeslotId", e.target.value)}
                          className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none disabled:opacity-50"
                          disabled={timeslots.length === 0}
                        >
                          {timeslots.length === 0 && <option value="">No timeslots available</option>}
                          {timeslots.map((t) => (
                            <option key={t.id} value={t.id}>
                              {formatTime(t.start_at || t.startAt)} – {formatTime(t.end_at || t.endAt)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Booking Details */}
                <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 h-fit space-y-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 uppercase tracking-wider">
                      <User size={16} />
                      Step 3: Confirm
                    </div>
                    {user ? (
                      <button
                        type="button"
                        onClick={logout}
                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                      >
                        Logout
                      </button>
                    ) : null}
                  </div>

                  {user ? (
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
                      Logged in as <span className="font-semibold">{user.email}</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                      You can browse as a guest. Creating a booking requires registration or login.
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthPrefill({ name: "", email: "", phone: "" });
                            setAuthMode("register");
                            setAuthOpen(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800"
                        >
                          Register / Login
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">Guests</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input
                            type="number"
                            min={1}
                            value={bookingForm.guests}
                            onChange={(e) => handleFormChange("guests", Number(e.target.value) || 1)}
                            className="w-full pl-10 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">Special requests</label>
                        <input
                          type="text"
                          value={bookingForm.specialRequests}
                          onChange={(e) => handleFormChange("specialRequests", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || !bookingForm.timeslotId}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 transform active:scale-[0.98] mt-4"
                  >
                    {bookingLoading ? "Processing..." : "Confirm Reservation"}
                  </button>

                  {bookingMessage && (
                    <div
                      className={`p-3 rounded-lg text-sm text-center ${
                        bookingMessage.includes("✅")
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : bookingMessage.includes("⚠️") || bookingMessage.includes("❌")
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {bookingMessage}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ============ TAB: MY BOOKINGS ============ */}
        {activeTab === "my" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="max-w-md space-y-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your email to see your bookings
              </label>
              <input
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
              <button
                type="button"
                onClick={handleLookupBookings}
                disabled={myLoading}
                className="bg-gray-900 hover:bg-black disabled:bg-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                {myLoading ? "Loading…" : "Search"}
              </button>
              {myError && (
                <p className="text-sm text-red-600 mt-1">⚠️ {myError}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {myBookings.length === 0 && !myLoading && (
                <div className="col-span-2 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                  No bookings found for this email.
                </div>
              )}

              {myBookings.map((b) => (
                <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-blue-50 text-blue-600 font-mono text-xs px-2 py-1 rounded">
                      #{String(b.id).substring(0, 8)}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.status === "confirmed" ? "bg-green-100 text-green-700" :
                        b.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                      }`}>
                      {b.status === "confirmed" && <CheckCircle size={12} />}
                      {b.status === "cancelled" && <XCircle size={12} />}
                      {b.status === 'pending' && <AlertCircle size={12} />}
                      {b.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1">{b.resource_name || "Resource"}</h3>
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      {formatDate(b.timeslot_start || b.created_at)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      {formatTime(b.timeslot_start)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users size={14} />
                      {b.guest_count} Guests
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => setViewBooking(b)}
                      className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-1.5 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                    {b.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="flex-1 bg-white border border-red-100 text-red-600 hover:bg-red-50 text-sm font-medium py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal (booking requires registration/login) */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        setMode={setAuthMode}
        prefill={authPrefill}
        resourceId={resourceId}
        onAuthed={async (authedUser) => {
          const u = authedUser;
          if (!u?.id || !pendingBooking) return;

          setBookingLoading(true);
          setBookingMessage("");
          try {
            await submitBooking({ ...pendingBooking });
            setBookingMessage(t("customer.msg.success"));
          } catch (err) {
            console.error(err);
            const status = err?.response?.status;
            if (status === 409) {
              setBookingMessage(t("customer.msg.slot_taken"));
            } else if (status === 401) {
              setBookingMessage(t("customer.msg.need_login"));
            } else {
              const apiMsg = err?.response?.data?.error;
              setBookingMessage(apiMsg ? `❌ ${apiMsg}` : t("customer.msg.error_create"));
            }
          } finally {
            setBookingLoading(false);
            setPendingBooking(null);
          }
        }}
      />

      {/* View Booking Modal */}
      {viewBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setViewBooking(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Booking Details
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <span className="font-semibold block text-gray-900">ID:</span>{" "}
                {viewBooking.id}
              </p>
              <p>
                <span className="font-semibold block text-gray-900">
                  Resource:
                </span>{" "}
                {viewBooking.resource_name || viewBooking.resource_id}
              </p>
              <p>
                <span className="font-semibold block text-gray-900">
                  Date & Time:
                </span>{" "}
                {formatDate(
                  viewBooking.timeslot_start || viewBooking.start_at
                )}{" "}
                at{" "}
                {formatTime(viewBooking.timeslot_start || viewBooking.start_at)}
              </p>
              <p>
                <span className="font-semibold block text-gray-900">
                  Status:
                </span>{" "}
                <span className="uppercase">{viewBooking.status}</span>
              </p>
              <p>
                <span className="font-semibold block text-gray-900">
                  Guests:
                </span>{" "}
                {viewBooking.guest_count}
              </p>
              {viewBooking.special_requests && (
                <p>
                  <span className="font-semibold block text-gray-900">
                    Special Requests:
                  </span>{" "}
                  {viewBooking.special_requests}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewBooking(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;
