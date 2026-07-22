import { inngest } from "./client";
import { createClient } from "@/lib/supabase/server";
import {
  detectPlatform,
  createBrowserbaseSession,
  detectRequiredFormFields,
  auditCandidateProfileForFields,
  autoFillAndSubmitWithBrowserbase,
  CandidateProfile,
} from "@/lib/browserbase";

/**
 * 1. Inngest Function: Audit and detect form fields sequentially (concurrency limit 1)
 */
export const auditAndDetectJobFields = inngest.createFunction(
  {
    id: "audit-and-detect-job-fields",
    concurrency: [{ limit: 1 }],
    triggers: [{ event: "job/application.audit" }],
  },
  async ({ event, step }) => {
    const { applicationId, jobId, userId, jobUrl, platform: customPlatform } = event.data;

    // Step 1: Detect Platform & Start Browserbase Session
    const sessionData = await step.run("create-browserbase-session", async () => {
      const platform = customPlatform || detectPlatform(jobUrl);
      const session = await createBrowserbaseSession();
      return { platform, ...session };
    });

    // Step 2: Detect Required Form Fields
    const fields = await step.run("detect-form-fields", async () => {
      return await detectRequiredFormFields(jobUrl, sessionData.platform);
    });

    // Step 3: Audit Candidate Profile against Required Fields
    const auditResult = await step.run("audit-candidate-profile", async () => {
      const supabase = await createClient();

      // Fetch Profile
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Fetch Resume
      const { data: resumes } = await supabase
        .from("resumes")
        .select("file_url, filename")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      const candidate: CandidateProfile = {
        fullName: profileRow?.full_name || "",
        firstName: (profileRow?.full_name || "").split(" ")[0] || "",
        lastName: (profileRow?.full_name || "").split(" ").slice(1).join(" ") || "",
        email: profileRow?.email || "",
        phone: profileRow?.phone || "",
        location: profileRow?.location || "",
        headline: profileRow?.headline || "",
        summary: profileRow?.summary || "",
        skills: profileRow?.skills || [],
        linkedin: profileRow?.links?.linkedin || "",
        github: profileRow?.links?.github || "",
        portfolio: profileRow?.links?.portfolio || "",
        resumeUrl: resumes && resumes[0]?.file_url ? resumes[0].file_url : undefined,
        resumeFilename: resumes && resumes[0]?.filename ? resumes[0].filename : undefined,
      };

      const audit = await auditCandidateProfileForFields(fields, candidate);
      return { audit, candidate };
    });

    // Step 4: Update Database Application Record
    await step.run("update-application-status", async () => {
      const supabase = await createClient();

      if (!auditResult.audit.isComplete) {
        // Missing required profile information
        await supabase
          .from("applications")
          .update({
            platform: sessionData.platform,
            status: "Missing Profile Info",
            detected_fields: fields,
            missing_fields: auditResult.audit.missingFields,
            browserbase_session_id: sessionData.sessionId,
            browserbase_debug_url: sessionData.debugUrl,
            notes: `Missing required profile info: ${auditResult.audit.missingFields.join(", ")}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        return { status: "Missing Profile Info", missing: auditResult.audit.missingFields };
      } else {
        // Profile is complete! Mark as Auto-Filling
        await supabase
          .from("applications")
          .update({
            platform: sessionData.platform,
            status: "Auto-Filling",
            detected_fields: fields,
            missing_fields: [],
            browserbase_session_id: sessionData.sessionId,
            browserbase_debug_url: sessionData.debugUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        // Send submission event to continue the flow
        await inngest.send({
          name: "job/application.submit",
          data: {
            applicationId,
            jobId,
            userId,
            jobUrl,
            platform: sessionData.platform,
            sessionId: sessionData.sessionId,
            debugUrl: sessionData.debugUrl,
            candidate: auditResult.candidate,
          },
        });

        return { status: "Auto-Filling", missing: [] };
      }
    });
  }
);

/**
 * 2. Inngest Function: Auto-Fill and Submit Application sequentially (concurrency limit 1)
 */
export const autoFillAndSubmitJob = inngest.createFunction(
  {
    id: "autofill-and-submit-job",
    concurrency: [{ limit: 1 }],
    triggers: [{ event: "job/application.submit" }],
  },
  async ({ event, step }) => {
    const { applicationId, jobId, jobUrl, platform, sessionId, debugUrl, candidate } = event.data;

    // Step 1: Execute Auto-Fill & Submission via Browserbase + Stagehand
    const submitResult = await step.run("execute-browserbase-autofill", async () => {
      return await autoFillAndSubmitWithBrowserbase({
        sessionId,
        debugUrl,
        jobUrl,
        platform,
        profile: candidate,
      });
    });

    // Step 2: Save final Submitted status and Session ID to Database
    await step.run("finalize-application-submission", async () => {
      const supabase = await createClient();

      await supabase
        .from("applications")
        .update({
          status: "Submitted",
          browserbase_session_id: sessionId,
          browserbase_debug_url: debugUrl,
          notes: submitResult.notes,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      // Update corresponding job status if present
      if (jobId) {
        await supabase
          .from("jobs")
          .update({
            applied_status: true,
          })
          .eq("id", jobId);
      }
    });

    return { success: true, sessionId, status: "Submitted" };
  }
);
