import { ERR_INVALID_PARAM } from "./error-messages";
import { RequestError } from "./RequestError";

export function sanitizeNumber(param: string): number {
    const num = parseInt(param);
    if (isNaN(num)) {
      throw new RequestError(ERR_INVALID_PARAM, 400);
    }
    return num;
}

export function sanitizeString(param: string): string {
    if (!param || param.length === 0) {
      throw new RequestError(ERR_INVALID_PARAM, 400);
    }
    return param;
}