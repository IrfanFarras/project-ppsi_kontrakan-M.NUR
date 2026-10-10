/**
 * Error terkontrol untuk kondisi yang sengaja ditangani aplikasi
 * (mis. 404 Not Found, 400 Bad Request), berbeda dari error tak terduga.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
