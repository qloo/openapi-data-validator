"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentType = void 0;
exports.augmentAjvErrors = augmentAjvErrors;
exports.ajvErrorsToValidatorError = ajvErrorsToValidatorError;
exports.processFormStyleArrays = processFormStyleArrays;
class ContentType {
    contentType = '';
    mediaType = '';
    charSet = '';
    withoutBoundary = '';
    isWildCard;
    constructor(contentType) {
        this.contentType = contentType;
        if (this.contentType) {
            this.withoutBoundary = this.contentType
                .replace(/;\s{0,}boundary.*/, '')
                .toLowerCase();
            this.mediaType = this.withoutBoundary
                .split(';')[0]
                .toLowerCase()
                .trim();
            this.charSet = this.withoutBoundary.split(';')[1]?.toLowerCase();
            this.isWildCard = RegExp(/^[a-z]+\/\*$/).test(this.contentType);
            if (this.charSet) {
                this.charSet = this.charSet.toLowerCase().trim();
            }
        }
    }
    static fromString(contentType) {
        return new ContentType(contentType);
    }
    static from(req) {
        return new ContentType(req.headers?.['content-type']);
    }
    equivalents() {
        if (!this.withoutBoundary) {
            return [];
        }
        if (this.charSet) {
            return [this.mediaType, `${this.mediaType}; ${this.charSet}`];
        }
        return [this.withoutBoundary, `${this.mediaType}; charset=utf-8`];
    }
}
exports.ContentType = ContentType;
function augmentAjvErrors(errors = [], data) {
    errors.forEach(e => {
        if (e.keyword === 'enum') {
            const params = e.params;
            const allowedEnumValues = params?.allowedValues;
            e.message = allowedEnumValues
                ? `${e.message}: ${allowedEnumValues.join(', ')}`
                : e.message;
        }
        e.data = data;
    });
    return errors;
}
function ajvErrorsToValidatorError(errors, customErrorFn) {
    const e = errors[0];
    const params = e.params;
    const required = params?.missingProperty && `${e.instancePath}.${params.missingProperty}`;
    const additionalProperty = params?.additionalProperty && `${e.instancePath}.${params.additionalProperty}`;
    const path = required ?? additionalProperty ?? e.instancePath ?? e.schemaPath;
    const originalPath = e.instancePath ?? e.schemaPath;
    const paramNameRegex = /^\/query\/([^\/]+)/;
    const paramNameMatch = e.instancePath.match(paramNameRegex);
    let paramName = paramNameMatch ? paramNameMatch[1] : '';
    let fullMessage = `${paramName} ${e.message}`;
    if (additionalProperty) {
        fullMessage = `request${originalPath} must NOT have additional property: '${params.additionalProperty}'`;
    }
    else if (required) {
        fullMessage = `missing required property ${paramName}`;
    }
    return [{
            path,
            message: e.message,
            fullMessage
        }];
}
function processFormStyleArrays(data, parameters = []) {
    const queryParams = parameters.filter(p => p.in === 'query');
    for (const param of queryParams) {
        const name = param.name;
        const isFormStyleArray = param.style === 'form' &&
            !param.explode &&
            param.schema &&
            param.schema.type === 'array' &&
            typeof data.query[name] === 'string';
        if (isFormStyleArray && data.query[name]) {
            data.query[name] = data.query[name].split(',');
        }
    }
    return data;
}
;
//# sourceMappingURL=ValidationUtil.js.map