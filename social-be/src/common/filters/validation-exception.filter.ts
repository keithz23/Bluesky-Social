import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    const validationErrors = exceptionResponse.message;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: 'Validation failed',
      errors: Array.isArray(validationErrors)
        ? validationErrors
        : [validationErrors],
    });
  }
}
