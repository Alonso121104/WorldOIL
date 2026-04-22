const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const twilio = require("twilio");

const client = new twilio("TWILIO_SID", "TWILIO_AUTH");

exports.sendSMS = functions.firestore
  .document("requests/{id}")
  .onCreate((snap) => {
    const data = snap.data();

    return client.messages.create({
      body: `New Request:
Address: ${data.address}
Phone: ${data.phone}
Time: ${data.time}`,
      from: "YOUR_TWILIO_NUMBER",
      to: "YOUR_PERSONAL_PHONE"
    });
  });
