/**
 * Validators related to birthdate fields used by DTOs.
 *
 * Exports decorator factories: IsNotFutureDate, MinAge, MaxAge.
 */

import {registerDecorator, ValidationArguments, ValidationOptions} from "class-validator";
import {ageFromBirthdate, API_RESPONSES} from "@src/common";

// Checks if the given birthdate is not in the future
export function IsNotFutureDate(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string | Date) {
          if (!value) return true;

          const now = new Date();
          const birth = value instanceof Date ? value : new Date(value);

          if (Number.isNaN(birth.getTime())) return true;

          const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
          );

          const birthDateOnly = new Date(
              birth.getFullYear(),
              birth.getMonth(),
              birth.getDate(),
          );

          return birthDateOnly.getTime() <= today.getTime();
        },
        defaultMessage: () => API_RESPONSES.BIRTHDAY_NOT_IN_FUTURE,
      },
    });
  };
}

// Ensures computed age from birthdate is greater than or equal to `min`
export function MinAge(min: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'minAge',
      target: object.constructor,
      propertyName,
      constraints: [min],
      options: validationOptions,
      validator: {
        validate(value: string | Date, args: ValidationArguments) {
          if (!value) return true;

          const age = ageFromBirthdate(value);
          if (age === null) return true;
          return age >= args.constraints[0];
        },
        defaultMessage: (args) =>
            API_RESPONSES.BIRTHDAY_MIN_AGE(args.constraints[0]),
      },
    });
  };
}

// Ensures computed age from birthdate is less than or equal to `max`
export function MaxAge(max: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxAge',
      target: object.constructor,
      propertyName,
      constraints: [max],
      options: validationOptions,
      validator: {
        validate(value: string | Date, args: ValidationArguments) {
          if (!value) return true;

          const age = ageFromBirthdate(value);
          if (age === null) return true;

          return age <= args.constraints[0];
        },
        defaultMessage: (args) =>
            API_RESPONSES.BIRTHDAY_MAX_AGE(args.constraints[0]),
      },
    });
  };
}