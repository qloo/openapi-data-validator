"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestValidator = void 0;
const ParametersSchemaParser_1 = require("./ParametersSchemaParser");
const BodySchemaParser_1 = require("./BodySchemaParser");
const ajv_1 = require("./ajv");
const ValidationUtil_1 = require("./ValidationUtil");
const types_1 = require("./types");
function getSchemaGeneral(validationId, parameters, body) {
    const isBodyBinary = body?.format === 'binary';
    const bodyProps = !isBodyBinary && body || {};
    const bodySchema = {
        $id: validationId,
        required: ['query', 'headers', 'path'],
        properties: {
            body: bodyProps,
            ...parameters
        }
    };
    const requireBody = body.required && !isBodyBinary;
    if (requireBody) {
        bodySchema.required.push('body');
    }
    return bodySchema;
}
class RequestValidator {
    validatorCache = {};
    apiDoc;
    requestOpts = {};
    options;
    validationModule = {};
    ajv;
    customErrorFn;
    constructor(apiDoc, options = {}, customErrorFn) {
        this.validatorCache = {};
        this.apiDoc = apiDoc;
        this.requestOpts.allowUnknownQueryParameters = options.allowUnknownQueryParameters;
        this.options = options;
        this.customErrorFn = customErrorFn;
        this.ajv = (0, ajv_1.createRequestAjv)(this.apiDoc, {
            ...this.options,
            addUsedSchema: true,
            schemas: [this.apiDoc]
        });
    }
    validate(req) {
        const route = req.route;
        const contentType = ValidationUtil_1.ContentType.from(req);
        const contentTypeKey = contentType.equivalents()[0] ?? 'not_provided';
        const key = `${req.method || req.httpMethod}-${route}-${contentTypeKey}`.toLocaleLowerCase();
        if (!this.validatorCache[key]) {
            if (!(req.method || req.httpMethod)) {
                throw new Error('Request method is required');
            }
            this.validatorCache[key] = this.buildValidator(key, route, (req.method || req.httpMethod), contentType);
        }
        return this.validatorCache[key](req);
    }
    buildValidator(validationId, path, method, contentType) {
        const reqSchema = this.apiDoc && this.apiDoc.paths[path] &&
            this.apiDoc.paths[path][method.toLowerCase()];
        if (!reqSchema) {
            throw new types_1.SchemaNotFoundError({ method, path });
        }
        const schemaParser = new ParametersSchemaParser_1.ParametersSchemaParser(this.ajv, this.apiDoc);
        const parameters = schemaParser.parse(path, reqSchema.parameters);
        const body = new BodySchemaParser_1.BodySchemaParser().parse(path, reqSchema, contentType);
        const schemaGeneral = getSchemaGeneral(validationId, parameters, body);
        const validator = this.ajv.compile(schemaGeneral);
        return (req) => {
            let data = {
                query: req.query ?? req.queryStringParameters ?? {},
                headers: req.headers ?? {},
                path: req.path ?? req.pathParameters ?? {},
                cookies: req.cookies ?? {},
                body: req.body
            };
            data = (0, ValidationUtil_1.processFormStyleArrays)(data, reqSchema.parameters);
            const valid = validator(data);
            const requestData = data;
            if (valid) {
                return {
                    valid: true,
                    ...requestData,
                };
            }
            const errors = (0, ValidationUtil_1.augmentAjvErrors)(validator.errors ?? [], data);
            const formattedErrors = (0, ValidationUtil_1.ajvErrorsToValidatorError)(errors, this.customErrorFn);
            const message = formattedErrors.map(m => m.fullMessage).join(', ');
            const error = new types_1.BadRequest({
                path: req.route,
                message,
            });
            error.errors = formattedErrors;
            throw error;
        };
    }
}
exports.RequestValidator = RequestValidator;
//# sourceMappingURL=RequestValidator.js.map