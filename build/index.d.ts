import { OpenApiValidatorOpts, OpenApiRequest, OpenAPIV3, ValidationResult } from './lib/types';
import { AjvOptions } from './lib/ajvOptions';
export { OpenApiValidatorOpts } from './lib/types';
export declare class OpenApiValidator {
    readonly options: OpenApiValidatorOpts;
    readonly ajvOpts: AjvOptions;
    private spec?;
    constructor(options: OpenApiValidatorOpts);
    getSpec(): Promise<OpenAPIV3.Document>;
    createValidator(): (request: OpenApiRequest) => Promise<ValidationResult>;
    private loadSpec;
    private validateOptions;
    private normalizeOptions;
}
