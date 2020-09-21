import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import uuid from "uuid"


//Field is for gql, comment out to disable field from query
@ObjectType()
@Entity()
export class User {
  @Field(()=> uuid)
  @PrimaryKey()
  id!: string;
  
  @Field(()=>String)
  @Property({type: 'text',unique:true})
  username!: string;
  
  @Property({type: 'text'})
  password!: string;
  
  @Field(()=>String)
  @Property({type:'date'})
  createdAt = new Date();

  @Field(()=>String)
  @Property({ type:'date', onUpdate: () => new Date() })
  updatedAt = new Date();


}