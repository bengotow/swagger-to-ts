import { Swagger2, Swagger2Options } from './swagger-2';
export interface Options extends Swagger2Options {
    swagger?: number;
}
export default function (spec: Swagger2, options?: Options): string;
