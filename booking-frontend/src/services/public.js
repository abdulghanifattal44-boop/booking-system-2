import api from "./api";

export const publicAPI = {
  listOrganizations: async () => {
    const res = await api.get(`/public/organizations`);
    return res.data;
  },
  listBranchesForOrg: async (orgId) => {
    const res = await api.get(`/public/organizations/${orgId}/branches`);
    return res.data;
  },
  listResourcesForBranch: async (branchId) => {
    const res = await api.get(`/public/branches/${branchId}/resources`);
    return res.data;
  },
};
