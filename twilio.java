const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const twilio = require("twilio");

// ⚠️ Move these to environment variables later
const client = new twilio(
  "AC5faa95af4d7f0d604b64d30a440e71d2",
  "a90dc78bc2549216c6684572a0b55aec"
);

exports.sendSMS = functions.firestore
  .document("requests/{id}")
  .onCreate((snap) => {

    const data = snap.data();

    return client.messages.create({
      body: `🚨 New Request
📍 Address: ${data.address}
📞 Phone: ${data.phone}
⏰ Time: ${data.time}`,

      from: "+13236010663",
      to: "+13236134802"
    });
  });
