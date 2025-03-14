"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AjvOptions = void 0;
class AjvOptions {
    options;
    constructor(options) {
        this.options = options;
    }
    get preprocessor() {
        return this.baseOptions();
    }
    get request() {
        const { allowUnknownQueryParameters, removeAdditional } = this.options.validateRequests;
        return {
            ...this.baseOptions(),
            allowUnknownQueryParameters,
            removeAdditional
        };
    }
    baseOptions() {
        return {
            validateSchema: false,
            useDefaults: true,
            removeAdditional: false,
            validateFormats: false,
        };
    }
}
exports.AjvOptions = AjvOptions;
//# sourceMappingURL=ajvOptions.js.map