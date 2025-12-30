import type { Request, Response } from "express"
import User from "../models/User.js"
import { createError } from "../utils/error.js"

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json(createError(400, "User with this email already exists"))
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || "patient",
    })

    // Save user to database
    await newUser.save()

    // Generate JWT token
    const token = newUser.generateAuthToken()

    // Return user data (excluding password)
    const userData = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userData,
      token,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json(createError(401, "Invalid email or password"))
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json(createError(401, "Invalid email or password"))
    }

    // Generate JWT token
    const token = user.generateAuthToken()

    // Return user data (excluding password)
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userData,
      token,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User is attached to request by auth middleware
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
      return res.status(404).json(createError(404, "User not found"))
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    // In a real implementation, you might want to invalidate the token
    // This could be done by adding it to a blacklist or using short-lived tokens with refresh tokens

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error: any) {
    res.status(500).json(createError(500, error.message))
  }
}

