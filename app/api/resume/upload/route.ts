import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseResumeWithGemini } from "@/lib/ai/parse-resume";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No resume file provided." },
        { status: 400 }
      );
    }

    // 1. Read File Content Buffer & Text representation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let rawFileContent = "";

    try {
      rawFileContent = buffer.toString("utf-8");
    } catch (e) {
      console.warn("Could not convert buffer to utf-8 text:", e);
    }

    // 2. Upload file to Supabase Storage bucket 'resumes'
    const timeStamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${timeStamp}_${safeFileName}`;
    let fileUrl = "";

    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from("resumes")
        .upload(filePath, buffer, {
          contentType: file.type || "application/pdf",
          upsert: true,
        });

      if (!storageError && storageData) {
        const { data: urlData } = supabase.storage
          .from("resumes")
          .getPublicUrl(filePath);
        fileUrl = urlData.publicUrl || "";
      } else {
        console.warn("Storage upload notice:", storageError?.message);
        fileUrl = `/uploads/${safeFileName}`;
      }
    } catch (stErr) {
      console.warn("Storage upload exception:", stErr);
      fileUrl = `/uploads/${safeFileName}`;
    }

    // 3. AI Model Gemini gemini-3.1-flash-lite Parsing
    const parsedData = await parseResumeWithGemini({
      buffer: buffer,
      text: rawFileContent,
      mimeType: file.type || "application/pdf",
      fileName: file.name,
    });

    const fullName =
      parsedData.fullName &&
      parsedData.fullName !== "Candidate Profile" &&
      parsedData.fullName !== "Candidate Full Name"
        ? parsedData.fullName
        : (user.user_metadata?.full_name || user.email?.split("@")[0] || "User");

    const email = parsedData.email || user.email || "";
    const profileImageUrl =
      parsedData.profileImageUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

    // 4. Save/Update Candidate Profile in Supabase DB (including profile_image_url)
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        email: email,
        phone: parsedData.phone || "",
        location: parsedData.location || "",
        headline: parsedData.headline || "",
        summary: parsedData.summary || "",
        skills: parsedData.skills || [],
        links: parsedData.links || {},
        profile_image_url: profileImageUrl,
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.warn("Profile table upsert notice:", profileError.message);
    }

    // 5. Replace Work Experiences in DB
    try {
      await supabase.from("work_experiences").delete().eq("user_id", user.id);
      if (parsedData.workExperiences && parsedData.workExperiences.length > 0) {
        const workRows = parsedData.workExperiences.map((w) => ({
          user_id: user.id,
          company: w.company,
          title: w.title,
          duration: w.duration,
          responsibilities: w.responsibilities,
        }));
        await supabase.from("work_experiences").insert(workRows);
      }
    } catch (workErr) {
      console.warn("Work experiences DB insert notice:", workErr);
    }

    // 6. Replace Educations in DB
    try {
      await supabase.from("educations").delete().eq("user_id", user.id);
      if (parsedData.educations && parsedData.educations.length > 0) {
        const eduRows = parsedData.educations.map((e) => ({
          user_id: user.id,
          institution: e.institution,
          degree: e.degree,
          field_of_study: e.fieldOfStudy,
          graduation_year: e.graduationYear,
        }));
        await supabase.from("educations").insert(eduRows);
      }
    } catch (eduErr) {
      console.warn("Educations DB insert notice:", eduErr);
    }

    // 7. Replace Projects in DB
    try {
      await supabase.from("projects").delete().eq("user_id", user.id);
      if (parsedData.projects && parsedData.projects.length > 0) {
        const projRows = parsedData.projects.map((p) => ({
          user_id: user.id,
          title: p.title,
          description: p.description,
          technologies: p.technologies,
          link: p.link,
        }));
        await supabase.from("projects").insert(projRows);
      }
    } catch (projErr) {
      console.warn("Projects DB insert notice:", projErr);
    }

    // 8. Record Uploaded Resume in Resumes Table
    try {
      await supabase.from("resumes").insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_url: fileUrl,
        parsed_data: {
          ...parsedData,
          profileImageUrl,
        },
      });
    } catch (resErr) {
      console.warn("Resumes DB insert notice:", resErr);
    }

    return NextResponse.json({
      success: true,
      message: "Resume uploaded and parsed via Gemini AI model successfully!",
      parsedData: {
        ...parsedData,
        fullName,
        email,
        profileImageUrl,
      },
    });
  } catch (error: any) {
    console.error("Resume Upload API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process resume via Gemini AI model." },
      { status: 500 }
    );
  }
}
