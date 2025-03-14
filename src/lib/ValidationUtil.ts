import { ErrorObject } from 'ajv';
import { OpenAPIV3, OpenApiRequest, ValidationErrorItem } from './types';

export class ContentType {
  public readonly contentType?: string = '';
  public readonly mediaType: string = '';
  public readonly charSet: string = '';
  public readonly withoutBoundary: string = '';
  public readonly isWildCard?: boolean;

  private constructor(contentType: string | undefined) {
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

  public static fromString(contentType: string): ContentType {
    return new ContentType(contentType);
  }

  public static from(req: OpenApiRequest): ContentType {
    return new ContentType(req.headers?.['content-type']);
  }

  public equivalents(): string[] {
    if (!this.withoutBoundary) {
      return [];
    }
    if (this.charSet) {
      return [this.mediaType, `${this.mediaType}; ${this.charSet}`];
    }
    return [this.withoutBoundary, `${this.mediaType}; charset=utf-8`];
  }
}

/**
 * (side-effecting) modifies the errors object
 * @param errors
 * @param data
 */
export function augmentAjvErrors(
  errors: ErrorObject[] = [],
  data: any
): ErrorObject[] {
  errors.forEach(e => {
    if (e.keyword === 'enum') {
      const params: any = e.params;
      const allowedEnumValues = params?.allowedValues;
      e.message = allowedEnumValues
        ? `${e.message}: ${allowedEnumValues.join(', ')}`
        : e.message;
    }
    e.data = data;
  });
  return errors;
}

export function ajvErrorsToValidatorError(
  errors: ErrorObject[],
  customErrorFn?: (e: ErrorObject) => string
) {
  /* original from npm package before anyone at qloo touched it:
   *
  return errors.map(e => {
    const params: any = e.params;
    const required = params?.missingProperty && `${e.instancePath}.${params.missingProperty}`;
    const additionalProperty = params?.additionalProperty && `${e.instancePath}.${params.additionalProperty}`;
    const path = required ?? additionalProperty ?? e.instancePath ?? e.schemaPath;
    const originalPath = e.instancePath ?? e.schemaPath;

    let fullMessage = `request${path} ${e.message}`;
    if (additionalProperty) {
      fullMessage = `request${originalPath} must NOT have additional property: '${params.additionalProperty}'`;
    } else if (required) {
      fullMessage = `missing required property request${path}`;
    }
    return {
      path,
      message: e.message,
      fullMessage
    };
  }); end original
  */  

  // Hahn's version
  
  const e = errors[0];  // only handles and returns first error, potentially we will want to change this in the future
  const params: any = e.params;
  const required = params?.missingProperty && `${e.instancePath}.${params.missingProperty}`;
  const additionalProperty = params?.additionalProperty && `${e.instancePath}.${params.additionalProperty}`;
  const path = required ?? additionalProperty ?? e.instancePath ?? e.schemaPath;
  const originalPath = e.instancePath ?? e.schemaPath;

  // alter param name -- only want param name and no '/query' or the trailing number in /query/param.name/1
  // const paramNameRegex = /(?:\\|\.)?query(?:\.|\\|\[\")([\w\._-]+)(?:\"\])?/;
  // AJV 7+ changed from query["param.name"][0] to /query/param.name/0
  const paramNameRegex = /^\/query\/([^\/]+)/
  const paramNameMatch = e.instancePath.match(paramNameRegex);
  let paramName = paramNameMatch ? paramNameMatch[1] : '';

  let fullMessage = `${paramName} ${e.message}`;
  if (additionalProperty) {
    fullMessage = `request${originalPath} must NOT have additional property: '${params.additionalProperty}'`;
  } else if (required) {
    fullMessage = `missing required property ${paramName}`;
  }
  

  return [{
    path,
    message: e.message,
    fullMessage
  } as ValidationErrorItem];
}

// Pre-process form style arrays (e.g. types=type1,type2 => types=["type1", "type2"])
// Helper to split comma-separated strings for form-style arrays
export function processFormStyleArrays(data: any, parameters: OpenAPIV3.ParameterObject[] = []) {
  const queryParams = parameters.filter(p => p.in === 'query');
  
  for (const param of queryParams) {
    const name = param.name;
    const isFormStyleArray = param.style === 'form' && 
                           !param.explode && 
                           param.schema && 
                           (param.schema as OpenAPIV3.ArraySchemaObject).type === 'array' &&
                           typeof data.query[name] === 'string';
    
    if (isFormStyleArray && data.query[name]) {
      data.query[name] = data.query[name].split(',');
    }
  }
  return data;
};



/* ErrorObject.params schema depends on the `keyword` that generated the error.

maxItems, minItems, maxLength, minLength, maxProperties, minProperties, (when `items` is an array of schemas and `additionalItems` is false):
  { limit: number, [exclusive: boolean] }

additionalProperties (when `additionalProperties` is false):
  { additionalProperty: string }

dependencies:
  {
    property: string // dependent property,
    missingProperty: string // required missing dependency - only the first one is reported
    deps: string // required dependencies, comma separated list as a string (TODO change to string[])
    depsCount: number // the number of required dependencies
  }

format:
  {format: string} // keyword value

maximum, minimum, exclusiveMaximum, exclusiveMinimum::
  {
    limit: number // keyword value
    comparison: "<=" | ">=" | "<" | ">" // operation to compare the data to the limit,
    // with data on the left and the limit on the right
  }

multipleOf:
  {multipleOf: number}

pattern:
  {pattern: string}

required:
  {missingProperty: string}

propertyNames:
  {propertyName: string}

// the following are not documented on https://ajv.js.org/api.html#error-objects
// they are from my own observations

enum:
  {allowedValues: string[]}   // (allowedValues ADDED IN augmentAjvErrors )

*/
