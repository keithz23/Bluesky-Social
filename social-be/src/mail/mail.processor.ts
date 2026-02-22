import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import type { TemplateDelegate } from 'handlebars';

import { SendMailDto } from './dto/send-mail.dto';
import { resolveTemplatePath } from 'src/common/utils/assets_path.util';

@Processor('mail', { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  private transporter: nodemailer.Transporter;
  private templateCache = new Map<string, TemplateDelegate>();

  private readonly appUrl: string;
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor(private readonly cfg: ConfigService) {
    super();

    this.appUrl =
      this.cfg.get<string>('config.server.url') || 'http://localhost:5173';
    this.fromAddress = this.cfg.get<string>('config.mail.user') || '';
    this.fromName = this.cfg.get<string>('config.mail.fromName') || 'No Reply';

    this.transporter = nodemailer.createTransport({
      host: this.cfg.get<string>('config.mail.host'),
      port: Number(this.cfg.get('config.mail.port') || 465),
      secure: String(this.cfg.get('config.mail.secure') || 'true') === 'true', // 465->true, 587->false
      auth: {
        user: this.fromAddress,
        pass: this.cfg.get<string>('config.mail.password'),
      },
      pool: true,
      maxConnections: Number(this.cfg.get('config.mail.maxConnections') || 5),
      maxMessages: Number(this.cfg.get('config.mail.maxMessages') || 100),
    });

    this.loadTemplate('verify');
    this.loadTemplate('reset');
    this.loadTemplate('welcome');
    this.loadTemplate('send-notification');
    this.loadTemplate('forgot');
  }

  private loadTemplate(name: string): void {
    try {
      const file = resolveTemplatePath(name);
      const source = fs.readFileSync(file, 'utf8');
      const compiled = Handlebars.compile(source, { noEscape: false });
      this.templateCache.set(name, compiled);
      this.logger.log(`Loaded template: ${path.basename(file)}`);
    } catch (error) {
      this.logger.error(`Failed to load template "${name}": ${error?.message}`);
    }
  }

  private renderTemplate(name: string, context: Record<string, any>): string {
    const template = this.templateCache.get(name);
    if (!template) {
      throw new Error(`Template "${name}" not found in cache`);
    }
    return template(context);
  }

  private htmlToTextFallback(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async process(job: Job<SendMailDto, any, string>) {
    const { to, type, context } = job.data;
    console.log(type)

    try {
      let subject = job.data.subject?.trim();
      let html = '';

      switch (type) {
        case 'verify': {
          subject ||= 'Verify your email';
          const verifyUrl = `${this.appUrl}/auth/verify-email?token=${encodeURIComponent(
            context.token,
          )}${context.redirect ? `&redirect=${encodeURIComponent(context.redirect)}` : ''}`;
          html = this.renderTemplate('verify', {
            ...context,
            verifyUrl,
          });
          break;
        }
        case 'send-notification': {
          subject ||= 'Your Email is Already Registered';
          html = this.renderTemplate('send-notification', context);
          break;
        }
        case 'reset': {
          subject ||= 'Reset your password';
          const resetUrl = `${this.appUrl}/auth/reset?token=${encodeURIComponent(
            context.token,
          )}${context.redirect ? `&redirect=${encodeURIComponent(context.redirect)}` : ''}`;
          html = this.renderTemplate('reset', {
            ...context,
            resetUrl,
          });
          break;
        }
        case 'forgot': {
          subject ||= 'Code to reset your password';
          html = this.renderTemplate('forgot', {
            ...context,
            resetUrl: `${this.appUrl}/auth/reset-password${context.redirect ? `?redirect=${encodeURIComponent(context.redirect)}` : ''
              }`,
          });
          break;
        }
        case 'welcome':
        default: {
          subject ||= 'Welcome!';
          html = this.renderTemplate('welcome', context);
          break;
        }
      }

      this.logger.debug(type);

      const text = this.htmlToTextFallback(html);

      const from = `"${this.fromName}" <${this.fromAddress}>`;

      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
      });

      this.logger.log(
        `Email sent → to="${to}" subject="${subject}" messageId=${info.messageId}`,
      );
      return { ok: true, messageId: info.messageId };
    } catch (error: any) {
      // - wrong version number: SSL/TLS sai cổng/secure
      // - self signed certificate: TLS
      // - ETIMEDOUT / ESOCKETTIMEDOUT: network
      const code = error?.code || 'MAIL_ERROR';
      const reason = error?.response || error?.message || 'Unknown error';
      this.logger.error(
        `Failed to send email → to="${to}" type="${type}" code=${code} reason="${reason}"`,
        error?.stack,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Mail job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Mail job ${job?.id} failed: ${err.message}`, err.stack);
  }
}