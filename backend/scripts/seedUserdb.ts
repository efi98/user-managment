import { DataSource } from 'typeorm';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { User } from '@src/users';

// Ensure we target the persistent userdb (not the test DB)
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'assets', 'userdb.sqlite');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [User],
});

async function seed() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  const examplePath = path.join(__dirname, '..', 'assets', 'example.json');
  const data = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

  try {
    await AppDataSource.initialize();
    console.log('Connected to DB:', AppDataSource.options.database);
    const repo = AppDataSource.getRepository(User);

    // Clear existing users in userdb
    await repo.clear();

    // Map input to plain DB-friendly objects
    const toSave = data.map((u: any) => ({
      username: u.username,
      password: u.password,
      displayName: u.displayName ?? u.username,
      age: u.age ?? null,
      gender: u.gender ?? null,
      isAdmin: !!u.isAdmin,
      avatar: u.avatar ?? null,
      createdAt: u.createdAt ?? new Date().toISOString(),
      updatedAt: u.updatedAt ?? new Date().toISOString(),
    }));

    await repo.save(toSave);

    const count = await repo.count();
    console.log(`Inserted ${count} users into ${AppDataSource.options.database}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    try {
      await AppDataSource.destroy();
    } catch (e) {}
    process.exit(1);
  }
}

seed();
