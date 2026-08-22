const DailyRate = require("../models/DailyRate");

const getRateByDate = async (req, res) => {
  try {
    const rate = await DailyRate.findOne({ date: req.params.date });
    res.json(rate || { bahawalpurRate: "", supplyRate: "" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveRate = async (req, res) => {
  try {
    const { date, bahawalpurRate, supplyRate } = req.body;
    let rate = await DailyRate.findOne({ date });

    if (rate) {
      rate.bahawalpurRate = bahawalpurRate;
      rate.supplyRate = supplyRate;
      await rate.save();
    } else {
      rate = await DailyRate.create({ date, bahawalpurRate, supplyRate });
    }
    res.json({ message: "Rates saved successfully", rate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRateByDate, saveRate };
