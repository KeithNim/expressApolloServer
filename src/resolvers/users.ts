import { Resolver, Query, Ctx, Arg, Int, Mutation, InputType, Field, ObjectType } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "src/util/types";
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';
import { defaultPlaygroundOptions } from "apollo-server-express";
import { COOKIE_NAME } from "../util/constants";
import { sendEmail } from "src/util/sendEmail";
import { v4 as uuidv4 } from 'uuid'

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string

    @Field()
    password: string
}

class ChangePasswordInput {
    @Field()
    id: string

    @Field()
    password: string

    @Field()
    newPassword: string
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}

@ObjectType()
class FieldError {
    @Field(() => String)
    field: String

    @Field(() => String)
    message: String
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req, em }: MyContext): Promise<User | null> {

        if (!req.session!.userUd) {
            return null;
        }
        const user = await em.findOne(User, { id: req.session!.userId });
        return user
    }

    @Query(() => [User])
    users(
        @Ctx() { em }: MyContext): Promise<User[]> {

        return em.find(User, {});
    }

    @Query(() => User, { nullable: true })
    user(
        @Arg("id", () => Int) id: string,
        @Ctx() { em }: MyContext): Promise<User | null> {

        return em.findOne(User, { id });
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext): Promise<UserResponse> {

        const user = await em.findOne(User, { username: options.username });
        if (!user) {
            return {
                errors: [{
                    field: "username", message: "username does not exist"
                }]
            }
        }
        else {
            const isValid = await argon2.verify(user.password, options.password)
            if (!isValid) return {
                errors: [{
                    field: "password", message: "incorrect password"
                }]
            }

            req.session!.userId = user.id
            return { user }
        }
    }


    @Mutation(() => UserResponse)
    async createUser(
        @Arg('options') option: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext): Promise<UserResponse> {
        if (option.username.length <= 0) {
            return {
                errors: [{
                    field: "username",
                    message: "username must not be empty"
                }]
            }
        }
        if (option.password.length <= 8) {
            return {
                errors: [{
                    field: "password",
                    message: "password length must be longer than 8"
                }]
            }
        }
        const hashedPassword = await argon2.hash(option.password)
        let user

        try {
            const result = await (em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    id: uuidv4(),
                    username: option.username,
                    password: hashedPassword,
                    created_at: new Date(),
                    updated_at: new Date(),
                }).returning("*");

            user = result[0];
        }
        catch (err) {
            console.log(err)
            if (err.detail.includes("already exists")) {
                return {
                    errors: [{
                        field: "username",
                        message: "username already taken"
                    }]
                }
            }
        }

        req.session!.userId = user.id
        return { user };
    }

    @Mutation(() => Boolean)
    async deleteUser(
        @Arg("id", () => Int) id: string,
        @Ctx() { em }: MyContext): Promise<boolean> {

        const user = await em.findOne(User, { id });
        if (!user) {
            return false;
        }
        em.remove(User, { id })
        return true
    }

    @Mutation(() => Boolean)
    logout(
        @Ctx() { req, res }: MyContext) {

        return new Promise(resolve => {

            if (!req.session)
                resolve(false)

            req.session?.destroy(err => {
                res.clearCookie(COOKIE_NAME)
                if (err) {
                    console.log(err)
                    resolve(false)
                }
                else {
                    resolve(true)
                }
            })

        })
    }

    @Mutation(() => Boolean)
    async changePassword(
        @Arg("id", () => String) id: string,
        @Ctx() { em }: MyContext): Promise<boolean> {

        const user = await em.findOne(User, { id });
        if (!user) {
            return false;
        }

        await sendEmail().catch(err => {
            console.log(err)
            return false
        })

        return true

    }

    @Mutation(() => UserResponse)
    async ChangePasswordInput(
        @Arg('options') options: ChangePasswordInput,
        @Ctx() { em, req }: MyContext): Promise<UserResponse> {

        const user = await em.findOne(User, { id: options.id });

        if (user) {
            const isValid = await argon2.verify(user.password, options.password)
            if (!isValid) return {
                errors: [{
                    field: "password", message: "incorrect password"
                }]
            }

            //update password
            user.password = options.password
            await em.persistAndFlush(user);

            return {user:user}
        } else{
            return {
                errors: [{
                    field: "username", message: "user not found"
                }]
            }
        }
    }
}