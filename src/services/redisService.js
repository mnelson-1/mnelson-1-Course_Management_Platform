const Redis = require('redis');
const Bull = require('bull');

class RedisService {
  constructor() {
    this.client = null;
    this.notificationQueue = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Create Redis client
      this.client = Redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
      });

      // Handle Redis events
      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();

      // Initialize Bull queue for notifications
      this.notificationQueue = new Bull('notification queue', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: 3,           // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      console.log('Redis service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.notificationQueue) {
        await this.notificationQueue.close();
      }
      if (this.client && this.isConnected) {
        await this.client.quit();
      }
      console.log('Redis service disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }

  // Cache operations
  async set(key, value, expireInSeconds = 3600) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache set');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, expireInSeconds, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache delete');
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // Queue operations for notifications
  async addNotificationJob(jobType, data, options = {}) {
    try {
      if (!this.notificationQueue) {
        console.warn('Notification queue not initialized');
        return null;
      }

      const job = await this.notificationQueue.add(jobType, data, {
        delay: options.delay || 0,
        priority: options.priority || 0,
        ...options,
      });

      console.log(`Notification job added: ${jobType} (ID: ${job.id})`);
      return job;
    } catch (error) {
      console.error('Error adding notification job:', error);
      return null;
    }
  }

  async addReminderJob(facilitatorId, activityTrackerId, dueDate) {
    const reminderTime = new Date(dueDate);
    reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before due

    const delay = Math.max(0, reminderTime.getTime() - Date.now());

    return await this.addNotificationJob('reminder', {
      facilitatorId,
      activityTrackerId,
      dueDate: dueDate.toISOString(),
      type: 'submission_reminder'
    }, {
      delay,
      priority: 5
    });
  }

  async addOverdueAlertJob(managerId, facilitatorId, activityTrackerId) {
    return await this.addNotificationJob('overdue_alert', {
      managerId,
      facilitatorId,
      activityTrackerId,
      type: 'overdue_alert'
    }, {
      priority: 10 // High priority for overdue alerts
    });
  }

  async addSubmissionNotificationJob(managerId, facilitatorId, activityTrackerId) {
    return await this.addNotificationJob('submission_notification', {
      managerId,
      facilitatorId,
      activityTrackerId,
      type: 'submission_notification'
    }, {
      priority: 3
    });
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      if (!this.notificationQueue) {
        return null;
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.notificationQueue.getWaiting(),
        this.notificationQueue.getActive(),
        this.notificationQueue.getCompleted(),
        this.notificationQueue.getFailed(),
        this.notificationQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return null;
    }
  }

  // Clean up old jobs
  async cleanQueue() {
    try {
      if (!this.notificationQueue) {
        return false;
      }

      await this.notificationQueue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 24 hours
      await this.notificationQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
      
      console.log('Queue cleaned successfully');
      return true;
    } catch (error) {
      console.error('Error cleaning queue:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', redis: false, queue: false };
      }

      // Test Redis connection
      await this.client.ping();
      
      // Test queue
      const queueHealth = this.notificationQueue ? true : false;
      
      return {
        status: 'healthy',
        redis: true,
        queue: queueHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: false,
        queue: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService;