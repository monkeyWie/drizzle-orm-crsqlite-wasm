import { entityKind } from "drizzle-orm/entity";
import type { Logger } from "drizzle-orm/logger";
import type { RelationalSchemaConfig, TablesRelationalConfig } from "drizzle-orm/relations";
import { type Query } from "drizzle-orm/sql/sql";
import type { SQLiteAsyncDialect } from "drizzle-orm/sqlite-core/dialect";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import type { SelectedFieldsOrdered } from "drizzle-orm/sqlite-core/query-builders/select.types";
import type { PreparedQueryConfig, SQLiteExecuteMethod } from "drizzle-orm/sqlite-core/session";
import { SQLitePreparedQuery, SQLiteSession } from "drizzle-orm/sqlite-core/session";
import type { DBAsync, StmtAsync, TXAsync } from "@vlcn.io/xplat-api";
interface CRSQLiteSessionOptions {
    logger?: Logger;
}
type HeldStatementFinalization = {
    stmt: Promise<StmtAsync>;
    tx: TXAsync | null;
};
export declare class CRSQLiteSession<TFullSchema extends Record<string, unknown>, TSchema extends TablesRelationalConfig> extends SQLiteSession<"async", void, TFullSchema, TSchema> {
    client: DBAsync;
    private dialect;
    private schema;
    private options;
    private tx?;
    static readonly [entityKind]: string;
    private logger;
    private registry;
    constructor(client: DBAsync, dialect: SQLiteAsyncDialect, schema: RelationalSchemaConfig<TSchema> | undefined, options: CRSQLiteSessionOptions, tx?: TXAsync | undefined);
    prepareQuery<T extends PreparedQueryConfig>(query: Query, fields: SelectedFieldsOrdered | undefined, executeMethod: SQLiteExecuteMethod, _isResponseInArrayMode: boolean, customResultMapper?: (rows: unknown[][]) => unknown): CRSQLitePreparedQuery<T>;
    prepareOneTimeQuery(query: Query, fields: SelectedFieldsOrdered | undefined, executeMethod: SQLiteExecuteMethod, _isResponseInArrayMode: boolean): SQLitePreparedQuery<PreparedQueryConfig & {
        type: "async";
    }>;
    transaction<T>(transaction: (db: CRSQLiteTransaction<TFullSchema, TSchema>) => Promise<T>): Promise<T>;
    exec(query: string): Promise<void>;
}
export declare class CRSQLitePreparedQuery<T extends PreparedQueryConfig = PreparedQueryConfig> extends SQLitePreparedQuery<{
    type: "async";
    run: void;
    all: T["all"];
    get: T["get"];
    values: T["values"];
    execute: T["execute"];
}> {
    private logger;
    private tx;
    private customResultMapper?;
    static readonly [entityKind]: string;
    /** @internal */
    stmt: Promise<StmtAsync>;
    private oneTime;
    constructor(client: DBAsync, query: Query, registry: FinalizationRegistry<HeldStatementFinalization> | null, logger: Logger, fields: SelectedFieldsOrdered | undefined, tx: TXAsync | null, executeMethod: SQLiteExecuteMethod, customResultMapper?: ((rows: unknown[][]) => unknown) | undefined);
    /**
     * execute query, no result expected
     */
    run(placeholderValues?: Record<string, unknown>): Promise<void>;
    /**
     * execute query and return all rows
     */
    all(placeholderValues?: Record<string, unknown>): Promise<unknown[]>;
    /**
     * only query first row
     */
    get(placeholderValues?: Record<string, unknown>): Promise<unknown | undefined>;
    /**
     * directly extract first column value from each row
     */
    values(placeholderValues?: Record<string, unknown>): Promise<unknown[]>;
}
export declare class CRSQLiteTransaction<TFullSchema extends Record<string, unknown>, TSchema extends TablesRelationalConfig> extends SQLiteTransaction<"async", void, TFullSchema, TSchema> {
    static readonly [entityKind]: string;
    transaction<T>(transaction: (tx: CRSQLiteTransaction<TFullSchema, TSchema>) => Promise<T>): Promise<T>;
}
export {};
