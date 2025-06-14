import { ApiResponseOptions } from '@nestjs/swagger';
import { ErrorResponse } from '../dto/all.dtos';

export const _errors = (
  errorCodeObject: ErrorResponse[],
): ApiResponseOptions => {
  let descriptionString = 'Error codes: ';

  errorCodeObject.map((item) => {
    descriptionString += `${item.code} , `;
  });

  return { description: descriptionString };
};
