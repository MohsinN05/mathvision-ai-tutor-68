import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/initiate-signup", authController.initiateSignup);
router.post("/complete-signup", authController.completeSignup);
router.post("/login", authController.login);
router.get("/verify", authController.verify);
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);

export { router as authRouter };
