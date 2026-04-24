const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const path = require("path"); // 👈 add import here


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// Twilio setup (ONLY ONCE)
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "live" });
});

// Appointment route (ONLY ONCE)
app.post("/appointment", async (req, res) => {
  const { address, phone, time } = req.body;

  if (!address || !phone || !time) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const message = await client.messages.create({
      body: `📅 New Appointment\n\nAddress: ${address}\nPhone: ${phone}\nTime: ${time}`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TO_NUMBER
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
