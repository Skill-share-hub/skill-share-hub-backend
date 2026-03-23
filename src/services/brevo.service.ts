import axios from "axios";
import { env } from "../config/env";

const BREVO_API_KEY = env.brevoApiKey;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
       const response = await axios.post(
            BREVO_API_URL,
            {
                sender: { email: env.emailUser },
                to: [{ email: to }],
                subject,
                htmlContent: html,
            },
            {
                headers: {
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error: any) {
    if (error.response) {
        console.error("🔴 Brevo API Error:");
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
        console.error("🟡 No response from Brevo:");
        console.error(error.request);
    } else {
        console.error("⚫ Axios Config/Error:");
        console.error(error.message);
    }

    throw error;
}
};