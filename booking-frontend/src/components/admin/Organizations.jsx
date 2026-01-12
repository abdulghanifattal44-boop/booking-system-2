// src/components/admin/Organizations.jsx
import React, { useEffect, useState } from "react";

import { adminAPI } from "../../services/admin";

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", email: "", phone: "" });

  const loadOrgs = async () => {
    try {
      setError("");
      setLoading(true);
      setLoading(true);
      const res = await adminAPI.getOrganizations();
      const data = res.data;
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOrg.name) return;

    try {
      await adminAPI.createOrganization({
        name: newOrg.name,
        contact_email: newOrg.email,
        phone: newOrg.phone,
        type: 'general'
      });

      setNewOrg({ name: "", email: "", phone: "" });
      setShowCreate(false);
      loadOrgs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This might delete all branches and resources inside it!")) return;

    try {
      await adminAPI.deleteOrganization(id);
      loadOrgs();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Organizations</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showCreate ? "Cancel" : "Create New"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded mb-6 border border-gray-200">
          <h3 className="font-bold mb-3">New Organization</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <input
              placeholder="Organization Name"
              className="border p-2 rounded"
              value={newOrg.name}
              onChange={e => setNewOrg({ ...newOrg, name: e.target.value })}
              required
            />
            <input
              placeholder="Email"
              className="border p-2 rounded"
              value={newOrg.email}
              onChange={e => setNewOrg({ ...newOrg, email: e.target.value })}
            />
            <input
              placeholder="Phone"
              className="border p-2 rounded"
              value={newOrg.phone}
              onChange={e => setNewOrg({ ...newOrg, phone: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save</button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading organizations…</p>
      ) : organizations.length === 0 ? (
        <p className="text-sm text-gray-500">
          No organizations found. Use API or seed data to create one.
        </p>
      ) : (
        <table className="min-w-full text-sm border bg-white rounded shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-3 py-2 text-left">Name</th>
              <th className="border px-3 py-2 text-left">Email</th>
              <th className="border px-3 py-2 text-left">Phone</th>
              <th className="border px-3 py-2 text-left">Created At</th>
              <th className="border px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{o.name}</td>
                <td className="border px-3 py-2">{o.contact_email || "-"}</td>
                <td className="border px-3 py-2">{o.phone || "-"}</td>
                <td className="border px-3 py-2">
                  {o.created_at
                    ? new Date(o.created_at).toLocaleString()
                    : "-"}
                </td>
                <td className="border px-3 py-2">
                  <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:text-red-800 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Organizations;
