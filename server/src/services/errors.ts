export class DomainError extends Error {
  public title: string;
  public status: number;
  public detail: string;

  constructor(
    titleOrMessage: string,
    statusCode: number = 400,
    detailOrErrorType: string = "",
    public details?: Record<string, unknown>,
  ) {
    super(detailOrErrorType || titleOrMessage);
    this.name = this.constructor.name;
    this.title = titleOrMessage;
    this.status = statusCode;
    this.detail = detailOrErrorType || titleOrMessage;
  }

  get statusCode(): number {
    return this.status;
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = "Authentication required") {
    super("Authentication Required", 401, message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Access denied: insufficient permissions or scope") {
    super("Forbidden", 403, message);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Resource not found") {
    super("Not Found", 404, message);
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Resource conflict") {
    super("Conflict", 409, message);
  }
}

export class ValidationError extends DomainError {
  constructor(
    message = "Invalid input parameters",
    public invalidParams?: Array<{ name: string; reason: string }>,
  ) {
    super("Validation Error", 400, message, { invalidParams });
  }
}

export class AccountLockedError extends DomainError {
  constructor(
    message = "Account temporarily locked due to multiple failed login attempts. Please try again later.",
    public retryAfterSeconds = 900,
  ) {
    super("Account Locked", 429, message, { retryAfterSeconds });
  }
}
