import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tzueqxnndmmditnkeqcx.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dWVxeG5uZG1tZGl0bmtlcWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0MDU1NCwiZXhwIjoyMTAwMjE2NTU0fQ.NcUKZNqcaImLtZ0Z8_s4nWs2M8jWI3jjoIc3uZxvC2w";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log("Reading schema SQL file...");
  const sqlPath = path.join(process.cwd(), "lib", "supabase", "schema.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  console.log("Connecting to Supabase project:", supabaseUrl);

  // 1. Create storage bucket
  try {
    const { data: bucket, error: bErr } = await supabase.storage.createBucket("resumes", {
      public: true,
      fileSizeLimit: 10485760,
    });
    if (!bErr) {
      console.log("✓ Storage bucket 'resumes' created successfully!");
    } else {
      console.log("✓ Storage bucket 'resumes' status:", bErr.message);
    }
  } catch (err) {
    console.warn("Storage setup notice:", err);
  }

  // 2. Execute SQL query via REST / SQL API if available
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sqlContent }),
    });

    if (response.ok) {
      console.log("✓ Database schemas and tables executed successfully via RPC!");
    } else {
      const errText = await response.text();
      console.log("RPC exec_sql notice:", response.status, errText);
    }
  } catch (err) {
    console.warn("RPC query exception:", err);
  }

  console.log("\n=======================================================");
  console.log("Database Schema Push Attempt Finished!");
  console.log("Project Ref: tzueqxnndmmditnkeqcx");
  console.log("SQL Schema File Location: lib/supabase/schema.sql");
  console.log("=======================================================\n");
}

runMigration();
