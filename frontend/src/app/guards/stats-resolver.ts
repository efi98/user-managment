import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { UserService } from '../services/user.service';

export const statsResolver: ResolveFn<any> = () => {
  const userService = inject(UserService);
  return userService.getStats();
};

