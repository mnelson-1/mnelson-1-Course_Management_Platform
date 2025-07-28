const { Allocation, Module, Facilitator } = require("../models");

exports.createAllocation = async (req, res) => {
  try {
    const allocation = await Allocation.create(req.body);
    res.status(201).json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.findAll({
      include: [Module, Facilitator],
    });
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
