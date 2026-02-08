import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn()
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ type: 'integer', nullable: true })
  age: number;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column()
  createdAt: string;

  @Column()
  updatedAt: string;

  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
      this.displayName = this.displayName ?? this.username;
      this.isAdmin = this.isAdmin ?? false;
      this.createdAt = this.createdAt ?? new Date().toISOString();
      this.updatedAt = this.updatedAt ?? new Date().toISOString();
    }
  }
}
