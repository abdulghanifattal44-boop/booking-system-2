import api from "./api.js";

export const adminAPI = {
  // Organizations
  getOrganizations: () => api.get("/admin/organizations"),
  createOrganization: (data) => api.post("/admin/organizations", data),
  updateOrganization: (id, data) => api.put(`/admin/organizations/${id}`, data),
  deleteOrganization: (id) => api.delete(`/admin/organizations/${id}`),

  // Branches
  getBranches: (orgId) => api.get(`/admin/organizations/${orgId}/branches`),
  createBranch: (orgId, data) => api.post(`/admin/organizations/${orgId}/branches`, data),
  updateBranch: (id, data) => api.put(`/admin/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/admin/branches/${id}`),

  // Resources
  getResources: (branchId) => api.get(`/admin/branches/${branchId}/resources`),
  createResource: (branchId, data) => api.post(`/admin/branches/${branchId}/resources`, data),
  updateResource: (id, data) => api.put(`/admin/resources/${id}`, data),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),

  // Resource Types
  getResourceTypes: () => api.get("/admin/resource-types"),

  // Bookings
  getBookings: (filters = {}) => api.get("/admin/bookings", { params: filters }),
  updateBookingStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }),
};
