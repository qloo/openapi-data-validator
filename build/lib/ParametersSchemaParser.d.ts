import { OpenAPIV3, ParametersSchema } from './types';
import Ajv from 'ajv';
type Parameter = OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject;
export declare class ParametersSchemaParser {
    private _ajv;
    private _apiDocs;
    constructor(ajv: Ajv, apiDocs: OpenAPIV3.Document);
    parse(path: string, parameters?: Parameter[]): ParametersSchema;
    private validateParameterType;
}
export {};
