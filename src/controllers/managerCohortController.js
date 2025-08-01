const { Manager, Cohort, ManagerCohort } = require("../models");

module.exports = {
  // Assign a manager to a cohort
  assignManagerToCohort: async (req, res) => {
    try {
      const { managerId, cohortId } = req.body;

      const manager = await Manager.findByPk(managerId);
      const cohort = await Cohort.findByPk(cohortId);

      if (!manager || !cohort) {
        return res.status(404).json({ error: "Manager or Cohort not found" });
      }

      const [assignment, created] = await ManagerCohort.findOrCreate({
        where: { managerId, cohortId },
      });

      return res.status(201).json({
        message: created ? "Manager assigned to cohort" : "Already assigned",
        data: assignment,
      });
    } catch (err) {
      console.error("Assignment error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },

  // Get all cohorts a manager is assigned to
  getCohortsForManager: async (req, res) => {
    try {
      const { managerId } = req.params;

      const manager = await Manager.findByPk(managerId, {
        include: {
          model: Cohort,
          through: { attributes: [] },
        },
      });

      if (!manager) {
        return res.status(404).json({ error: "Manager not found" });
      }

      return res.status(200).json({ cohorts: manager.Cohorts });
    } catch (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },

  // Remove a manager from a cohort
  removeManagerFromCohort: async (req, res) => {
    try {
      const { managerId, cohortId } = req.body;

      const removed = await ManagerCohort.destroy({
        where: { managerId, cohortId },
      });

      if (!removed) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      return res.status(200).json({ message: "Assignment removed" });
    } catch (err) {
      console.error("Removal error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  },
};
