const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

const client = new twilio("AC5faa95af4d7f0d604b64d30a440e71d2", "a90dc78bc2549216c6684572a0b55aec");

app.post("/appointment", async (req, res) => {
  const { name, phone, address, time } = req.body;

  try {
    await client.messages.create({
      body: `New Appointment:\n${name}\n${phone}\n${address}\n${time}`,
      from: "+13236010663",
      to: "+13236134802"
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => console.log("Server running"));
