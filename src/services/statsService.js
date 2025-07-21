const statsService = {
  getOverallStats: async (userId, category) => {
    try {
      if (!window.electronAPI) {
        throw new Error("Electron API is not available.");
      }
      const response = await window.electronAPI.getOverallStats(userId, category);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch stats.');
    } catch (error) {
      console.error("Error in statsService.getOverallStats:", error);
      throw error;
    }
  },
};

export default statsService; 