import { sql } from "drizzle-orm";
export async function migrate(db, config = { migrations: [] }) {
    const migrations = config.migrations;
    const migrationsTable = config.migrationsTable ?? "__drizzle_migrations";
    const migrationTableIdent = sql.identifier(migrationsTable);
    const migrationTableCreate = sql `
		CREATE TABLE IF NOT EXISTS ${migrationTableIdent} (
			id TEXT NOT NULL PRIMARY KEY,
			hash text NOT NULL,
			created_at INTEGER
		)
	`;
    // @ts-expect-error -- `session` exists but is marked as `@internal` on the type level
    await db.session.run(migrationTableCreate);
    const dbMigrations = await db.get(sql `SELECT id, hash, created_at FROM ${migrationTableIdent} ORDER BY created_at DESC LIMIT 1`);
    const lastDbMigration = dbMigrations ?? undefined;
    for (const migration of migrations) {
        if (!lastDbMigration || lastDbMigration.created_at < migration.folderMillis) {
            for (const stmt of migration.sql) {
                await db.run(sql.raw(stmt));
            }
            await db.run(sql `INSERT INTO ${migrationTableIdent} ("id", "hash", "created_at") VALUES(${crypto.randomUUID()}, ${migration.hash}, ${migration.folderMillis})`);
        }
    }
}
