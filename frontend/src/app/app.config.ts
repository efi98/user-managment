import {
    APP_INITIALIZER,
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthService } from "./services/auth.service";
import { firstValueFrom } from "rxjs";
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: APP_INITIALIZER,
            useFactory: (auth: AuthService) => {
                return async () => {
                    await firstValueFrom(auth.initUserSession$());
                };
            },
            deps: [AuthService],
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ]
};
