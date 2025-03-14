import { ErrorObject } from 'ajv';
import { OpenAPIV3, OpenApiRequest, RequestValidatorOptions, ValidationResult } from './types';
export declare class RequestValidator {
    private validatorCache;
    private apiDoc;
    private requestOpts;
    private options;
    private validationModule;
    private ajv;
    private customErrorFn?;
    constructor(apiDoc: OpenAPIV3.Document, options?: RequestValidatorOptions, customErrorFn?: (e: ErrorObject) => string);
    validate(req: OpenApiRequest): ValidationResult;
    private buildValidator;
}
