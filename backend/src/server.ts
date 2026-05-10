import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import { wolframSolver } from "./services/wolframSolver";

const app = express();

app.use(express.json());

app.post("/solve", async (req, res) => {
  try {
    const { latex } = req.body;

    const result = await wolframSolver.solve({ latex });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Wolfram ID:", process.env.WOLFRAM_APP_ID);
});