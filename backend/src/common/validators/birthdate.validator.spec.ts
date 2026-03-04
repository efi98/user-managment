import 'reflect-metadata';
import { validate } from 'class-validator';
import {IsNotFutureDate, MaxAge, MinAge} from "@common/validators";

class Dto {
    @IsNotFutureDate()
    birthdate?: string;

    @MinAge(18)
    min?: string;

    @MaxAge(120)
    max?: string;
}

describe('birthdate.validator', () => {
    it('allows empty values', async () => {
        const dto = new Dto();
        const res = await validate(dto);
        expect(res).toHaveLength(0);
    });

    it('rejects future date', async () => {
        const dto = new Dto();
        dto.birthdate = '2999-01-01';

        const res = await validate(dto);
        expect(res[0].constraints).toHaveProperty('isNotFutureDate');
    });

    it('min age rejects too young', async () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const tooYoung = `${yyyy - 10}-01-01`;

        const dto = new Dto();
        dto.min = tooYoung;

        const res = await validate(dto);
        expect(res[0].constraints).toHaveProperty('minAge');
    });

    it('max age rejects too old', async () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const tooOld = `${yyyy - 200}-01-01`;

        const dto = new Dto();
        dto.max = tooOld;

        const res = await validate(dto);
        expect(res[0].constraints).toHaveProperty('maxAge');
    });

    it('invalid date string passes validator by design (defer to DTO pattern)', async () => {
        const dto = new Dto();
        dto.birthdate = 'not-a-date';

        const res = await validate(dto);
        expect(res).toHaveLength(0);
    });
});