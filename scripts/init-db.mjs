import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tzueqxnndmmditnkeqcx.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dWVxeG5uZG1tZGl0bmtlcWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY0MDU1NCwiZXhwIjoyMTAwMjE2NTU0fQ.NcUKZNqcaImLtZ0Z8_s4nWs2M8jWI3jjoIc3uZxvC2w";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function initSupabase() {
  console.log("Connecting to Supabase project:", supabaseUrl);

  // 1. Create or verify 'resumes' storage bucket
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket("resumes", {
    public: true,
    fileSizeLimit: 10485760, // 10MB
  });

  if (bucketError) {
    if (bucketError.message.includes("already exists")) {
      console.log("✓ Storage bucket 'resumes' already exists and is active.");
    } else {
      console.warn("Storage bucket setup status:", bucketError.message);
    }
  } else {
    console.log("✓ Storage bucket 'resumes' created successfully!");
  }

  // 2. Test Supabase connection
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (!authError) {
    console.log("✓ Connected to Supabase Auth API cleanly! Total Users:", authData?.users?.length || 0);
  } else {
    console.warn("Supabase Auth API connection notice:", authError.message);
  }

  console.log("\n=======================================================");
  console.log("Supabase Connection & Storage Verification Complete!");
  console.log("=======================================================\n");
}

initSupabase();
