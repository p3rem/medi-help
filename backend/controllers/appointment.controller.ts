import type { Request, Response } from "express"
import Appointment from "../models/Appointment.js"
import User from "../models/User.js"
import { createError } from "../utils/error.js"

// Get all appointments for the current user
export const getUserAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const { status, startDate, endDate } = req.query

    // Build query
    const query: any = {}

    // If user is a patient, get their appointments
    if (req.user.role === "patient") {
      query.patient = userId
    }
    // If user is a doctor, get appointments where they are the doctor
    else if (req.user.role === "doctor") {
      query.doctor = userId
    }

    // Filter by status if provided
    if (status) {
      query.status = status
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      }
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName email")
      .populate("doctor", "firstName lastName email")
      .sort({ date: 1, startTime: 1 })

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Get a single appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.id

    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "firstName lastName email")
      .populate("doctor", "firstName lastName email")

    if (!appointment) {
      return res.status(404).json(createError(404, "Appointment not found"))
    }

    // Check if the user is authorized to view this appointment
    if (
      req.user.role !== "admin" &&
      appointment.patient._id.toString() !== req.user.id &&
      appointment.doctor._id.toString() !== req.user.id
    ) {
      return res.status(403).json(createError(403, "Not authorized to access this appointment"))
    }

    res.status(200).json({
      success: true,
      appointment,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Create a new appointment
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { doctorId, date, startTime, endTime, type, reason } = req.body

    // Check if doctor exists
    const doctor = await User.findById(doctorId)
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json(createError(404, "Doctor not found"))
    }

    // Create new appointment
    const newAppointment = new Appointment({
      patient: req.user.id,
      doctor: doctorId,
      date,
      startTime,
      endTime,
      type,
      reason,
      status: "scheduled",
    })

    await newAppointment.save()

    // Populate patient and doctor info
    const appointment = await Appointment.findById(newAppointment._id)
      .populate("patient", "firstName lastName email")
      .populate("doctor", "firstName lastName email")

    res.status(201).json({
      success: true,
      message: "Appointment scheduled successfully",
      appointment,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Update an appointment
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.id
    const { date, startTime, endTime, type, reason, status, notes } = req.body

    // Find appointment
    let appointment = await Appointment.findById(appointmentId)

    if (!appointment) {
      return res.status(404).json(createError(404, "Appointment not found"))
    }

    // Check if the user is authorized to update this appointment
    if (
      req.user.role !== "admin" &&
      appointment.patient.toString() !== req.user.id &&
      appointment.doctor.toString() !== req.user.id
    ) {
      return res.status(403).json(createError(403, "Not authorized to update this appointment"))
    }

    // Update appointment fields
    if (date) appointment.date = new Date(date)
    if (startTime) appointment.startTime = startTime
    if (endTime) appointment.endTime = endTime
    if (type) appointment.type = type
    if (reason) appointment.reason = reason
    if (status) appointment.status = status
    if (notes) appointment.notes = notes

    await appointment.save()

    // Populate patient and doctor info
    appointment = await Appointment.findById(appointmentId)
      .populate("patient", "firstName lastName email")
      .populate("doctor", "firstName lastName email")

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Cancel an appointment
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.id

    // Find appointment
    const appointment = await Appointment.findById(appointmentId)

    if (!appointment) {
      return res.status(404).json(createError(404, "Appointment not found"))
    }

    // Check if the user is authorized to cancel this appointment
    if (
      req.user.role !== "admin" &&
      appointment.patient.toString() !== req.user.id &&
      appointment.doctor.toString() !== req.user.id
    ) {
      return res.status(403).json(createError(403, "Not authorized to cancel this appointment"))
    }

    // Update appointment status to cancelled
    appointment.status = "cancelled"
    await appointment.save()

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Get available time slots for a doctor
export const getDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.query

    if (!doctorId || !date) {
      return res.status(400).json(createError(400, "Doctor ID and date are required"))
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId)
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json(createError(404, "Doctor not found"))
    }

    // Get all appointments for the doctor on the specified date
    const appointments = await Appointment.find({
      doctor: doctorId,
      date: new Date(date as string),
      status: { $ne: "cancelled" },
    }).select("startTime endTime")

    // Define available time slots (this is a simplified example)
    const availableTimeSlots = [
      { startTime: "09:00", endTime: "09:30" },
      { startTime: "09:30", endTime: "10:00" },
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "10:30", endTime: "11:00" },
      { startTime: "11:00", endTime: "11:30" },
      { startTime: "11:30", endTime: "12:00" },
      { startTime: "13:00", endTime: "13:30" },
      { startTime: "13:30", endTime: "14:00" },
      { startTime: "14:00", endTime: "14:30" },
      { startTime: "14:30", endTime: "15:00" },
      { startTime: "15:00", endTime: "15:30" },
      { startTime: "15:30", endTime: "16:00" },
    ]

    // Filter out booked time slots
    const bookedTimeSlots = appointments.map((app) => ({
      startTime: app.startTime,
      endTime: app.endTime,
    }))

    const availableSlots = availableTimeSlots.filter((slot) => {
      return !bookedTimeSlots.some(
        (bookedSlot) => bookedSlot.startTime === slot.startTime && bookedSlot.endTime === slot.endTime,
      )
    })

    res.status(200).json({
      success: true,
      availableSlots,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

