import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection
pool.query("SELECT NOW()", (err, _res) => {  // Prefix with _ to indicate intentionally unused
  if (err) {
    // Console warnings disabled for production build
    // console.error("PostgreSQL connection error:", err.stack);
  } else {
    // Console warnings disabled for production build
    // console.log("PostgreSQL connected successfully");
  }
});

export { pool };