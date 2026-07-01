import { ApiError } from './errors.js';

/**
 * Parse `data` with a Zod schema, throwing a 400 ApiError with a readable
 * message if validation fails. Returns the parsed (and coerced) value.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join('; ');
    throw new ApiError(400, message);
  }
  return result.data;
}
