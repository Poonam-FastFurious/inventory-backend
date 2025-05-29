import ReadyStock from "./readyStock.model.js";


// ✅ Get all ready stock
export const getAllReadyStock = async (req, res) => {
  try {
    const stocks = await ReadyStock.find().populate("formula");
    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ready stock", error: error.message });
  }
};

// ✅ Get ready stock by formula ID
export const getReadyStockByFormula = async (req, res) => {
  try {
    const { formulaId } = req.params;
    const stock = await ReadyStock.findOne({ formula: formulaId }).populate("formula");

    if (!stock) {
      return res.status(404).json({ message: "No stock found for this formula" });
    }

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stock", error: error.message });
  }
};