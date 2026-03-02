import {Test} from '@nestjs/testing';
import {AppController} from './app.controller';
import {CONSTS} from '@consts';

describe('AppController', () => {
    let controller: AppController;

    beforeEach(async () => {
        const mod = await Test.createTestingModule({
            controllers: [AppController],
        }).compile();

        controller = mod.get(AppController);
    });

    it('GET / returns welcome message', () => {
        expect(controller.getRoot()).toBe(CONSTS.WELCOME_MESSAGE);
    });

    it('GET /health returns ok', () => {
        expect(controller.getHealth()).toEqual({status: 'ok'});
    });
});