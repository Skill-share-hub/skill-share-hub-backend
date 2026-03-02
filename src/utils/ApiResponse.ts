export class ApiResponse<T> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T|undefined;

  constructor(message: string, data?: T, success = true) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}