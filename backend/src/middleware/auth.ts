import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

const jwtSecret = process.env.JWT_SECRET || "change_me_now";
const cookieName = process.env.AUTH_COOKIE_NAME || "token";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.cookies?.[cookieName];

    if (!token) {
      return res.status(401).json({ ok: false, error: "Authentication required." });
    }

    const payload = jwt.verify(token, jwtSecret) as { sub: string; email: string };
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid authentication token." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: "Invalid or expired authentication token." });
  }
}
