/**
 * An error with an HTTP status that is safe to show to the client.
 * The central error handler checks `expose` before revealing a message.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.expose = true;
  }
}
