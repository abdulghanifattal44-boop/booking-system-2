// src/components/admin/Branches.jsx
import React, { useEffect, useState } from "react";

import { adminAPI } from "../../services/admin";

const Branches = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Edit state
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTimezone, setEditTimezone] = useState("America/New_York");
  const [editActive, setEditActive] = useState("Yes");
  const [savingEdit, setSavingEdit] = useState(false);

  // ✅ Create state
  const [newName, setNewName] = useState("");
  const [newTimezone, setNewTimezone] = useState("America/New_York");
  const [newActive, setNewActive] = useState("Yes");
  const [creating, setCreating] = useState(false);

  const [message, setMessage] = useState("");

  /* =========================
     Load Organizations
     ========================= */
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const res = await adminAPI.getOrganizations();
        const data = res.data || [];
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Error loading organizations: " + err.message);
      }
    };

    loadOrgs();
  }, []);

  /* =========================
     Load Branches for Org
     ========================= */
  useEffect(() => {
    if (!selectedOrgId) return;

    const loadBranches = async () => {
      setBranchesLoading(true);
      setError("");
      setMessage("");

      try {
        const res = await adminAPI.getBranches(selectedOrgId);
        const data = res.data || [];

        setBranches(Array.isArray(data) ? data : []);
        // reset selection
        setSelectedBranchId(null);
        setEditName("");
        setEditTimezone("America/New_York");
        setEditActive("Yes");
      } catch (err) {
        console.error(err);
        setError("Error loading branches: " + err.message);
      } finally {
        setBranchesLoading(false);
      }
    };

    loadBranches();
  }, [selectedOrgId]);

  /* =========================
     Helpers
     ========================= */
  const booleanToYesNo = (val) => (val ? "Yes" : "No");
  const yesNoToBoolean = (val) => val === "Yes";

  const selectBranch = (branch) => {
    setSelectedBranchId(branch.id);
    setEditName(branch.name || "");
    setEditTimezone(branch.timezone || "America/New_York");
    setEditActive(booleanToYesNo(branch.active));
    setMessage("");
  };

  /* =========================
     Create New Branch
     ========================= */
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!selectedOrgId) {
      setMessage("⚠️ Select an organization first.");
      return;
    }
    if (!newName.trim()) {
      setMessage("⚠️ Branch name is required.");
      return;
    }

    setCreating(true);
    setMessage("");
    setError("");

    try {
      const res = await adminAPI.createBranch(selectedOrgId, {
        name: newName.trim(),
        timezone: newTimezone,
        contact_info: {},
        address: {},
        settings: {},
        active: yesNoToBoolean(newActive),
      });
      const data = res.data;

      // ضيف البرانش الجديد في الليست
      setBranches((prev) => [...prev, data]);
      setNewName("");
      setNewTimezone("America/New_York");
      setNewActive("Yes");
      setMessage("✅ Branch created successfully.");
    } catch (err) {
      console.error(err);
      setError("Error creating branch: " + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  /* =========================
     Save Edit Branch
     ========================= */
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedBranchId) {
      setMessage("⚠️ Select a branch from the table first.");
      return;
    }
    if (!editName.trim()) {
      setMessage("⚠️ Branch name is required.");
      return;
    }

    setSavingEdit(true);
    setMessage("");
    setError("");

    try {
      const res = await adminAPI.updateBranch(selectedBranchId, {
        name: editName.trim(),
        timezone: editTimezone,
        active: yesNoToBoolean(editActive),
      });

      const data = res.data;

      // حدّث الليست
      setBranches((prev) =>
        prev.map((b) => (b.id === selectedBranchId ? data : b))
      );
      setMessage("✅ Branch updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Error updating branch: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  /* =========================
     Render
     ========================= */
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Branches</h1>

      {/* Organization selector */}
      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organization
        </label>
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create + List + Edit */}
      <div className="grid md:grid-cols-[1.4fr,1fr] gap-6">
        <div>
          {/* Create New Branch */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">
              Create New Branch
            </h2>
            <form
              onSubmit={handleCreateBranch}
              className="grid md:grid-cols-3 gap-3 items-end"
            >
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Branch name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Dubai Clinic"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Timezone
                </label>
                <select
                  value={newTimezone}
                  onChange={(e) => setNewTimezone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Riyadh">Asia/Riyadh</option>
                </select>
              </div>

              <div className="md:col-span-1 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Active
                  </label>
                  <select
                    value={newActive}
                    onChange={(e) => setNewActive(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="self-end px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:bg-blue-400"
                >
                  {creating ? "Creating..." : "Add Branch"}
                </button>
              </div>
            </form>
          </div>

          {/* Branches table */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800">
                Branches
              </h2>
              <p className="text-xs text-gray-500">
                Click any branch row to edit its details.
              </p>
            </div>
            {branchesLoading ? (
              <div className="p-4 text-sm text-gray-600">Loading branches…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                        Timezone
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {branches.map((branch) => (
                      <tr
                        key={branch.id}
                        className={`cursor-pointer hover:bg-gray-50 ${selectedBranchId === branch.id
                            ? "bg-blue-50"
                            : "bg-white"
                          }`}
                        onClick={() => selectBranch(branch)}
                      >
                        <td className="px-4 py-2">{branch.name}</td>
                        <td className="px-4 py-2">{branch.timezone}</td>
                        <td className="px-4 py-2">
                          {booleanToYesNo(branch.active)}
                        </td>
                      </tr>
                    ))}
                    {branches.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-xs text-gray-500"
                        >
                          No branches found for this organization.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Edit panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Edit Branch
          </h2>
          {selectedBranchId ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Branch name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Timezone
                </label>
                <select
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Riyadh">Asia/Riyadh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Active
                </label>
                <select
                  value={editActive}
                  onChange={(e) => setEditActive(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:bg-blue-400"
              >
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-500">
              Select a branch from the table on the left to edit its details.
            </p>
          )}
        </div>
      </div>

      {(error || message) && (
        <div className="mt-4 text-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-2">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Branches;
