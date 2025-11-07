import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'object' && message && 'message' in message
          ? (message as { message: string | string[] }).message
          : typeof message === 'string'
            ? message
            : 'An error occurred',
      error:
        typeof message === 'object' && message && 'error' in message
          ? (message as { error: string }).error
          : exception instanceof HttpException
            ? exception.name
            : 'InternalServerError',
    };

    // Log errors (but not client errors like 400, 401, 404)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else if (status >= 400) {
      const messageStr = Array.isArray(errorResponse.message)
        ? errorResponse.message.join(', ')
        : errorResponse.message;
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${messageStr}`,
      );
    }

    response.status(status).send(errorResponse);
  }
}
