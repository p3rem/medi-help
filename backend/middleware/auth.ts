import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { createError } from "../utils/error.js"

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string
        email: string
        role: string
      }
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(createError(401, "Authentication required. No token provided."))
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret") as {
      id: string
      email: string
      role: string
    }

    // Add user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    return res.status(401).json(createError(401, "Invalid or expired token"))
  }
}

// Middleware to check if user has required role
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(createError(401, "Authentication required"))
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(createError(403, "Not authorized to access this resource"))
    }

    next()
  }
}

