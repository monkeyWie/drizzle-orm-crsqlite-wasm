import { entityKind } from "drizzle-orm/entity";
import { NoopLogger } from "drizzle-orm/logger";
import { fillPlaceholders } from "drizzle-orm/sql/sql";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { SQLitePreparedQuery, SQLiteSession } from "drizzle-orm/sqlite-core/session";
export class CRSQLiteSession extends SQLiteSession {
    client;
    dialect;
    schema;
    options;
    tx;
    static [entityKind] = "CRSQLiteSession";
    logger;
    registry;
    constructor(client, dialect, schema, options, tx) {
        super(dialect);
        this.client = client;
        this.dialect = dialect;
        this.schema = schema;
        this.options = options;
        this.tx = tx;
        this.logger = options.logger ?? new NoopLogger();
        this.registry = new FinalizationRegistry((heldValue) => {
            heldValue.stmt.then((stmt) => stmt.finalize(heldValue.tx));
        });
    }
    prepareQuery(query, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
        return new CRSQLitePreparedQuery(this.client, query, this.registry, this.logger, fields, this.tx ?? null, executeMethod, customResultMapper);
    }
    prepareOneTimeQuery(query, fields, executeMethod, _isResponseInArrayMode) {
        return new CRSQLitePreparedQuery(this.client, query, null, this.logger, fields, this.tx ?? null, executeMethod);
    }
    async transaction(transaction
    // _config?: SQLiteTransactionConfig
    ) {
        const [release, imperativeTx] = await this.client.imperativeTx();
        const session = new CRSQLiteSession(this.client, this.dialect, this.schema, this.options, imperativeTx);
        const tx = new CRSQLiteTransaction("async", this.dialect, session, this.schema);
        try {
            const result = await tx.transaction(transaction);
            release();
            return result;
        }
        catch (err) {
            release();
            throw err;
        }
    }
    exec(query) {
        this.logger.logQuery(query, []);
        return (this.tx ?? this.client).exec(query);
    }
}
export class CRSQLitePreparedQuery extends SQLitePreparedQuery {
    logger;
    tx;
    customResultMapper;
    static [entityKind] = "CRSQLitePreparedQuery";
    /** @internal */
    stmt;
    oneTime;
    constructor(client, query, registry, logger, fields, tx, executeMethod, customResultMapper) {
        super("async", executeMethod, query);
        this.logger = logger;
        this.tx = tx;
        this.customResultMapper = customResultMapper;
        this.stmt = (tx ?? client).prepare(query.sql);
        if (registry) {
            registry.register(this, { stmt: this.stmt, tx: tx ?? null });
            this.oneTime = false;
        }
        else {
            this.oneTime = true;
        }
    }
    /**
     * execute query, no result expected
     */
    async run(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        const stmt = await this.stmt;
        await stmt.run(this.tx, ...params);
        if (this.oneTime) {
            void stmt.finalize(this.tx);
        }
    }
    /**
     * execute query and return all rows
     */
    async all(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        const stmt = await this.stmt;
        stmt.raw(Boolean(this.customResultMapper));
        const rows = await stmt.all(this.tx, ...params);
        if (this.oneTime) {
            void stmt.finalize(this.tx);
        }
        return this.customResultMapper ? this.customResultMapper(rows) : rows;
    }
    /**
     * only query first row
     */
    async get(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        const stmt = await this.stmt;
        stmt.raw(Boolean(this.customResultMapper));
        const row = await stmt.get(this.tx, ...params);
        if (this.oneTime) {
            void stmt.finalize(this.tx);
        }
        if (!row) {
            return undefined;
        }
        return this.customResultMapper ? this.customResultMapper([row]) : row;
    }
    /**
     * directly extract first column value from each row
     */
    async values(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        const stmt = await this.stmt;
        stmt.raw(true);
        const rows = (await stmt.all(null, ...params));
        if (this.oneTime) {
            void stmt.finalize(this.tx);
        }
        return rows.map((row) => row[0]);
    }
}
export class CRSQLiteTransaction extends SQLiteTransaction {
    static [entityKind] = "CRSQLiteTransaction";
    async transaction(transaction) {
        const savepointName = `sp${this.nestedIndex}`;
        const tx = new CRSQLiteTransaction("async", 
        // @ts-expect-error -- it does exist, but we have to add a constructor for TS to recognize it
        this.dialect, 
        // @ts-expect-error -- it does exist, but we have to add a constructor for TS to recognize it
        this.session, this.schema, this.nestedIndex + 1);
        // @ts-expect-error -- it does exist, but we have to add a constructor for TS to recognize it
        await this.session.exec(`SAVEPOINT ${savepointName};`);
        try {
            const result = await transaction(tx);
            // @ts-expect-error -- it does exist, but we have to add a constructor for TS to recognize it
            await this.session.exec(`RELEASE savepoint ${savepointName};`);
            return result;
        }
        catch (err) {
            // @ts-expect-error -- it does exist, but we have to add a constructor for TS to recognize it
            await this.session.exec(`ROLLBACK TO savepoint ${savepointName};`);
            throw err;
        }
    }
}
