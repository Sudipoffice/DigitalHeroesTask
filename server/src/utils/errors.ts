export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return { status: error.statusCode, body: { error: error.message, details: error.details } };
  }

  if (isMongooseError(error)) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(', ');
      return { status: 400, body: { error: 'Validation failed', details: messages } };
    }
    if (error.name === 'CastError') {
      return { status: 400, body: { error: 'Invalid ID format', details: `Invalid ${error.path}: ${error.value}` } };
    }
    if ((error as any).code === 11000) {
      const key = Object.keys((error as any).keyValue || {})[0];
      return { status: 409, body: { error: 'Duplicate value', details: `${key} already exists` } };
    }
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return { status: 400, body: { error: 'Invalid JSON', details: 'Check request body format' } };
  }

  console.error('Unhandled error:', error);
  return { status: 500, body: { error: 'Internal server error' } };
}

function isMongooseError(error: unknown): error is any {
  return error !== null && typeof error === 'object' && 'name' in (error as any);
}