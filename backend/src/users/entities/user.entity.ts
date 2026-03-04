import {Entity, Column, PrimaryColumn, UpdateDateColumn, CreateDateColumn} from 'typeorm';

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

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: string;
  //todo

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
