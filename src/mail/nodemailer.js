import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.Nodemailerusername,
    pass: process.env.Nodemailerpassword,
  },
});

export const userotpsend = async (email, name, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"LOOPIX 👻" <${process.env.Nodemailerusername}>`,
      to: email,
      subject: "🔐 Verify Your Loopix Account",
      text: `
Hello ${name},

Your Loopix verification code is:

${otp}

This OTP is valid for 5 minutes.

If you didn't request this code, please ignore this email.

Regards,
Loopix Team 👻
`,
      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;}
body{background:#f5f7fb;padding:20px;}
.container{max-width:600px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,.08);}
.header{background:linear-gradient(135deg,#facc15,#fb7185,#a855f7);padding:40px 20px;text-align:center;color:white;}
.logo{font-size:60px;margin-bottom:10px;}
.header h1{font-size:34px;font-weight:800;letter-spacing:2px;}
.header p{opacity:.9;margin-top:8px;}
.content{padding:40px 30px;color:#333;}
.greeting{font-size:20px;margin-bottom:20px;}
.otp-box{background:linear-gradient(135deg,#fff7cc,#ffe4e6);padding:30px;border-radius:18px;text-align:center;margin:25px 0;}
.otp-code{font-size:48px;font-weight:800;letter-spacing:10px;color:#f59e0b;margin:15px 0;}
.info{background:#f8fafc;padding:16px;border-radius:12px;margin:20px 0;font-size:14px;line-height:1.7;}
.warning{background:#fff1f2;border-left:4px solid #ef4444;padding:15px;border-radius:10px;margin-top:20px;font-size:14px;}
.footer{background:#111827;color:#d1d5db;text-align:center;padding:25px;font-size:13px;}
.company{font-size:18px;font-weight:700;color:white;margin-bottom:8px;}
@media(max-width:600px){
  .content{padding:25px 20px;}
  .otp-code{font-size:38px;letter-spacing:6px;}
  .header h1{font-size:28px;}
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">👻</div>
    <h1>LOOPIX</h1>
    <p>Connect • Snap • Share</p>
  </div>
  <div class="content">
    <p class="greeting">Hello <strong>${name}</strong>,</p>
    <p>Welcome to Loopix 👻. Use the verification code below to securely verify your account.</p>
    <div class="otp-box">
      <p>Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p>Enter this code to continue</p>
    </div>
    <div class="info">
      <strong>⏰ OTP Validity:</strong><br>
      This code will expire in 5 minutes.
    </div>
    <div class="info">
      <strong>📋 Instructions:</strong>
      <ul style="padding-left:20px;margin-top:10px;">
        <li>Return to the Loopix verification page.</li>
        <li>Enter the OTP shown above.</li>
        <li>Click Verify to continue.</li>
      </ul>
    </div>
    <div class="warning">
      ⚠️ Never share this OTP with anyone. Loopix will never ask for your OTP, password, or personal credentials.
    </div>
    <p style="margin-top:25px;">Regards,<br><strong>Loopix Team 👻</strong></p>
  </div>
  <div class="footer">
    <div class="company">LOOPIX</div>
    <p>Connect, Chat, Snap and Share Moments Instantly.</p>
    <p style="margin-top:10px;">Support: ${process.env.SUPPORT_EMAIL || "support@loopix.com"}</p>
    <p style="margin-top:8px;">© ${new Date().getFullYear()} LOOPIX. All rights reserved.</p>
  </div>
</div>
</body>
</html>
      `,
    });

    console.log("OTP email sent:", email, info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (err) {
    console.error("OTP Email Error:", err.message);
    return { success: false, message: err.message };
  }
};
