import swagger2 from './swagger-2';
export default function (spec, options) {
    const swagger = (options && options.swagger) || 2;
    if (swagger !== 2) {
        throw new Error(`Swagger version ${swagger} is not supported`);
    }
    return swagger2(spec, options);
}
//# sourceMappingURL=index.js.map