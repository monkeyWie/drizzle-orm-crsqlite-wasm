import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { DrizzleConfig } from "drizzle-orm/utils";
import type { DBAsync } from "@vlcn.io/xplat-api";
export type CRSQLiteDatabase<TSchema extends Record<string, unknown> = Record<string, never>> = BaseSQLiteDatabase<"async", void, TSchema>;
export declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>>(client: DBAsync, config?: DrizzleConfig<TSchema>): CRSQLiteDatabase<TSchema>;
