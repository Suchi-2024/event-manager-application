const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Get email configuration from environment
const getEmailConfig = () => {
  const user = functions.config().email?.user || process.env.EMAIL_USER;
  const pass = functions.config().email?.pass || process.env.EMAIL_PASS;
  
  if (!user || !pass) {
    console.error("Email configuration missing!");
    return null;
  }
  
  return {user, pass};
};

// Create email transporter
const createTransporter = () => {
  const config = getEmailConfig();
  if (!config) return null;
  
  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

/**
 * Scheduled function to send task reminders
 * Runs every hour to check for tasks that need reminders
 */
exports.sendTaskReminders = functions
    .runWith({
      timeoutSeconds: 540,
      memory: "1GB",
    })
    .pubsub
    .schedule("every 1 hours")
    .timeZone("Asia/Kolkata")
    .onRun(async (context) => {
      const now = new Date();
      const db = admin.firestore();

      console.log("🔔 Checking for task reminders...", now.toISOString());

      try {
        // Query tasks that need reminders
        const tasksSnapshot = await db
            .collection("tasks")
            .where("status", "in", ["pending", "ongoing"])
            .where("reminderSent", "==", false)
            .get();

        if (tasksSnapshot.empty) {
          console.log("✅ No tasks requiring reminders");
          return null;
        }

        console.log(`📋 Found ${tasksSnapshot.size} tasks to check`);

        const transporter = createTransporter();
        if (!transporter) {
          console.error("❌ Email transporter not configured");
          return null;
        }

        const reminderPromises = [];

        tasksSnapshot.forEach((doc) => {
          const task = doc.data();
          const taskId = doc.id;

          if (!task.reminder || !task.uid || !task.due) return;

          const dueDate = new Date(task.due);
          const reminderMinutes = getReminderMinutes(task.reminder);
          const reminderTime = new Date(
              dueDate.getTime() - reminderMinutes * 60000,
          );

          // Check if it's time to send reminder
          if (now >= reminderTime && now < dueDate) {
            console.log(`📤 Sending reminder for task: ${task.text}`);
            reminderPromises.push(
                sendReminder(db, transporter, taskId, task),
            );
          }
        });

        await Promise.all(reminderPromises);
        console.log(`✅ Sent ${reminderPromises.length} reminders`);

        return null;
      } catch (error) {
        console.error("❌ Error in sendTaskReminders:", error);
        return null;
      }
    });

/**
 * Send reminder email for a specific task
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {nodemailer.Transporter} transporter - Email transporter
 * @param {string} taskId - Task document ID
 * @param {Object} task - Task data
 * @return {Promise<void>}
 */
async function sendReminder(db, transporter, taskId, task) {
  try {
    // Get user email from Firebase Auth
    const userDoc = await admin.auth().getUser(task.uid);
    const userEmail = userDoc.email;

    if (!userEmail) {
      console.log(`⚠️ No email found for user ${task.uid}`);
      return;
    }

    const dueDate = new Date(task.due);
    const timeUntilDue = getTimeUntilDue(dueDate);
    const priorityEmoji = getPriorityEmoji(task.priority || "medium");
    const config = getEmailConfig();

    const mailOptions = {
      from: `Event Manager <${config.user}>`,
      to: userEmail,
      subject: `${priorityEmoji} Reminder: "${task.text}" is due ${timeUntilDue}`,
      html: generateEmailHTML(task, dueDate, timeUntilDue),
    };

    await transporter.sendMail(mailOptions);

    // Mark reminder as sent
    await db.collection("tasks").doc(taskId).update({
      reminderSent: true,
      reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Reminder sent for task: ${task.text} to ${userEmail}`);
  } catch (error) {
    console.error(`❌ Error sending reminder for task ${taskId}:`, error);
  }
}

/**
 * Generate HTML email template
 * @param {Object} task - Task data
 * @param {Date} dueDate - Task due date
 * @param {string} timeUntilDue - Human-readable time until due
 * @return {string} HTML email content
 */
function generateEmailHTML(task, dueDate, timeUntilDue) {
  const priority = task.priority || "medium";
  const priorityColor = getPriorityColor(priority);
  const priorityEmoji = getPriorityEmoji(priority);
  const appUrl = "https://your-app-url.vercel.app"; // Update with your actual URL

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .task-card { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 5px solid ${priorityColor}; 
        }
        .priority-badge { 
          display: inline-block; 
          padding: 6px 12px; 
          background: ${priorityColor}; 
          color: white; 
          border-radius: 6px; 
          font-weight: bold; 
          font-size: 11px; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
        .task-title { 
          color: #2d3748; 
          margin: 15px 0 10px 0; 
          font-size: 20px;
          font-weight: 600;
        }
        .task-detail { 
          color: #718096; 
          margin: 8px 0; 
          font-size: 14px;
        }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #667eea; 
          color: white !important; 
          text-decoration: none; 
          border-radius: 8px; 
          margin-top: 20px;
          font-weight: 600;
        }
        .footer { 
          text-align: center; 
          color: #a0aec0; 
          font-size: 12px; 
          padding: 20px; 
          border-top: 1px solid #e2e8f0;
        }
        .message-box {
          background: ${priority === "urgent" ? "#fee2e2" : "#eff6ff"};
          border-left: 4px solid ${priorityColor};
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗓️ Event Manager</h1>
          <p>Task Reminder Notification</p>
        </div>
        <div class="content">
          <p>Hi there! 👋</p>
          <p>This is your friendly reminder about an upcoming task:</p>
          
          <div class="task-card">
            <div class="priority-badge">${priorityEmoji} ${priority.toUpperCase()} PRIORITY</div>
            <h2 class="task-title">${task.text}</h2>
            <p class="task-detail">
              📅 <strong>Due:</strong> ${dueDate.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  })}
            </p>
            <p class="task-detail">
              ⏰ <strong>Time remaining:</strong> ${timeUntilDue}
            </p>
            <p class="task-detail">
              📊 <strong>Status:</strong> ${
  task.status.charAt(0).toUpperCase() + task.status.slice(1)
}
            </p>
          </div>

          <div class="message-box">
            <strong>${getPriorityMessage(priority, timeUntilDue)}</strong>
          </div>

          <center>
            <a href="${appUrl}" class="button">
              📱 Open Task in App
            </a>
          </center>

        </div>
        <div class="footer">
          <p>You're receiving this because you set a reminder for this task.</p>
          <p>Event Manager - Stay organized, track progress, build habits</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get reminder time in minutes based on reminder type
 * @param {string} reminderType - Type of reminder
 * @return {number} Minutes before due date
 */
function getReminderMinutes(reminderType) {
  const settings = {
    "1hour": 60,
    "3hours": 180,
    "1day": 1440,
    "3days": 4320,
    "1week": 10080,
  };
  return settings[reminderType] || 1440;
}

/**
 * Get human-readable time until due date
 * @param {Date} dueDate - Task due date
 * @return {string} Human-readable time
 */
function getTimeUntilDue(dueDate) {
  const now = new Date();
  const diff = dueDate - now;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
  return "very soon!";
}

/**
 * Get emoji for priority level
 * @param {string} priority - Priority level
 * @return {string} Emoji
 */
function getPriorityEmoji(priority) {
  const emojis = {
    urgent: "🚨",
    high: "⚠️",
    medium: "📌",
    low: "ℹ️",
  };
  return emojis[priority] || "📌";
}

/**
 * Get color for priority level
 * @param {string} priority - Priority level
 * @return {string} Hex color
 */
function getPriorityColor(priority) {
  const colors = {
    urgent: "#ef4444",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#10b981",
  };
  return colors[priority] || "#3b82f6";
}

/**
 * Get priority-specific message
 * @param {string} priority - Priority level
 * @param {string} timeUntil - Time until due
 * @return {string} Message
 */
function getPriorityMessage(priority, timeUntil) {
  if (priority === "urgent") {
    return `🚨 This is an URGENT task! Please prioritize this ${timeUntil}.`;
  } else if (priority === "high") {
    return `⚠️ This is a high-priority task. Make sure to complete it ${timeUntil}.`;
  } else if (priority === "medium") {
    return `📌 Don't forget about this task! It's due ${timeUntil}.`;
  } else {
    return `ℹ️ Just a gentle reminder about this task due ${timeUntil}.`;
  }
}
