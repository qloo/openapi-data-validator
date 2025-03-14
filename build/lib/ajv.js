"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestAjv = createRequestAjv;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const ajv_errors_1 = __importDefault(require("ajv-errors"));
function createRequestAjv(openApiSpec, options = {}) {
    const ajvOpts = {
        strictTypes: false,
        discriminator: true,
        allErrors: true,
        coerceTypes: 'array',
        useDefaults: true,
        ...options,
        logger: {
            log(...args) { console.log(...args); },
            warn(...args) {
                if (!args[0]?.match('jsPropertySyntax')) {
                    console.warn(...args);
                }
            },
            error(...args) { console.error(...args); }
        }
    };
    const ajv = new ajv_1.default(ajvOpts);
    (0, ajv_errors_1.default)(ajv);
    (0, ajv_formats_1.default)(ajv);
    ajv.removeKeyword('propertyNames');
    ajv.removeKeyword('contains');
    ajv.removeKeyword('const');
    ajv.addKeyword({ keyword: 'paths' });
    ajv.addKeyword({ keyword: 'components' });
    ajv.addKeyword({ keyword: 'example' });
    if (openApiSpec.components?.schemas) {
        Object.entries(openApiSpec.components.schemas).forEach(([id, schema]) => {
            ajv.addSchema(schema, `#/components/schemas/${id}`);
        });
    }
    return ajv;
}
//# sourceMappingURL=ajv.js.map