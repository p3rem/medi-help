import type { Request, Response } from "express"
import MedicalRecord from "../models/MedicalRecord.js"
import User from "../models/User.js"
import { createError } from "../utils/error.js"

// Get all medical records for a patient
export const getPatientMedicalRecords = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId || req.user.id

    // Check if the user is authorized to view these records
    if (req.user.role !== "admin" && req.user.role !== "doctor" && patientId !== req.user.id) {
      return res.status(403).json(createError(403, "Not authorized to access these medical records"))
    }

    // Get all medical records for the patient
    const medicalRecords = await MedicalRecord.find({ patient: patientId })
      .populate("doctor", "firstName lastName")
      .sort({ date: -1 })

    res.status(200).json({
      success: true,
      count: medicalRecords.length,
      medicalRecords,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Get a single medical record by ID
export const getMedicalRecordById = async (req: Request, res: Response) => {
  try {
    const recordId = req.params.id

    const medicalRecord = await MedicalRecord.findById(recordId)
      .populate("patient", "firstName lastName")
      .populate("doctor", "firstName lastName")

    if (!medicalRecord) {
      return res.status(404).json(createError(404, "Medical record not found"))
    }

    // Check if the user is authorized to view this record
    if (
      req.user.role !== "admin" &&
      req.user.role !== "doctor" &&
      medicalRecord.patient._id.toString() !== req.user.id
    ) {
      return res.status(403).json(createError(403, "Not authorized to access this medical record"))
    }

    res.status(200).json({
      success: true,
      medicalRecord,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Create a new medical record
export const createMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { patientId, recordType, title, date, description, attachments, isPrivate } = req.body

    // Check if patient exists
    const patient = await User.findById(patientId)
    if (!patient) {
      return res.status(404).json(createError(404, "Patient not found"))
    }

    // Only doctors and admins can create medical records
    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json(createError(403, "Not authorized to create medical records"))
    }

    // Create new medical record
    const newMedicalRecord = new MedicalRecord({
      patient: patientId,
      doctor: req.user.id,
      recordType,
      title,
      date: date || new Date(),
      description,
      attachments,
      isPrivate: isPrivate || false,
    })

    await newMedicalRecord.save()

    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      medicalRecord: newMedicalRecord,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Update a medical record
export const updateMedicalRecord = async (req: Request, res: Response) => {
  try {
    const recordId = req.params.id
    const { recordType, title, date, description, attachments, isPrivate } = req.body

    // Find medical record
    const medicalRecord = await MedicalRecord.findById(recordId)

    if (!medicalRecord) {
      return res.status(404).json(createError(404, "Medical record not found"))
    }

    // Check if the user is authorized to update this record
    if (req.user.role !== "admin" && medicalRecord.doctor.toString() !== req.user.id) {
      return res.status(403).json(createError(403, "Not authorized to update this medical record"))
    }

    // Update medical record fields
    if (recordType) medicalRecord.recordType = recordType
    if (title) medicalRecord.title = title
    if (date) medicalRecord.date = new Date(date)
    if (description) medicalRecord.description = description
    if (attachments) medicalRecord.attachments = attachments
    if (isPrivate !== undefined) medicalRecord.isPrivate = isPrivate

    await medicalRecord.save()

    res.status(200).json({
      success: true,
      message: "Medical record updated successfully",
      medicalRecord,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Delete a medical record
export const deleteMedicalRecord = async (req: Request, res: Response) => {
  try {
    const recordId = req.params.id

    // Find medical record
    const medicalRecord = await MedicalRecord.findById(recordId)

    if (!medicalRecord) {
      return res.status(404).json(createError(404, "Medical record not found"))
    }

    // Check if the user is authorized to delete this record
    if (req.user.role !== "admin" && medicalRecord.doctor.toString() !== req.user.id) {
      return res.status(403).json(createError(403, "Not authorized to delete this medical record"))
    }

    await MedicalRecord.findByIdAndDelete(recordId)

    res.status(200).json({
      success: true,
      message: "Medical record deleted successfully",
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

