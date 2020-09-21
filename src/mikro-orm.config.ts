import { __prod__ } from "./util/constants";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.ts$/,
        transactional: true, // wrap each migration in a transaction
        disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
        allOrNothing: true, // wrap all migrations in master transaction
        dropTables: true, // allow to disable table dropping
        safe: false, // allow to disable table and column dropping
        emit: 'ts', // migration generation mode
    },
    entities: [Post, User],
    dbName: 'lireddish',
    type: "postgresql",
    user: 'postgres',
    password: 'Nk95nub',
    host: 'localhost',
    port: 5432,
    debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];