"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApiValidator = void 0;
const RequestValidator_1 = require("./lib/RequestValidator");
const BaseSerdes_1 = require("./lib/BaseSerdes");
const ajvOptions_1 = require("./lib/ajvOptions");
class OpenApiValidator {
    options;
    ajvOpts;
    spec;
    constructor(options) {
        this.validateOptions(options);
        this.normalizeOptions(options);
        if (!options.validateRequests && options.validateRequests !== false) {
            options.validateRequests = true;
        }
        if (options.validateRequests === true) {
            options.validateRequests = {
                allowUnknownQueryParameters: false
            };
        }
        this.options = options;
        this.ajvOpts = new ajvOptions_1.AjvOptions(options);
    }
    async getSpec() {
        if (!this.spec) {
            this.spec = await this.loadSpec(this.options.apiSpec);
        }
        return this.spec;
    }
    createValidator() {
        let requestValidator;
        return async (request) => {
            if (!requestValidator) {
                const spec = await this.getSpec();
                requestValidator = new RequestValidator_1.RequestValidator(spec, this.ajvOpts.request, this.options.customErrorFn);
            }
            const result = requestValidator.validate(request);
            return result;
        };
    }
    async loadSpec(schemaOrPath) {
        if (typeof schemaOrPath === 'string') {
            const origCwd = process.cwd();
            const path = require('path');
            const absolutePath = path.resolve(origCwd, schemaOrPath);
            const { access } = require('fs').promises;
            await access(absolutePath);
            const $RefParser = require('@apidevtools/json-schema-ref-parser');
            return Object.assign($RefParser.dereference(absolutePath));
        }
        const cloneDeep = require('lodash.clonedeep');
        const dereference = require('@apidevtools/json-schema-ref-parser/lib/dereference');
        const $Refs = require('@apidevtools/json-schema-ref-parser/lib/refs');
        const handler = { schema: null, $refs: new $Refs() };
        const $ref = handler.$refs._add('');
        $ref.value = cloneDeep(await schemaOrPath);
        $ref.pathType = 'http';
        handler.schema = $ref.value;
        dereference(handler, { parse: {}, dereference: { excludedPathMatcher: () => false } });
        return Object.assign(handler.schema);
    }
    validateOptions(options) {
        if (!options.apiSpec && !options.compiledFilePath) {
            throw Error('apiSpec required');
        }
    }
    normalizeOptions(options) {
        if (!options.serDes) {
            options.serDes = BaseSerdes_1.defaultSerDes;
        }
        else {
            BaseSerdes_1.defaultSerDes.forEach(currentDefaultSerDes => {
                const defaultSerDesOverride = options.serDes.find(currentOptionSerDes => {
                    return currentDefaultSerDes.format === currentOptionSerDes.format;
                });
                if (!defaultSerDesOverride) {
                    options.serDes.push(currentDefaultSerDes);
                }
            });
        }
    }
}
exports.OpenApiValidator = OpenApiValidator;
//# sourceMappingURL=index.js.map