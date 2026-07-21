import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseResumeWithOpenRouter } from "@/lib/ai/parse-resume";

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

    // 1. Read File Buffer & Extract Text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    if (file.name.toLowerCase().endsWith(".pdf")) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || "";
      } catch (pdfErr) {
        console.warn("pdf-parse error, reading buffer text fallback:", pdfErr);
        extractedText = buffer.toString("utf-8");
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = `Resume File Name: ${file.name}\nCandidate Email: ${user.email}`;
    }

    // 2. Upload file to Supabase Storage (Bucket: resumes)
    const timeStamp = Date.now();
    const filePath = `${user.id}/${timeStamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
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
        console.warn("Supabase Storage upload warning (proceeding with DB record):", storageError?.message);
        fileUrl = `/uploads/${file.name}`;
      }
    } catch (stErr) {
      console.warn("Storage upload exception caught:", stErr);
      fileUrl = `/uploads/${file.name}`;
    }

    // 3. AI Resume Parsing using OpenRouter SDK (poolside/laguna-xs-2.1:free)
    const parsedData = await parseResumeWithOpenRouter(extractedText);

    // Ensure fallback user identity details from session if missing in resume
    const fullName = parsedData.fullName !== "Candidate Full Name" && parsedData.fullName !== "John Doe"
      ? parsedData.fullName
      : (user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
    const email = parsedData.email || user.email || "";

    // 4. Save/Update Profile in Supabase DB
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        email: email,
        phone: parsedData.phone,
        location: parsedData.location,
        headline: parsedData.headline,
        summary: parsedData.summary,
        skills: parsedData.skills,
        links: parsedData.links,
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.warn("Profile table upsert warning:", profileError.message);
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
      console.warn("Work experiences DB insert warning:", workErr);
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
      console.warn("Educations DB insert warning:", eduErr);
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
      console.warn("Projects DB insert warning:", projErr);
    }

    // 8. Record Uploaded Resume in Resumes Table
    try {
      await supabase.from("resumes").insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_url: fileUrl,
        parsed_data: parsedData,
      });
    } catch (resErr) {
      console.warn("Resumes DB insert warning:", resErr);
    }

    return NextResponse.json({
      success: true,
      message: "Resume uploaded and parsed successfully!",
      parsedData: {
        ...parsedData,
        fullName,
        email,
      },
    });
  } catch (error: any) {
    console.error("Resume Upload API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process resume." },
      { status: 500 }
    );
  }
}
