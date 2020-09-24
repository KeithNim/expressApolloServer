import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { ObjectType, Field } from "type-graphql";


//Field is for gql, comment out to disable field from query
@ObjectType()
@Entity()
export class User extends BaseEntity{
  constructor(user?: User) {
    super()
    Object.assign(this, user)
  }

  @Field(()=> String)
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  
  @Field(()=>String)
  @Column({type: 'text',unique:true})
  username!: string;
  
  @Column({type: 'text'})
  password!: string;
  
  @Field(()=>String)
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date | string

  @Field(()=>String)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date | string
}