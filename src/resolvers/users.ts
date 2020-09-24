import { Resolver, Query, Ctx, Arg, Mutation, InputType, Field, ObjectType } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "src/util/types";
import argon2 from 'argon2';
import { defaultPlaygroundOptions } from "apollo-server-express";
import { COOKIE_NAME } from "../util/constants";
import { sendEmail } from "../util/sendEmail";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string

    @Field()
    password: string
}

@InputType()
class ChangePasswordInput {
    @Field()
    id: string

    @Field()
    password: string

    @Field()
    newPassword: string

    @Field()
    newPassword2: string
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
        @Ctx() { req}: MyContext): Promise<User | undefined> {

        if (!req.session!.userUd) {
            return undefined;
        }
        const user = await User.findOne({ id: req.session!.userId });
        return user
    }

    @Query(() => [User])
    users(): Promise<User[]> {

        return User.find();
    }

    @Query(() => User, { nullable: true })
    user(
        @Arg("id", () => String) id: string): Promise<User | undefined> {

        return User.findOne( id );
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { req }: MyContext): Promise<UserResponse> {

        const user = await User.findOne({ username: options.username });
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
        @Ctx() { req }: MyContext): Promise<UserResponse> {
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
            const result = await User.createQueryBuilder('user').insert()
            .into(User)
            .values([
                { username: option.username, password: hashedPassword }, 
             ])
            .execute();
            
            user = await User.findOne(result.raw[0].id)
                
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

        // req.session!.userId = user.id
        return { user };
    }

    @Mutation(() => Boolean)
    async deleteUser(
        @Arg("id", () => String) id: string): Promise<boolean> {

        const user = await User.findOne( id );
        if (!user) {
            return false;
        }
        User.delete( id )
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

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('options') options: ChangePasswordInput,
        @Ctx() { req }: MyContext): Promise<UserResponse> {

        const user = await User.findOne(options.id);

        if (user) {
            const isValid = await argon2.verify(user.password, options.password)
            if (!isValid) return {
                errors: [{
                    field: "password", message: "incorrect password"
                }]
            }

            if(options.newPassword!=options.newPassword2){
                return {
                    errors: [{
                        field: "newPassword2", message: "new passwords do not match"
                    }]
                }
            }

            if (options.newPassword.length <= 8) {
                return {
                    errors: [{
                        field: "newPassword",
                        message: "password length must be longer than 8"
                    }]
                }
            }

            //update password
            const hashedPassword = await argon2.hash(options.newPassword)
            user.password = hashedPassword
            await User.update({id:options.id},{password:hashedPassword});

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