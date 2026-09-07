import type { AlertProvider, AlertPayload } from "../types"

export const snsProvider: AlertProvider = {
  name: "sns",
  async send(_alert: AlertPayload) {
    // Stub — wire up with @aws-sdk/client-sns + FIP_SNS_TOPIC_ARN
    throw new Error("SNS provider not implemented. Install @aws-sdk/client-sns and set FIP_SNS_TOPIC_ARN.")
  },
}
