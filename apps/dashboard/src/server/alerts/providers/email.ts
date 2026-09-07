import type { AlertProvider, AlertPayload } from "../types"

export const emailProvider: AlertProvider = {
  name: "email",
  async send(_alert: AlertPayload) {
    // Stub — wire up with resend/nodemailer + FIP_EMAIL_TO + FIP_EMAIL_FROM
    throw new Error("Email provider not implemented. Install resend and set FIP_EMAIL_TO and FIP_EMAIL_FROM.")
  },
}
