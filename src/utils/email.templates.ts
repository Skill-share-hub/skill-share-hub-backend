export const otpTemplate = (otp: string) => {
  return `
    <div style="font-family: Arial;">
      <h2>Your OTP Code</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
    </div>
  `;
};

export const registerTemplate=(name:string)=>{
  return `
    <div style="font-family: Arial;">
      <h2>Welcome to SkillShareHub</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with SkillShareHub. We are excited to have you on board.</p>
    </div>
  `;
}