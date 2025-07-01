import type { MigrationMeta } from "drizzle-orm/migrator";
import type { CRSQLiteDatabase } from "./driver.js";
type MigrationConfig = {
    /** @default "__drizzle_migrations" */
    migrationsTable?: string;
    migrations: MigrationMeta[];
};
export declare function migrate<TSchema extends Record<string, unknown>>(db: CRSQLiteDatabase<TSchema>, config?: MigrationConfig): Promise<void>;
export {};
