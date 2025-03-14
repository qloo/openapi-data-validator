"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParametersSchemaParser = void 0;
const types_1 = require("./types");
const ParserUtil_1 = require("./ParserUtil");
const PARAM_TYPE = {
    query: 'query',
    header: 'headers',
    path: 'path',
    cookie: 'cookies'
};
class ParametersSchemaParser {
    _ajv;
    _apiDocs;
    constructor(ajv, apiDocs) {
        this._ajv = ajv;
        this._apiDocs = apiDocs;
    }
    parse(path, parameters = []) {
        const schemas = {
            headers: {
                title: 'HTTP headers',
                type: 'object',
                properties: {},
                additionalProperties: true
            },
            path: {
                title: 'HTTP path',
                type: 'object',
                properties: {},
                additionalProperties: false
            },
            query: {
                title: 'HTTP query',
                type: 'object',
                properties: {},
                additionalProperties: false
            },
            cookies: {
                title: 'HTTP cookies',
                type: 'object',
                properties: {},
                additionalProperties: false
            }
        };
        parameters.forEach(p => {
            const parameter = (0, ParserUtil_1.dereferenceParameter)(this._apiDocs, p);
            this.validateParameterType(path, parameter);
            const reqField = PARAM_TYPE[parameter.in];
            const { name, schema } = (0, ParserUtil_1.normalizeParameter)(this._ajv, parameter);
            schemas[reqField].properties[name] = schema;
            if (reqField === 'query' && parameter.allowEmptyValue) {
                if (!schemas[reqField].allowEmptyValue) {
                    schemas[reqField].allowEmptyValue = new Set();
                }
                schemas[reqField].allowEmptyValue.add(name);
            }
            if (parameter.required) {
                if (!schemas[reqField].required) {
                    schemas[reqField].required = [];
                }
                schemas[reqField].required.push(name);
            }
        });
        return schemas;
    }
    validateParameterType(path, parameter) {
        const isKnownType = PARAM_TYPE[parameter.in];
        if (!isKnownType) {
            const message = `Parameter 'in' has incorrect value '${parameter.in}' for [${parameter.name}]`;
            throw new types_1.BadRequest({ path: path, message: message });
        }
        const hasSchema = () => {
            const contentType = parameter.content && Object.keys(parameter.content)[0];
            return !parameter.schema || !parameter.content?.[contentType]?.schema;
        };
        if (!hasSchema()) {
            const message = `No available parameter in 'schema' or 'content' for [${parameter.name}]`;
            throw new types_1.BadRequest({ path: path, message: message });
        }
    }
}
exports.ParametersSchemaParser = ParametersSchemaParser;
//# sourceMappingURL=ParametersSchemaParser.js.map