import express from "express"
import {
  getUserAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability,
} from "../controllers/appointment.controller.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all appointments for the current user
router.get("/", getUserAppointments)

// Get a single appointment by ID
router.get("/:id", getAppointmentById)

// Create a new appointment (patients only)
router.post("/", authorize(["patient", "admin"]), createAppointment)

// Update an appointment
router.put("/:id", updateAppointment)

// Cancel an appointment
router.patch("/:id/cancel", cancelAppointment)

// Get available time slots for a doctor
router.get("/availability", getDoctorAvailability)

export default router

