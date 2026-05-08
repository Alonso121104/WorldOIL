require("dotenv").config();

const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({   
  credential: admin.credential.cert(serviceAccount)
});
    
const db = admin.firestore();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
  
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log("SID prefix:", accountSid ? accountSid.slice(0, 2) : "missing");
console.log("FROM:", process.env.TWILIO_FROM_NUMBER || "missing");
console.log("TO:", process.env.TO_NUMBER || "missing");
   
if (!accountSid || !authToken) {
  console.error("Missing Twilio credentials in .env");
}
    
const client = twilio(accountSid, authToken);
      
app.get("/", (req, res) => {   
  res.sendFile(path.join(__dirname, "public", "index.html"));
}); 
    
app.get("/test-sms", async (req, res) => {
  try {
    const message = await client.messages.create({
      body: "Test SMS from World Oil",
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TO_NUMBER
    });

    console.log("Test SMS sent:", message.sid);
    res.send("Sent: " + message.sid);
  } catch (err) {
    console.error("Twilio test error:", err);
    res.status(500).send("Error: " + err.message);  }
});

app.post("/appointment", async (req, res) => {
  const { address, phone, time } = req.body;
  
  if (!address || !phone || !time) {
    return res.status(400).json({
      success: false,
      error: "Missing fields"
    });
  }
       
  if (!process.env.TWILIO_FROM_NUMBER || !process.env.TO_NUMBER) {
    return res.status(500).json({
      success: false,
      error: "Server phone settings are missing"  
    });
  }
      
  try {
    const docRef = await db.collection("appointments").add({
      address,
      phone,
      time,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()  });
   
    const message = await client.messages.create({
      body:
        `New Appointment\n\n` +
        `ID: ${docRef.id}\n` +
        `Address: ${address}\n` +   
        `Phone: ${phone}\n` +
        `Time: ${time}\n\n` +
        `Reply YES ${docRef.id} or NO ${docRef.id}`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TO_NUMBER
    });
  
    res.json({
      success: true, 
      message: "Appointment saved and text sent",
      id: docRef.id,
      messageSid: message.sid
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post("/sms", async (req, res) => {
  try {
    const body = (req.body.Body || "").trim().toUpperCase();
    const from = req.body.From;
    const [decision, requestId] = body.split(/\s+/); if (!["YES", "NO"].includes(decision) || !requestId) {
      return res.type("text/xml").send(`
<Response>
  <Message>Reply YES requestId or NO requestId</Message>
</Response>
      `);
    }
      
    const docRef = db.collection("appointments").doc(requestId);
    const snap = await docRef.get();
      
    if (!snap.exists) {
      return res.type("text/xml").send(`
<Response>
  <Message>Request not found.</Message>
</Response>
      `);
    }  
   
    const customerPhone = snap.data().phone;
    const newStatus = decision === "YES" ? "approved" : "declined";

    await docRef.update({
      status: newStatus,
      adminReply: decision,
      decisionBy: from,
      decisionAt: admin.firestore.FieldValue.serverTimestamp()
    });
      
    await client.messages.create({
      body:
        decision === "YES"
          ? "Your oil change request has been approved."
          : "Your requested time is unavailable. We will follow up with another option.",
      from: process.env.TWILIO_FROM_NUMBER,
      to: customerPhone
    });

    return res.type("text/xml").send(`
<Response>
  <Message>Recorded ${decision} for request ${requestId}</Message>
</Response>
    `);
  } catch (err) {
    console.error("SMS webhook error:", err); return res.type("text/xml").send(`
<Response>
  <Message>Error processing reply.</Message>
</Response>
    `);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
