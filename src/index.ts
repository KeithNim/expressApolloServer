import { __prod__, COOKIE_NAME, PORT } from "./util/constants";
import express from 'express';
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { validate } from "graphql";
import { UserResolver } from "./resolvers/users";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from "./util/types";
import cors from "cors"
import { createConnection } from "typeorm";
import { User } from "./entities/User";



const main = async () => {
    try {
        __prod__ ? await createConnection() : await createConnection({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'Nk95nub',
          database: 'iob-test',
          entities: [User],
          synchronize:true,
          logging: true,
        })
    
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
            resolvers: [ UserResolver],
            validate: false
        }),
        context: ({req, res}):MyContext => ({ req, res })
    })

    apolloServer.applyMiddleware({ app, cors:false })

    app.get('/', (req, res) => {
        res.send('hello')
    })
    
        app.listen(PORT, () => console.log(`App running on port ${PORT}`))
      } catch (e) {
        console.error(e)
        process.exit()
      }
}

main();