import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: unknown;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const isObject = data && typeof data === 'object';
        const isPaginated =
          isObject &&
          'data' in data &&
          'meta' in data &&
          Array.isArray(data.data);

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: data?.message || 'Success',
          data: data?.data || data,
          ...(isPaginated && { meta: data.meta }),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
