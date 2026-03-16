import {Entity, Column, PrimaryColumn, UpdateDateColumn, CreateDateColumn} from 'typeorm';

/**
 * User entity stored in the database.
 */
@Entity('users')
export class User {
  @PrimaryColumn()
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ type: 'date', nullable: true })
  birthdate: string;

  @Column({ nullable: true })
  profilePhoto: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
      this.displayName ??= this.username;
      this.isAdmin ??= false;
    }
  }
}
