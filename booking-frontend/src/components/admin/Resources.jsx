import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/admin";




const Resources = () => {
  const navigate = useNavigate();

  // org / branch
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // resources list
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // resource types
  const [resourceTypes, setResourceTypes] = useState([]);

  // edit resource
  const [editing, setEditing] = useState(null);

  // create new resource
  const [newRes, setNewRes] = useState({
    name: "",
    type_id: "",
    description: "",
    capacity: 1,
    active: true,
  });

  /* ============= Helpers ============= */

  const showMessage = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  /* ============= Loaders ============= */

  const loadData = async () => {
    try {
      // Load Orgs
      const [orgRes, typeRes] = await Promise.all([
        adminAPI.getOrganizations(),
        adminAPI.getResourceTypes()
      ]);

      setOrganizations(orgRes.data || []);
      setResourceTypes(typeRes.data || []);

      if (orgRes.data && orgRes.data.length > 0) {
        setSelectedOrgId(orgRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      showMessage("Error loading initial data");
    }
  };

  const loadBranches = async (orgId) => {
    if (!orgId) {
      setBranches([]);
      setSelectedBranchId("");
      return;
    }
    try {
      const res = await adminAPI.getBranches(orgId);
      const data = res.data || [];
      setBranches(data);
      if (data.length > 0) {
        setSelectedBranchId(data[0].id);
      } else {
        setSelectedBranchId("");
      }
    } catch (err) {
      console.error(err);
      showMessage("❌ Error loading branches");
    }
  };

  const loadResources = async (branchId) => {
    if (!branchId) {
      setResources([]);
      setEditing(null);
      return;
    }
    setLoading(true);
    try {
      const res = await adminAPI.getResources(branchId);
      setResources(res.data || []);
      setEditing(null);
    } catch (err) {
      console.error(err);
      showMessage("❌ Error loading resources");
    } finally {
      setLoading(false);
    }
  };

  /* ============= Effects ============= */

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadBranches(selectedOrgId);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (selectedBranchId) {
      loadResources(selectedBranchId);
    } else {
      setResources([]);
    }
  }, [selectedBranchId]);

  /* ============= CRUD actions ============= */

  const startEdit = (res) => {
    setEditing({
      id: res.id,
      name: res.name || "",
      type_id: res.type_id || (resourceTypes.length > 0 ? resourceTypes[0].id : ""),
      description: res.description || "",
      capacity: res.capacity || 1,
      active: res.active ?? true,
    });
  };

  const saveEdit = async () => {
    if (!editing || !editing.id) return;
    try {
      setLoading(true);
      await adminAPI.updateResource(editing.id, {
        name: editing.name,
        type_id: editing.type_id,
        description: editing.description,
        capacity: Number(editing.capacity) || 1,
        active: !!editing.active,
      });

      showMessage("✅ Resource updated");
      await loadResources(selectedBranchId);
    } catch (err) {
      console.error(err);
      showMessage("❌ Error saving resource: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const addResource = async () => {
    if (!selectedBranchId) {
      showMessage("⚠️ Please select a branch first");
      return;
    }
    if (!newRes.name.trim()) {
      showMessage("⚠️ Resource name is required");
      return;
    }

    try {
      const typeIdToUse = newRes.type_id || (resourceTypes.length > 0 ? resourceTypes[0].id : null);
      if (!typeIdToUse) {
        showMessage("⚠️ No resource type selected");
        return;
      }

      setLoading(true);
      await adminAPI.createResource(selectedBranchId, {
        name: newRes.name,
        type_id: typeIdToUse,
        description: newRes.description,
        capacity: Number(newRes.capacity) || 1,
        active: !!newRes.active,
      });

      showMessage("✅ Resource created");
      setNewRes({ name: "", type_id: "", description: "", capacity: 1, active: true });
      await loadResources(selectedBranchId);
    } catch (err) {
      console.error(err);
      showMessage("❌ Error creating resource: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const goToTimeConfig = () => {
    if (!editing) return;
    // مجرد تنقل لصفحة الـ Admin، والاختيار بالاسم من هناك
    navigate("/admin");
  };

  /* ============= Render ============= */

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Resources</h1>

      {/* org & branch selectors */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Organization
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {branches.length === 0 && <option value="">No branches</option>}
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* message */}
      {msg && (
        <div className="mb-4 text-xs bg-gray-50 border border-gray-200 rounded px-3 py-2">
          {msg}
        </div>
      )}

      {/* layout: create + list + edit */}
      <div className="grid lg:grid-cols-[1.2fr,1.8fr] gap-6">
        {/* CREATE NEW */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-sm font-semibold mb-3">Create New Resource</h2>

          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Name
          </label>
          <input
            type="text"
            value={newRes.name}
            onChange={(e) =>
              setNewRes((p) => ({ ...p, name: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            placeholder="e.g. Hudson Conference Room"
          />

          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Type
          </label>
          <select
            value={newRes.type_id}
            onChange={(e) => setNewRes((p) => ({ ...p, type_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
          >
            <option value="">-- Select Type --</option>
            {resourceTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Description
          </label>
          <textarea
            value={newRes.description}
            onChange={(e) =>
              setNewRes((p) => ({ ...p, description: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            rows={2}
            placeholder="Optional"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Capacity
              </label>
              <input
                type="number"
                min={1}
                value={newRes.capacity}
                onChange={(e) =>
                  setNewRes((p) => ({ ...p, capacity: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Active
              </label>
              <select
                value={newRes.active ? "yes" : "no"}
                onChange={(e) =>
                  setNewRes((p) => ({ ...p, active: e.target.value === "yes" }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={addResource}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2 rounded-lg"
          >
            {loading ? "Saving..." : "Add Resource"}
          </button>
        </div>

        {/* LIST + EDIT */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {/* list */}
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold">Resources</h2>
            <p className="mt-1 text-xs text-gray-500">
              Click a resource row to edit its details and configure time
              schedule.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                    Capacity
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => startEdit(r)}
                  >
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.capacity}</td>
                    <td className="px-3 py-2">
                      {r.active ? (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {resources.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-4 text-center text-xs text-gray-500"
                    >
                      No resources for this branch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* edit panel */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold mb-3">Edit Resource</h3>
            {!editing && (
              <p className="text-xs text-gray-500">
                Select a resource from the table above.
              </p>
            )}
            {editing && (
              <>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                />

                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Type
                </label>
                <select
                  value={editing.type_id || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, type_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                >
                  {resourceTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                  rows={2}
                />

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editing.capacity}
                      onChange={(e) =>
                        setEditing((p) => ({ ...p, capacity: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Active
                    </label>
                    <select
                      value={editing.active ? "yes" : "no"}
                      onChange={(e) =>
                        setEditing((p) => ({
                          ...p,
                          active: e.target.value === "yes",
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold"
                  >
                    {loading ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={goToTimeConfig}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-xs font-semibold"
                  >
                    Configure booking time in Admin
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
