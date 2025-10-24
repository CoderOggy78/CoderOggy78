const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

// Set SENDGRID_API_KEY in functions config: firebase functions:config:set sendgrid.key="YOUR_KEY"
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || (functions.config().sendgrid && functions.config().sendgrid.key);
if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY);
}

exports.submitContact = functions.region('us-central1').https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const doc = await db.collection('contactMessages').add({ name, email, message, createdAt: admin.firestore.FieldValue.serverTimestamp() });

    if (SENDGRID_KEY) {
      const msg = {
        to: process.env.NOTIFY_EMAIL || 'owner@example.com',
        from: process.env.FROM_EMAIL || 'portfolio@firebase-functions.com',
        subject: `New contact message from ${name}`,
        text: `${name} <${email}>\n\n${message}`,
      };
      try { await sgMail.send(msg); } catch (_) { /* ignore sendgrid errors */ }
    }

    res.status(200).json({ id: doc.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});
