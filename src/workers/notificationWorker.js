const redisService = require('../services/redisService');
const notificationService = require('../services/notificationService');

class NotificationWorker {
  constructor() {
    this.isRunning = false;
    this.processingJobs = new Set();
  }

  async start() {
    try {
      if (this.isRunning) {
        console.log('Notification worker is already running');
        return;
      }

      // Ensure Redis is connected
      if (!redisService.isConnected) {
        await redisService.connect();
      }

      if (!redisService.notificationQueue) {
        throw new Error('Notification queue not initialized');
      }

      this.isRunning = true;
      console.log('🚀 Notification worker started');

      // Process different types of notification jobs
      this.setupJobProcessors();

      // Setup queue event handlers
      this.setupQueueEventHandlers();

      // Start periodic cleanup
      this.startPeriodicCleanup();

      // Process any pending notifications
      await this.processPendingNotifications();

    } catch (error) {
      console.error('Failed to start notification worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  setupJobProcessors() {
    const queue = redisService.notificationQueue;

    // Process reminder notifications
    queue.process('reminder', 5, async (job) => {
      return await this.processReminderJob(job);
    });

    // Process overdue alerts
    queue.process('overdue_alert', 10, async (job) => {
      return await this.processOverdueAlertJob(job);
    });

    // Process submission notifications
    queue.process('submission_notification', 3, async (job) => {
      return await this.processSubmissionNotificationJob(job);
    });

    console.log('📋 Job processors configured');
  }

  setupQueueEventHandlers() {
    const queue = redisService.notificationQueue;

    queue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} (${job.name}) completed:`, result);
      this.processingJobs.delete(job.id);
    });

    queue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} (${job.name}) failed:`, err.message);
      this.processingJobs.delete(job.id);
    });

    queue.on('active', (job) => {
      console.log(`🔄 Job ${job.id} (${job.name}) started processing`);
      this.processingJobs.add(job.id);
    });

    queue.on('stalled', (job) => {
      console.warn(`⚠️ Job ${job.id} (${job.name}) stalled`);
    });

    queue.on('progress', (job, progress) => {
      console.log(`📊 Job ${job.id} progress: ${progress}%`);
    });

    console.log('📡 Queue event handlers configured');
  }

  async processReminderJob(job) {
    try {
      const { facilitatorId, activityTrackerId, type } = job.data;
      
      console.log(`Processing reminder job for facilitator ${facilitatorId}, tracker ${activityTrackerId}`);

      // Update job progress
      job.progress(25);

      const result = await notificationService.sendSubmissionReminder(
        facilitatorId, 
        activityTrackerId
      );

      job.progress(75);

      if (!result.success) {
        throw new Error(`Failed to send reminder: ${result.error}`);
      }

      job.progress(100);

      return {
        success: true,
        type: 'reminder',
        facilitatorId,
        activityTrackerId,
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing reminder job:', error);
      throw error;
    }
  }

  async processOverdueAlertJob(job) {
    try {
      const { managerId, facilitatorId, activityTrackerId, type } = job.data;
      
      console.log(`Processing overdue alert for manager ${managerId}, facilitator ${facilitatorId}`);

      job.progress(25);

      const result = await notificationService.sendOverdueAlert(
        managerId,
        facilitatorId,
        activityTrackerId
      );

      job.progress(75);

      if (!result.success) {
        throw new Error(`Failed to send overdue alert: ${result.error}`);
      }

      job.progress(100);

      return {
        success: true,
        type: 'overdue_alert',
        managerId,
        facilitatorId,
        activityTrackerId,
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing overdue alert job:', error);
      throw error;
    }
  }

  async processSubmissionNotificationJob(job) {
    try {
      const { managerId, facilitatorId, activityTrackerId, type } = job.data;
      
      console.log(`Processing submission notification for manager ${managerId}`);

      job.progress(25);

      const result = await notificationService.sendSubmissionNotification(
        managerId,
        facilitatorId,
        activityTrackerId
      );

      job.progress(75);

      if (!result.success) {
        throw new Error(`Failed to send submission notification: ${result.error}`);
      }

      job.progress(100);

      return {
        success: true,
        type: 'submission_notification',
        managerId,
        facilitatorId,
        activityTrackerId,
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing submission notification job:', error);
      throw error;
    }
  }

  async processPendingNotifications() {
    try {
      console.log('🔍 Processing pending notifications...');

      // Process pending reminders
      const reminderResult = await notificationService.processPendingReminders();
      if (reminderResult.success) {
        console.log(`📨 Scheduled ${reminderResult.processed} reminder notifications`);
      }

      // Process overdue alerts
      const overdueResult = await notificationService.processOverdueAlerts();
      if (overdueResult.success) {
        console.log(`🚨 Scheduled ${overdueResult.processed} overdue alert notifications`);
      }

    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  startPeriodicCleanup() {
    // Clean up old jobs every hour
    setInterval(async () => {
      try {
        await redisService.cleanQueue();
        console.log('🧹 Queue cleanup completed');
      } catch (error) {
        console.error('Error during queue cleanup:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Process pending notifications every 30 minutes
    setInterval(async () => {
      await this.processPendingNotifications();
    }, 30 * 60 * 1000); // 30 minutes

    console.log('⏰ Periodic cleanup and processing scheduled');
  }

  async stop() {
    try {
      if (!this.isRunning) {
        console.log('Notification worker is not running');
        return;
      }

      this.isRunning = false;

      // Wait for current jobs to complete
      console.log(`⏳ Waiting for ${this.processingJobs.size} jobs to complete...`);
      
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (this.processingJobs.size > 0 && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (this.processingJobs.size > 0) {
        console.warn(`⚠️ Stopping worker with ${this.processingJobs.size} jobs still processing`);
      }

      // Close the queue
      if (redisService.notificationQueue) {
        await redisService.notificationQueue.close();
      }

      console.log('🛑 Notification worker stopped');
    } catch (error) {
      console.error('Error stopping notification worker:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      if (!this.isRunning) {
        return {
          status: 'stopped',
          isRunning: false,
          processingJobs: 0,
          queueStats: null
        };
      }

      const queueStats = await redisService.getQueueStats();
      const redisHealth = await redisService.healthCheck();

      return {
        status: 'running',
        isRunning: this.isRunning,
        processingJobs: this.processingJobs.size,
        queueStats,
        redisHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        isRunning: this.isRunning,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Manual trigger methods for testing
  async triggerReminderCheck() {
    console.log('🔔 Manually triggering reminder check...');
    await this.processPendingNotifications();
  }

  async addTestJob(type = 'reminder', data = {}) {
    try {
      const testData = {
        facilitatorId: 'test-facilitator',
        activityTrackerId: 'test-tracker',
        type: 'test',
        ...data
      };

      const job = await redisService.addNotificationJob(type, testData);
      console.log(`🧪 Test job added: ${type} (ID: ${job.id})`);
      return job;
    } catch (error) {
      console.error('Error adding test job:', error);
      throw error;
    }
  }
}

// Create singleton instance
const notificationWorker = new NotificationWorker();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, shutting down notification worker gracefully...');
  await notificationWorker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down notification worker gracefully...');
  await notificationWorker.stop();
  process.exit(0);
});

module.exports = notificationWorker;