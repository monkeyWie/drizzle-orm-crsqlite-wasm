import { DefaultLogger } from "drizzle-orm/logger";
import { createTableRelationsHelpers, extractTablesRelationalConfig, } from "drizzle-orm/relations";
import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { SQLiteAsyncDialect } from "drizzle-orm/sqlite-core";
import { CRSQLiteSession } from "./session.js";
export function drizzle(client, config) {
    const dialect = new SQLiteAsyncDialect({ casing: config?.casing });
    let logger;
    if (config?.logger === true) {
        logger = new DefaultLogger();
    }
    else if (config?.logger !== false) {
        logger = config?.logger;
    }
    let schema;
    if (config?.schema) {
        const tablesConfig = extractTablesRelationalConfig(config.schema, createTableRelationsHelpers);
        schema = {
            fullSchema: config.schema,
            schema: tablesConfig.tables,
            tableNamesMap: tablesConfig.tableNamesMap,
        };
    }
    const session = new CRSQLiteSession(client, dialect, schema, { logger });
    return new BaseSQLiteDatabase("async", dialect, session, schema);
}
