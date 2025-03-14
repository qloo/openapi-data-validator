/* eslint-disable no-underscore-dangle */
import { OpenAPIV3, ParametersSchema, OpenApiSchemaParseError } from './types';
import { dereferenceParameter, normalizeParameter } from './ParserUtil';
import Ajv from 'ajv';

const PARAM_TYPE = {
  query: 'query',
  header: 'headers',
  path: 'path',
  cookie: 'cookies'
};

type Parameter = OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject;
type SchemaType = 'headers' | 'path' | 'query' | 'cookies';
type Schemas = {
  [key in SchemaType]: {
    title: string
    type: string
    properties: Record<string, any>
    additionalProperties: boolean
    allowEmptyValue?: Set<string>
    required?: string[]
  }
}
/**
 * A class top arse incoming parameters and populate a list of request fields e.g. id and field types e.g. query
 * whose value must later be parsed as a JSON object, JSON Exploded Object, JSON Array, or JSON Exploded Array
 */
export class ParametersSchemaParser {
  private _ajv: Ajv;
  private _apiDocs: OpenAPIV3.Document;

  constructor(ajv: Ajv, apiDocs: OpenAPIV3.Document) {
    this._ajv = ajv;
    this._apiDocs = apiDocs;
  }

  /**
   * Parse incoming parameters and populate a list of request fields e.g. id and field types e.g. query
   * whose value must later be parsed as a JSON object, JSON Exploded Object, JSON Array, or JSON Exploded Array
   * @param path
   * @param parameters
   */
  public parse(path: string, parameters: Parameter[] = []): ParametersSchema {
    const schemas: Schemas = {
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
      const parameter = dereferenceParameter(this._apiDocs, p);

      this.validateParameterType(path, parameter);

      const reqField = PARAM_TYPE[parameter.in as keyof typeof PARAM_TYPE] as SchemaType;
      const { name, schema } = normalizeParameter(this._ajv, parameter);

      schemas[reqField as keyof typeof schemas].properties[name] = schema;
      if (reqField === 'query' && parameter.allowEmptyValue) {
        if (!schemas[reqField].allowEmptyValue) {
          schemas[reqField].allowEmptyValue = new Set<string>();
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

  private validateParameterType(
    path: string,
    parameter: OpenAPIV3.ParameterObject
  ): void {
    const isKnownType = PARAM_TYPE[parameter.in as keyof typeof PARAM_TYPE];
    if (!isKnownType) {
      const message = `Parameter 'in' has incorrect value '${parameter.in}' for [${parameter.name}]`;
      throw new OpenApiSchemaParseError({ path: path, message: message });
    }

    const hasSchema = () => {
      const contentType
        = parameter.content && Object.keys(parameter.content)[0];
      return !parameter.schema || !parameter.content?.[contentType as string]?.schema;
    };

    if (!hasSchema()) {
      const message = `No available parameter in 'schema' or 'content' for [${parameter.name}]`;
      throw new OpenApiSchemaParseError({ path: path, message: message });
    }
  }
}
