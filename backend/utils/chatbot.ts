// Import the chatbot logic from the frontend
import { generateResponse as frontendGenerateResponse } from "../../lib/chatbot-ai.js"

// Wrapper function to use the frontend chatbot logic
export const generateResponse = (userInput: string, userContext: any = null) => {
  return frontendGenerateResponse(userInput, userContext)
}

