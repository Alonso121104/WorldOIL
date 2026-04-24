const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "live" });
});

// 🔐 Use environment variables in production
const accountSid = process.env.TWILIO_SID || "YOUR_TWILIO_SID";
const authToken = process.env.TWILIO_AUTH_TOKEN || "YOUR_TWILIO_AUTH_TOKEN";

const client = twilio(accountSid, authToken);

// 📩 Appointment endpoint
app.post("/appointment", async (req, res) => {
  const { name, phone, address, time } = req.body;

  if (!name || !phone || !address || !time) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const message = await client.messages.create({
      body: `📅 New Appointment\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nTime: ${time}`,
      from: process.env.TWILIO_FROM_NUMBER || "+1234567890", // your Twilio number
      to: process.env.TO_NUMBER || "+19876543210" // your verified number
    });

    res.json({
      success: true,
      messageSid: message.sid
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🌐 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
