const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error("Missing Twilio credentials");
}

const client = twilio(accountSid, authToken);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/appointment", async (req, res) => {
  const { address, phone, time } = req.body;

  if (!address || !phone || !time) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  if (!process.env.TWILIO_FROM_NUMBER || !process.env.TO_NUMBER) {
    return res.status(500).json({
      success: false,
      error: "Server phone settings are missing"
    });
  }

  try {
    const message = await client.messages.create({
      body: `New Appointment\n\nAddress: ${address}\nPhone: ${phone}\nTime: ${time}`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TO_NUMBER
    });

    res.json({
      success: true,
      messageSid: message.sid
    });
  } catch (err) {
    console.error("Twilio error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
