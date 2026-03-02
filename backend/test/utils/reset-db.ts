import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

export async function resetDb(app: INestApplication): Promise<void> {
    const ds = app.get(DataSource);
    await ds.synchronize(true);
}