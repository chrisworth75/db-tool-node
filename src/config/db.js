import pg from "pg";
const { Pool } = pg;

// refunds database
export const refundsDb = new Pool({
    host: "localhost",
    port: 5447,
    user: "postgres",
    password: "postgres",
    database: "refunds",
});

// payments database
export const paymentsDb = new Pool({
    host: "localhost",
    port: 5446,
    user: "postgres",
    password: "postgres",
    database: "payments",
});
