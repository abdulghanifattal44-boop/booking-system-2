// src/pages/AdminResourceTime.jsx
import React, { useEffect, useState } from "react";

import api from "../services/api";
import { adminAPI } from "../services/admin";

const DAYS = [
  { key: 0, label: "Sunday" },
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
];

/* ============================
   Time configuration for one resource
   ============================ */

function ResourceTimeConfig({ resourceId, resourceName }) {
  const [templates, setTemplates] = useState(() =>
    DAYS.map((d) => ({
      day_of_week: d.key,
      enabled: d.key >= 1 && d.key <= 5, // default Mon–Fri
      start_time: "09:00",
      end_time: "17:00",
      max_capacity: 1,
    }))
  );

  const [range, setRange] = useState({
    start_date: "",
    end_date: "",
  });

  const [savingTemplates, setSavingTemplates] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const updateTemplateField = (index, field, value) => {
    setTemplates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const saveScheduleTemplates = async () => {
    if (!resourceId) {
      setMessage("⚠️ Please select a resource first.");
      return;
    }

    const active = templates.filter((t) => t.enabled);
    if (!active.length) {
      setMessage("⚠️ Enable at least one day.");
      return;
    }

    setSavingTemplates(true);
    setMessage("");

    try {
      const requests = active.map((t) =>
        api.post(`/admin/resources/${resourceId}/schedule-templates`, {
          day_of_week: t.day_of_week,
          start_time: t.start_time,
          end_time: t.end_time,
          max_capacity: t.max_capacity,
        })
      );

      await Promise.all(requests);
      setMessage("✅ Time schedule saved successfully.");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error while saving schedule. Check console.");
    } finally {
      setSavingTemplates(false);
    }
  };

  const generateTimeslots = async () => {
    if (!resourceId) {
      setMessage("⚠️ Please select a resource first.");
      return;
    }
    if (!range.start_date || !range.end_date) {
      setMessage("⚠️ Please set both start date and end date.");
      return;
    }

    setGenerating(true);
    setMessage("");

    try {
      const data = await api
        .post(`/admin/resources/${resourceId}/timeslots/generate`, {
          start_date: range.start_date,
          end_date: range.end_date,
        })
        .then((r) => r.data);

      setMessage(
        `✅ Timeslots generated: ${data.count ?? "check API response"} slot(s).`
      );
    } catch (err) {
      console.error(err);
      setMessage("❌ Error while generating timeslots. Check console.");
    } finally {
      setGenerating(false);
    }
  };

  if (!resourceId) {
    return (
      <div className="mt-10 bg-white rounded-lg shadow-md p-6 border border-gray-200 text-sm text-gray-600">
        Select a resource from the table above to configure its booking time.
      </div>
    );
  }

  return (
    <section className="mt-10 bg-white rounded-lg shadow-md p-6 space-y-6 border border-gray-200">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Booking Time Configuration
          </h2>
          <p className="text-xs text-gray-500">
            Time Schedule (working days & hours) + Time Generation (generate time
            slots) for the selected resource.
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            Resource: {resourceName}
          </p>
        </div>
      </div>

      {/* Time schedule + time generation */}
      <div className="grid md:grid-cols-[2fr,1fr] gap-6">
        {/* Time Schedule */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-800">
            Time Schedule (working days & hours)
          </h3>
          <div className="space-y-2">
            {templates.map((t, idx) => {
              const day = DAYS.find((d) => d.key === t.day_of_week);
              return (
                <div
                  key={t.day_of_week}
                  className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-2"
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateTemplateField(idx, "enabled", !t.enabled)
                    }
                    className={
                      "px-3 py-1.5 rounded-full text-xs font-semibold border " +
                      (t.enabled
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-300")
                    }
                  >
                    {day?.label ?? t.day_of_week}
                  </button>

                  <div className="flex items-center gap-2 text-xs">
                    <span>From</span>
                    <input
                      type="time"
                      value={t.start_time}
                      onChange={(e) =>
                        updateTemplateField(idx, "start_time", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1"
                    />
                    <span>To</span>
                    <input
                      type="time"
                      value={t.end_time}
                      onChange={(e) =>
                        updateTemplateField(idx, "end_time", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span>Capacity</span>
                    <input
                      type="number"
                      min={1}
                      value={t.max_capacity}
                      onChange={(e) =>
                        updateTemplateField(
                          idx,
                          "max_capacity",
                          Number(e.target.value)
                        )
                      }
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={saveScheduleTemplates}
            disabled={savingTemplates}
            className="mt-3 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold disabled:bg-gray-500"
          >
            {savingTemplates ? "Saving…" : "Save Time Schedule"}
          </button>
        </div>

        {/* Time Generation */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">
            Time Generation (generate timeslots)
          </h3>
          <p className="text-xs text-gray-600">
            Generates timeslots for the selected resource and date range, based
            on the schedule above.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Start date
              </label>
              <input
                type="date"
                value={range.start_date}
                onChange={(e) =>
                  setRange((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                End date
              </label>
              <input
                type="date"
                value={range.end_date}
                onChange={(e) =>
                  setRange((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={generateTimeslots}
              disabled={generating}
              className="mt-1 w-full px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold disabled:bg-gray-500"
            >
              {generating ? "Generating…" : "Generate Timeslots"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          {message}
        </div>
      )}
    </section>
  );
}

/* ============================
   Manage Resources + Time Config page
   ============================ */

const AdminResourceTime = () => {
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [resources, setResources] = useState([]);

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedResourceName, setSelectedResourceName] = useState("");

  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [error, setError] = useState("");

  // Load organizations on mount
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        setLoadingOrgs(true);
        const data = (await adminAPI.getOrganizations()).data;
        setOrganizations(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSelectedOrgId(data[0].id);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error while loading organizations.");
      } finally {
        setLoadingOrgs(false);
      }
    };
    loadOrgs();
  }, []);

  // Load branches when organization changes
  useEffect(() => {
    if (!selectedOrgId) return;

    const loadBranches = async () => {
      try {
        setLoadingBranches(true);
        // adminAPI.getBranches expects orgId as a plain string (uuid)
        const data = (await adminAPI.getBranches(selectedOrgId)).data;
        setBranches(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedBranchId(data[0].id);
        } else {
          setSelectedBranchId("");
          setResources([]);
          setSelectedResourceId("");
          setSelectedResourceName("");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Error while loading branches.");
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, [selectedOrgId]);

  // Load resources when branch changes
  useEffect(() => {
    if (!selectedBranchId) return;

    const loadResources = async () => {
      try {
        setLoadingResources(true);
        // adminAPI.getResources expects branchId as a plain string (uuid)
        const data = (await adminAPI.getResources(selectedBranchId)).data;
        setResources(Array.isArray(data) ? data : []);
        setSelectedResourceId("");
        setSelectedResourceName("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error while loading resources.");
      } finally {
        setLoadingResources(false);
      }
    };

    loadResources();
  }, [selectedBranchId]);

  const onSelectResource = (resource) => {
    setSelectedResourceId(resource.id);
    setSelectedResourceName(resource.name || resource.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Manage Resources
        </h1>

        {/* Org & Branch selectors */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]"
            >
              {loadingOrgs && <option>Loading...</option>}
              {!loadingOrgs && organizations.length === 0 && (
                <option>No organizations</option>
              )}
              {!loadingOrgs &&
                organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Branch
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[220px]"
            >
              {loadingBranches && <option>Loading...</option>}
              {!loadingBranches && branches.length === 0 && (
                <option>No branches</option>
              )}
              {!loadingBranches &&
                branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 text-center text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Resources table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Resources</h2>
            {loadingResources && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-sm text-gray-500 text-center"
                    >
                      No resources found for this branch.
                    </td>
                  </tr>
                )}
                {resources.map((r) => (
                  <tr
                    key={r.id}
                    className={
                      "cursor-pointer hover:bg-gray-50 " +
                      (r.id === selectedResourceId ? "bg-blue-50" : "")
                    }
                    onClick={() => onSelectResource(r)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {r.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {r.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {r.capacity ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {r.active ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time config for selected resource */}
        <ResourceTimeConfig
          resourceId={selectedResourceId}
          resourceName={selectedResourceName}
        />
      </div>
    </div>
  );
};

export default AdminResourceTime;
