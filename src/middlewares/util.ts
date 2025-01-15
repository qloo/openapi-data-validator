import { ErrorObject } from 'ajv';
import { OpenApiRequest, ValidationErrorItem } from '../framework/types';

export class ContentType {
  public readonly contentType: string = null;
  public readonly mediaType: string = null;
  public readonly charSet: string = null;
  public readonly withoutBoundary: string = null;
  public readonly isWildCard: boolean;

  private constructor(contentType: string | null) {
    this.contentType = contentType;
    if (contentType) {
      this.withoutBoundary = contentType
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
 */
export function augmentAjvErrors(
  errors: ErrorObject[] = []
): ErrorObject[] {
  errors.forEach(e => {
    if (e.keyword === 'enum') {
      const params: any = e.params;
      const allowedEnumValues = params?.allowedValues;
      e.message = allowedEnumValues
        ? `${e.message}: ${allowedEnumValues.join(', ')}`
        : e.message;
    }
  });
  return errors;
}

function getCustomErrorMessage(e: ErrorObject): string {
  let message: string;

  switch (true) {
    case e.message.includes('must match pattern "^(-?\\d+(\\.\\d+)?),(-?\\d+(\\.\\d+)?)$"'):
      message = 'invalid. Location must be in the form lat,lon (e.g. 40.726408,-73.994275)';
      break;

    case e.message.includes('must match pattern "^external\\.\\w+$"'):
      message = 'must be a valid external source';
      break;

    // minimum case for page/take (ex: limit=1)
    case e.keyword === 'minimum'
    && e.params.limit === 1
    && (e.instancePath.includes('.query.take') || e.instancePath.includes('.query.page')):
      message = 'must be a positive integer';
      break;

    // maximum case for take (ex:limit=200)
    case e.keyword === 'maximum'
    && e.params.limit === 200
    && e.instancePath.includes('.query.take'):
      message = 'cannot exceed 1000';
      break;

    default:
      message = e.message;
      break;
  }

  return message;
}

export function ajvErrorsToValidatorError(
  errors: ErrorObject[]
): ValidationErrorItem[] {
  return errors.map(e => {
    const params: any = e.params;
    const required
      = params?.missingProperty
      && `${e.instancePath}.${params.missingProperty}`;
    const additionalProperty
      = params?.additionalProperty
      && `${e.instancePath}.${params.additionalProperty}`;

    const path = required
      ? required
      : additionalProperty
        ? additionalProperty
        : e.instancePath
          ? e.instancePath
          : e.schemaPath;

    const paramNameMatch = e.instancePath.match(/\.query\["(.+?)"\]/);
    let paramName = paramNameMatch ? paramNameMatch[1] : '';

    if (!paramName) {
      paramName = e.instancePath.split('.').slice(2).join('.');
    }

    const originalPath = e.instancePath ?? e.schemaPath;
    let fullMessage = '';

    if (additionalProperty) {
      fullMessage = `request${originalPath} must NOT have additional property: '${params.additionalProperty}'`;
    } else if (required) {
      fullMessage = `missing required property request${path}`;
    } else {
      const customMessage = getCustomErrorMessage(e);
      fullMessage = `${paramName} ${customMessage}`;
    }

    return {
      path,
      message: e.message,
      fullMessage
    };
  });
}
