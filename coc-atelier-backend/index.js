const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer'); 

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'cakeoclockatelier_reservations.db');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize SQLite database connection
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error('❌ Database failure:', err.message);
  else {
    db.run(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        schedule TEXT NOT NULL,
        order_items TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

// ==========================================================================
// CONFIGURING THE EMAIL OUTBOX CARRIER (NODEMAILER WITH GMAIL APP PASSWORD)
// ==========================================================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Forces secure SSL connection
  auth: {
    user: 'kathleennava.work@gmail.com', 
    pass: 'wjol bxmy nhhp sojy'   
  },
  // NEW: Tells Nodemailer to allow your local machine to send the request
  tls: {
    rejectUnauthorized: false
  }
});

// ==========================================================================
// API ENDPOINT: PROCESS PRE-ORDERS AND SEND EMAILS
// ==========================================================================
app.post('/api/inquiry', (req, res) => {
  const { name, email, phone, address, deliveryDate, schedule, notes, orders } = req.body;

  if (!name || !email || !phone || !address || !deliveryDate || !schedule) {
    return res.status(400).json({ success: false, error: 'Missing required delivery fields.' });
  }

  const orderSummary = orders.map(item => `${item.qty}x ${item.name}`).join(', ');
  const calculatedTotal = orders.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const sql = `
    INSERT INTO reservations (name, email, phone, address, delivery_date, schedule, order_items, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [name, email, phone, address, deliveryDate, schedule, orderSummary, notes || ''];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('❌ SQL Insert Failure:', err.message);
      return res.status(500).json({ success: false, error: 'Database saving failure.' });
    }
    
    console.log(`🎉 Order #${this.lastID} saved to DB. Preparing confirmation dispatches...`);

    // ─── FIX 1: CHANGE THE "FROM" EMAIL TO MATCH YOUR LOGIN EMAIL ADDRESS ───
    
    // EMAIL TYPE A: FOR THE CUSTOMER
    const customerMailOptions = {
      from: '"Cake o\' Clock Atelier" <kathleennava.work@gmail.com>',
      to: email, 
      subject: '🧁 We got your Cake o\' Clock Atelier pre-order request!',
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #f1f1f1; padding: 20px; border-radius: 12px;">
          <h2 style="color: #F628AD;">Hi ${name}, your treats are requested!</h2>
          <p>Thank you for placing a reservation. Here are your details:</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <h3>🚚 Delivery Logistics</h3>
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>Date:</strong> ${deliveryDate}</p>
          <p><strong>Schedule Window:</strong> ${schedule === 'morning' ? 'Morning (8 AM - 12 PM)' : 'Afternoon (1 PM - 5 PM)'}</p>
          <p><strong>Contact Phone:</strong> ${phone}</p>
          
          <h3>🛍️ Order Summary</h3>
          <p style="background: #fafafa; padding: 15px; border-radius: 8px; font-weight: bold; color: #555;">${orderSummary}</p>
          <p style="font-size: 18px;">Total Estimated Basket: <strong style="color: #F628AD;">₱${calculatedTotal.toLocaleString()}</strong></p>
          
          ${notes ? `<p><strong>Notes Provided:</strong> <em>"${notes}"</em></p>` : ''}
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">This is an automated request verification tracking. We will reach out shortly to finalize payment details!</p>
        </div>
      `
    };

    // EMAIL TYPE B: FOR YOU (THE BAKERY OWNER)
    const ownerMailOptions = {
      from: '"Cake o\' Clock Atelier System Alert" <kathleennava.work@gmail.com>',
      to: 'kathleennava.work@gmail.com', // FIX 2: ROUTED TO YOUR ACTUAL WORKBOX
      subject: `🚨 NEW ORDER RECEIVED - #${this.lastID} (${name})`,
      html: `
        <div style="font-family: sans-serif; background: #FFF5FB; padding: 20px; border-radius: 12px; border: 1px solid #F628AD;">
          <h2 style="color: #A31271; margin-top: 0;">New Reservation Request Alert!</h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Email Address:</strong> ${email}</p>
          <p><strong>Phone Number:</strong> ${phone}</p>
          <p><strong>Delivery Location:</strong> ${address}</p>
          <p><strong>Requested Dispatch Date:</strong> ${deliveryDate} (${schedule})</p>
          
          <div style="background: #ffffff; padding: 15px; border-left: 4px solid #F628AD; margin: 15px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 5px 0;">Bake Items Checklist:</h4>
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">${orderSummary}</p>
          </div>
          
          <p><strong>Collected Special Notes:</strong> ${notes || 'None'}</p>
          <p><strong>Total Value:</strong> ₱${calculatedTotal.toLocaleString()}</p>
        </div>
      `
    };

    // Execute the parallel background email delivery threads with console logs for tracking errors
    transporter.sendMail(customerMailOptions, (mailErr, info) => {
      if (mailErr) console.error('⚠️ Failed to deliver mail to customer:', mailErr.message);
      else console.log('📨 Customer email sent successfully:', info.response);
    });

    transporter.sendMail(ownerMailOptions, (mailErr, info) => {
      if (mailErr) console.error('⚠️ Failed to deliver notification alert to owner:', mailErr.message);
      else console.log('📩 Owner notification sent successfully:', info.response);
    });

    return res.status(201).json({ success: true, message: 'Reservation locked and confirmation emails queued!' });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Automated Production Backend active on http://localhost:${PORT}`);
});