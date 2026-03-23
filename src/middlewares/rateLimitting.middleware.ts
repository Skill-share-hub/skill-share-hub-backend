import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later.",
    });
  },
});


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5, // only 5 OTP requests
  message: {
    success: false,
    message: "Too many OTP requests. Try again after 10 minutes.",
  },
});