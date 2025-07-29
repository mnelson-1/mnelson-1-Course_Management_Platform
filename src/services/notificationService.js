const nodemailer = require('nodemailer');
const redisService = require('./redisService');
const { ActivityTracker, Facilitator, Manager, User, CourseOffering, Module } = require('../models');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeEmailTransporter();
  }

  initializeEmailTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false // For development only
        }
      });

      console.log('Email transporter initialized');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        console.warn('Email transporter not available, skipping email send');
        return { success: false, error: 'Email transporter not configured' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}: ${result.messageId}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate email templates
  generateReminderEmail(facilitatorName, courseName, moduleCode, weekNumber, dueDate) {
    const subject = `Reminder: Weekly Activity Log Due - ${moduleCode} Week ${weekNumber}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #343a40; margin-bottom: 20px;">📋 Weekly Activity Log Reminder</h2>
          
          <p>Dear ${facilitatorName},</p>
          
          <p>This is a friendly reminder that your weekly activity log is due soon:</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
            <strong>Course:</strong> ${courseName} (${moduleCode})<br>
            <strong>Week:</strong> ${weekNumber}<br>
            <strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <p>Please ensure you complete the following activities:</p>
          <ul>
            <li>✅ Mark daily attendance</li>
            <li>📝 Update formative assessment grading status</li>
            <li>📊 Update summative assessment grading status</li>
            <li>🔍 Complete course moderation</li>
            <li>🔄 Sync with intranet</li>
            <li>📚 Update gradebook status</li>
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/activity-logs" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Submit Activity Log
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            If you have already submitted your log, please disregard this reminder.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 12px;">
            This is an automated message from the Course Management Platform.
          </p>
        </div>
      </div>
    `;

    return { subject, html };
  }

  generateOverdueAlertEmail(managerName, facilitatorName, courseName, moduleCode, weekNumber, daysOverdue) {
    const subject = `🚨 OVERDUE: Activity Log Missing - ${facilitatorName} - ${moduleCode} Week ${weekNumber}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7;">
          <h2 style="color: #856404; margin-bottom: 20px;">🚨 Overdue Activity Log Alert</h2>
          
          <p>Dear ${managerName},</p>
          
          <p>This is an urgent notification that a weekly activity log is overdue:</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <strong>Facilitator:</strong> ${facilitatorName}<br>
            <strong>Course:</strong> ${courseName} (${moduleCode})<br>
            <strong>Week:</strong> ${weekNumber}<br>
            <strong>Days Overdue:</strong> <span style="color: #dc3545; font-weight: bold;">${daysOverdue}</span>
          </div>
          
          <p><strong>Required Actions:</strong></p>
          <ul>
            <li>Contact the facilitator immediately</li>
            <li>Ensure log submission as soon as possible</li>
            <li>Review compliance procedures if necessary</li>
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/manager/compliance" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Compliance Report
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 12px;">
            This is an automated alert from the Course Management Platform.
          </p>
        </div>
      </div>
    `;

    return { subject, html };
  }

  generateSubmissionNotificationEmail(managerName, facilitatorName, courseName, moduleCode, weekNumber, submissionTime) {
    const subject = `✅ Activity Log Submitted - ${facilitatorName} - ${moduleCode} Week ${weekNumber}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; border: 1px solid #c3e6cb;">
          <h2 style="color: #155724; margin-bottom: 20px;">✅ Activity Log Submitted</h2>
          
          <p>Dear ${managerName},</p>
          
          <p>A weekly activity log has been successfully submitted:</p>
          
          <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <strong>Facilitator:</strong> ${facilitatorName}<br>
            <strong>Course:</strong> ${courseName} (${moduleCode})<br>
            <strong>Week:</strong> ${weekNumber}<br>
            <strong>Submitted:</strong> ${new Date(submissionTime).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/manager/activity-logs" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Activity Log
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 12px;">
            This is an automated notification from the Course Management Platform.
          </p>
        </div>
      </div>
    `;

    return { subject, html };
  }

  // Send reminder to facilitator
  async sendSubmissionReminder(facilitatorId, activityTrackerId) {
    try {
      const activityTracker = await ActivityTracker.findByPk(activityTrackerId, {
        include: [
          {
            model: Facilitator,
            as: 'facilitator',
            include: [{ model: User, as: 'user' }]
          },
          {
            model: CourseOffering,
            as: 'courseOffering',
            include: [{ model: Module, as: 'module' }]
          }
        ]
      });

      if (!activityTracker) {
        throw new Error('Activity tracker not found');
      }

      const facilitator = activityTracker.facilitator;
      const courseOffering = activityTracker.courseOffering;
      const module = courseOffering.module;

      const facilitatorName = `${facilitator.user.firstName} ${facilitator.user.lastName}`;
      const courseName = module.name;
      const moduleCode = module.code;

      const { subject, html } = this.generateReminderEmail(
        facilitatorName,
        courseName,
        moduleCode,
        activityTracker.weekNumber,
        activityTracker.dueDate
      );

      const result = await this.sendEmail(facilitator.user.email, subject, html);

      if (result.success) {
        // Update reminder sent status
        await activityTracker.update({
          reminderSent: true,
          reminderSentAt: new Date()
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending submission reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Send overdue alert to manager
  async sendOverdueAlert(managerId, facilitatorId, activityTrackerId) {
    try {
      const [manager, activityTracker] = await Promise.all([
        Manager.findByPk(managerId, {
          include: [{ model: User, as: 'user' }]
        }),
        ActivityTracker.findByPk(activityTrackerId, {
          include: [
            {
              model: Facilitator,
              as: 'facilitator',
              include: [{ model: User, as: 'user' }]
            },
            {
              model: CourseOffering,
              as: 'courseOffering',
              include: [{ model: Module, as: 'module' }]
            }
          ]
        })
      ]);

      if (!manager || !activityTracker) {
        throw new Error('Manager or activity tracker not found');
      }

      const facilitator = activityTracker.facilitator;
      const courseOffering = activityTracker.courseOffering;
      const module = courseOffering.module;

      const managerName = `${manager.user.firstName} ${manager.user.lastName}`;
      const facilitatorName = `${facilitator.user.firstName} ${facilitator.user.lastName}`;
      const courseName = module.name;
      const moduleCode = module.code;

      const daysOverdue = Math.ceil((new Date() - new Date(activityTracker.dueDate)) / (1000 * 60 * 60 * 24));

      const { subject, html } = this.generateOverdueAlertEmail(
        managerName,
        facilitatorName,
        courseName,
        moduleCode,
        activityTracker.weekNumber,
        daysOverdue
      );

      const result = await this.sendEmail(manager.user.email, subject, html);

      if (result.success) {
        // Update overdue alert sent status
        await activityTracker.update({
          overdueAlertSent: true,
          overdueAlertSentAt: new Date()
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending overdue alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Send submission notification to manager
  async sendSubmissionNotification(managerId, facilitatorId, activityTrackerId) {
    try {
      const [manager, activityTracker] = await Promise.all([
        Manager.findByPk(managerId, {
          include: [{ model: User, as: 'user' }]
        }),
        ActivityTracker.findByPk(activityTrackerId, {
          include: [
            {
              model: Facilitator,
              as: 'facilitator',
              include: [{ model: User, as: 'user' }]
            },
            {
              model: CourseOffering,
              as: 'courseOffering',
              include: [{ model: Module, as: 'module' }]
            }
          ]
        })
      ]);

      if (!manager || !activityTracker) {
        throw new Error('Manager or activity tracker not found');
      }

      const facilitator = activityTracker.facilitator;
      const courseOffering = activityTracker.courseOffering;
      const module = courseOffering.module;

      const managerName = `${manager.user.firstName} ${manager.user.lastName}`;
      const facilitatorName = `${facilitator.user.firstName} ${facilitator.user.lastName}`;
      const courseName = module.name;
      const moduleCode = module.code;

      const { subject, html } = this.generateSubmissionNotificationEmail(
        managerName,
        facilitatorName,
        courseName,
        moduleCode,
        activityTracker.weekNumber,
        activityTracker.submittedAt
      );

      const result = await this.sendEmail(manager.user.email, subject, html);
      return result;
    } catch (error) {
      console.error('Error sending submission notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Process pending reminders
  async processPendingReminders() {
    try {
      const pendingReminders = await ActivityTracker.getPendingReminders();
      console.log(`Processing ${pendingReminders.length} pending reminders`);

      for (const tracker of pendingReminders) {
        await redisService.addReminderJob(
          tracker.facilitatorId,
          tracker.id,
          tracker.dueDate
        );
      }

      return { success: true, processed: pendingReminders.length };
    } catch (error) {
      console.error('Error processing pending reminders:', error);
      return { success: false, error: error.message };
    }
  }

  // Process overdue alerts
  async processOverdueAlerts() {
    try {
      const overdueLogs = await ActivityTracker.getOverdueLogs();
      const unsentAlerts = overdueLogs.filter(log => !log.overdueAlertSent);
      
      console.log(`Processing ${unsentAlerts.length} overdue alerts`);

      for (const tracker of unsentAlerts) {
        const courseOffering = await CourseOffering.findByPk(tracker.courseOfferingId);
        if (courseOffering) {
          await redisService.addOverdueAlertJob(
            courseOffering.managerId,
            tracker.facilitatorId,
            tracker.id
          );
        }
      }

      return { success: true, processed: unsentAlerts.length };
    } catch (error) {
      console.error('Error processing overdue alerts:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;