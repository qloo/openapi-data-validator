"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaNotFoundError = exports.BadRequest = exports.SerDesSingleton = void 0;
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
//# sourceMappingURL=types.js.map