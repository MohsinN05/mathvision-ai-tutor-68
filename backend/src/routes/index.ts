import { Router } from "express";
import { solveController } from "../controllers/solve.controller";
import { historyController } from "../controllers/history.controller";
import { authRouter } from "./auth";

export const router = Router();

router.use("/auth", authRouter);
router.post("/solve", solveController.solve);
router.get("/history", historyController.list);
router.post("/history/:id/save", historyController.toggleSave);
router.delete("/history/:id", historyController.remove);
