import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    if (!ctx) {
      this.logger.error(
        'Non-HTTP context exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
      return;
    }

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url,
      method: request?.method,
      message,
    };

    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse['stack'] = exception.stack;
    }

    this.logger.error(
      `${request?.method ?? 'N/A'} ${request?.url ?? 'N/A'}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    if (response && response.headersSent) {
      this.logger.warn(
        'Response already sent; the exception filter will NOT send another response.',
      );
      return;
    }

    try {
      if (response) {
        response.status(status).json(errorResponse);
      } else {
        this.logger.warn('No response object available in exception filter.');
      }
    } catch (sendErr) {
      this.logger.error(
        'Failed to send error response from exception filter',
        sendErr as any,
      );
    }
  }
}
