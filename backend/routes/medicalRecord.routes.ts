import express from "express"
import {
  getPatientMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} from "../controllers/medicalRecord.controller.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all medical records for the current user (if patient) or for a specific patient (if doctor/admin)
router.get("/", getPatientMedicalRecords)
router.get("/patient/:patientId", authorize(["doctor", "admin"]), getPatientMedicalRecords)

// Get a single medical record by ID
router.get("/:id", getMedicalRecordById)

// Create a new medical record (doctors and admins only)
router.post("/", authorize(["doctor", "admin"]), createMedicalRecord)

// Update a medical record (doctors and admins only)
router.put("/:id", authorize(["doctor", "admin"]), updateMedicalRecord)

// Delete a medical record (doctors and admins only)
router.delete("/:id", authorize(["doctor", "admin"]), deleteMedicalRecord)

export default router

