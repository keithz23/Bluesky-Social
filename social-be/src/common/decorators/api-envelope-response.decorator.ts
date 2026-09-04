import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

type EnvelopeResponseOptions = {
  status?: number;
  description?: string;
};

const envelopeSchema = (dataSchema: Record<string, unknown>) => ({
  type: 'object',
  required: ['statusCode', 'message', 'data', 'timestamp'],
  properties: {
    statusCode: { type: 'number' },
    message: { type: 'string' },
    data: dataSchema,
    timestamp: { type: 'string', format: 'date-time' },
  },
});

/** Documents the response envelope added by TransformInterceptor. */
export const ApiEnvelopeResponse = <TModel extends Type<unknown>>(
  model: TModel,
  options: EnvelopeResponseOptions = {},
) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description,
      schema: envelopeSchema({ $ref: getSchemaPath(model) }),
    }),
  );

/** Documents an enveloped response whose data has multiple valid shapes. */
export const ApiEnvelopeOneOfResponse = (
  models: Type<unknown>[],
  options: EnvelopeResponseOptions = {},
) =>
  applyDecorators(
    ApiExtraModels(...models),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description,
      schema: envelopeSchema({
        oneOf: models.map((model) => ({ $ref: getSchemaPath(model) })),
      }),
    }),
  );
