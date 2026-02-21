import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) { }

  private makeJobId(payload: SendMailDto) {
    const raw = `${payload.to}|${payload.type}|${JSON.stringify(payload.context)}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  async enqueue(payload: SendMailDto) {
    try {
      const opts: any = {
        priority: 1,
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      };

      if (payload.type === 'verify' || payload.type === 'forgot') {
        opts.jobId = this.makeJobId(payload);
      }

      const job = await this.mailQueue.add('send', payload, opts);
      this.logger.log(`enqueued job ${job.id} to ${payload.to}`);
      return job;
    } catch (err) {
      this.logger.error('enqueue failed', err);
      return null;
    }
  }

  async sendVerifyEmail(to: string, token: string, name?: string) {
    return this.enqueue({
      to,
      type: 'verify',
      subject: 'Verify your email',
      context: { token, name },
    });
  }

  async sendForgotEmail(to: string, resetCode: string, username: string) {
    return this.enqueue({
      to,
      type: 'forgot',
      subject: 'Code to reset your password',
      context: { resetCode, username },
    });
  }

  async sendResetEmail(
    to: string,
    token: string,
    username?: string,
    expiresInMinutes: number = 60,
  ) {
    let expiresIn: string;
    if (expiresInMinutes < 60) {
      expiresIn = `${expiresInMinutes} minutes`;
    } else if (expiresInMinutes === 60) {
      expiresIn = '1 hour';
    } else {
      const hours = Math.floor(expiresInMinutes / 60);
      expiresIn = `${hours} hours`;
    }

    return this.enqueue({
      to,
      type: 'reset',
      subject: 'Reset your password',
      context: {
        token,
        username: username || 'there',
        expiresIn,
      },
    });
  }

  async sendEmailNotification(to: string, username: string, email: string) {
    return this.enqueue({
      to,
      type: 'send-notification',
      subject: 'Your Email is Already Registered',
      context: {
        username: username,
        email: email,
      },
    });
  }
}