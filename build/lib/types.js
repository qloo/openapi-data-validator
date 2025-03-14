"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApiSchemaParseError = exports.OpenApiValidationError = exports.SchemaNotFoundError = exports.BadRequest = exports.SerDesSingleton = void 0;
class SerDesSingleton {
    serializer;
    deserializer;
    format;
    serialize;
    deserialize;
    constructor(param) {
        this.format = param.format;
        this.serialize = param.serialize;
        this.deserialize = param.deserialize;
        this.deserializer = {
            format: param.format,
            deserialize: param.deserialize
        };
        this.serializer = {
            format: param.format,
            serialize: param.serialize
        };
    }
}
exports.SerDesSingleton = SerDesSingleton;
class BadRequest extends Error {
    status = 400;
    path;
    name = 'Bad Request';
    message;
    headers;
    errors;
    constructor(err) {
        super('Bad Request');
        this.path = err.path;
        this.message = err.message || 'Bad Request';
        this.errors = err.errors || [];
    }
}
exports.BadRequest = BadRequest;
class SchemaNotFoundError extends Error {
    status = 404;
    name = 'Schema Not Found';
    message;
    path;
    method;
    constructor(err) {
        super('Schema Not Found');
        this.path = err.path;
        this.method = err.method;
        this.message = `no schema found for ${err.method} ${err.path}`;
    }
}
exports.SchemaNotFoundError = SchemaNotFoundError;
class OpenApiValidationError extends Error {
    path;
    errors;
    constructor(err) {
        super('Request failed OpenAPI validation');
        this.path = err.path;
        this.message = err.message || 'Request failed OpenAPI validation';
        this.errors = err.errors || [];
    }
}
exports.OpenApiValidationError = OpenApiValidationError;
class OpenApiSchemaParseError extends Error {
    path;
    constructor(err) {
        super('Failed to parse OpenAPI schema');
        this.path = err.path;
        this.message = err.message || 'Failed to parse OpenAPI schema';
    }
}
exports.OpenApiSchemaParseError = OpenApiSchemaParseError;
//# sourceMappingURL=types.js.map