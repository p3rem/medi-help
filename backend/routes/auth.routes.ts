import express from "express"
import { register, login, getCurrentUser, logout } from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)

// Protected routes
router.get("/me", authenticate, getCurrentUser)

export default router

