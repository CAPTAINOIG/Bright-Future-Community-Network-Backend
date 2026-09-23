class ResponseHandler {
  static success(res, data = null, message = 'Success', status = 200) {
    return res.status(status).json({ success: true, message, data });
  }

  static error(res, message = 'Error', status = 500, data = null) {
    return res.status(status).json({ success: false, message, status, data });
  }
  
  static created(res, data = null, message = 'Resource created successfully', status = 201) {
    return this.success(res, data, message, status);
  }
  
  static badRequest(res, message = 'Bad request', data = null, status = 400) {
    return this.error(res, message, status, data);
  }

  static unauthorized(res, message = 'Unauthorized', status = 401) {
    return this.error(res, message, status);
  }

  static forbidden(res, message = 'Forbidden', status = 403) {
    return this.error(res, message, status);
  }

  static notFound(res, message = 'Resource not found', status = 404) {
    return this.error(res, message, status);
  }

  static conflict(res, message = 'Resource already exists') {
    return this.error(res, message, 409);
  }

  static serverError(res, message = 'Internal server error', data = null) {
    return this.error(res, message, 500, data);
  }
}

module.exports = ResponseHandler;

