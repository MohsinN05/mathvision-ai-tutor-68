import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user.model";
import { sendVerificationEmail } from "../services/email.service";
import { AuthRequest } from "../middleware/auth";

const emailSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
});

const completeSignupSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  token: z.string(),
});

const loginSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),
  password: z.string().min(1),
});

const jwtSecret = process.env.JWT_SECRET || "change_me_now";
const cookieName = process.env.AUTH_COOKIE_NAME || "token";

function createVerificationToken() {
  return crypto.randomBytes(24).toString("hex");
}

function getBaseUrl() {
  return process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL || "http://localhost:8081";
}

function createToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, jwtSecret, { expiresIn: "7d" });
}

function createCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export const authController = {
  // Step 1: Initiate email verification
  async initiateSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = emailSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase();

      // Check if user already exists and is verified
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser.emailVerified) {
        return res.status(409).json({ ok: false, error: "Email is already registered and verified." });
      }

      // Create or update verification token
      const verifyToken = createVerificationToken();
      const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      if (existingUser) {
        // Update existing unverified user
        existingUser.verifyToken = verifyToken;
        existingUser.verifyExpires = verifyExpires;
        await existingUser.save();
      } else {
        // Create new user record (unverified)
        await User.create({
          email: normalizedEmail,
          passwordHash: "", // Will be set during completion
          emailVerified: false,
          verifyToken,
          verifyExpires,
        });
      }

      const emailResult = await sendVerificationEmail({
        email: normalizedEmail,
        token: verifyToken,
        baseUrl: getBaseUrl(),
      });

      return res.json({
        ok: true,
        message: "Verification email sent. Check your email to complete signup.",
        ...(process.env.NODE_ENV !== "production"
          ? { devVerifyLink: emailResult.verifyLink }
          : {}),
      });
    } catch (error) {
      next(error);
    }
  },

  // Step 2: Complete signup after email verification
  async completeSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, token } = completeSignupSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase();

      const user = await User.findOne({
        email: normalizedEmail,
        verifyToken: token,
        verifyExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ ok: false, error: "Invalid or expired verification token." });
      }

      if (user.emailVerified) {
        return res.status(400).json({ ok: false, error: "Email is already verified." });
      }

      // Complete the signup
      const passwordHash = await bcrypt.hash(password, 10);
      user.passwordHash = passwordHash;
      user.name = name;
      user.emailVerified = true;
      user.verifyToken = undefined;
      user.verifyExpires = undefined;
      await user.save();

      const authToken = createToken(user.id, user.email);
      res.cookie(cookieName, authToken, createCookieOptions());

      return res.json({
        ok: true,
        token: authToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.query.token || "");
      if (!token) {
        return res.status(400).json({ ok: false, error: "Verification token is required." });
      }

      const user = await User.findOne({ verifyToken: token, verifyExpires: { $gt: new Date() } });
      if (!user) {
        return res.status(400).json({ ok: false, error: "Verification link is invalid or expired." });
      }

      // Don't mark as verified yet - redirect to complete signup page
      return res.redirect(
        `${getAppBaseUrl().replace(/\/$/, "")}/auth/complete-signup?token=${token}&email=${encodeURIComponent(user.email)}`,
      );
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase();

      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ ok: false, error: "Invalid credentials." });
      }

      if (!user.emailVerified) {
        return res.status(403).json({ ok: false, error: "Please verify your email before logging in." });
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatches) {
        return res.status(401).json({ ok: false, error: "Invalid credentials." });
      }

      const token = createToken(user.id, user.email);
      res.cookie(cookieName, token, createCookieOptions());

      return res.json({
        ok: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthRequest, res: Response) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ ok: false, error: "Not authenticated." });
    }

    return res.json({ ok: true, user });
  },

  async logout(req: AuthRequest, res: Response) {
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.json({ ok: true, message: "Logged out." });
  },
};
