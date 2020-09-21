import { MikroORM } from "@mikro-orm/core";
import { __prod__, COOKIE_NAME } from "./util/constants";
import { Post } from "./entities/Post";
import express from 'express';
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { validate } from "graphql";
import { PostResolver } from "./resolvers/posts";
import { UserResolver } from "./resolvers/users";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from "./util/types";
import cors from "cors"



const main = async () => {
    const orm = await MikroORM.init();
    await orm.getMigrator().up();


    const app = express();

    app.use(cors({
        origin: "http://localhost:3000",
        credentials:true
    }))

    // const RedisStore = connectRedis(session)
    // const redisClient = redis.createClient()

    // app.use(
    //     session({
    //         name:'COOKIE_NAME',
    //         store: new RedisStore({ client: redisClient, disableTouch:true }),
    //         cookie:{
    //             maxAge:1000*60*60*24*365*1,
    //             httpOnly: true, //xss
    //             sameSite: 'lax', //csrf
    //             secure: __prod__
    //         },
    //         saveUninitialized:false,
    //         secret: 'hsts5%erherhwoo2her',
    //         resave: false,
    //     }),
    // )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [ PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}):MyContext => ({ em: orm.em, req, res })
    })

    apolloServer.applyMiddleware({ app, cors:false })

    app.get('/', (req, res) => {
        res.send('hello')
    })

    app.listen(4000, () => {
        console.log("server lsitening at port 4000")
    })
    // const post = orm.em.create(Post, {title:"fuck"})
    // await orm.em.persistAndFlush(post)
}

main();