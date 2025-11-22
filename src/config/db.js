import pg from "pg";
const { Pool } = pg;

// refunds database
export const refundsDb = new Pool({
    host: process.env.REFUNDS_DB_HOST || "localhost",
    port: parseInt(process.env.REFUNDS_DB_PORT || "5447"),
    user: process.env.REFUNDS_DB_USER || "postgres",
    password: process.env.REFUNDS_DB_PASSWORD || "postgres",
    database: process.env.REFUNDS_DB_NAME || "refunds",
});

// payments database
export const paymentsDb = new Pool({
    host: process.env.PAYMENTS_DB_HOST || "localhost",
    port: parseInt(process.env.PAYMENTS_DB_PORT || "5446"),
    user: process.env.PAYMENTS_DB_USER || "postgres",
    password: process.env.PAYMENTS_DB_PASSWORD || "postgres",
    database: process.env.PAYMENTS_DB_NAME || "payments",
});
