import { GoogleGenAI } from "@google/genai";

export interface WorkExperience {
  company: string;
  title: string;
  duration: string;
  responsibilities: string[];
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface ParsedResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  profileImageUrl?: string;
  skills: string[];
  links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    [key: string]: string | undefined;
  };
  workExperiences: WorkExperience[];
  educations: Education[];
  projects: Project[];
  certifications?: Certification[];
}

const SYSTEM_PROMPT = `You are an expert AI Resume Parser. Your job is to thoroughly analyze candidate resume documents (PDF, DOCX, TXT) and extract all important professional details into a single valid JSON object.

Extract as much rich detail as available in the resume. Return ONLY valid JSON with no markdown formatting surrounding it, matching this EXACT JSON schema:

{
  "fullName": "Candidate Full Name",
  "email": "candidate.email@domain.com",
  "phone": "+1 (555) 000-0000",
  "location": "City, State / Remote",
  "headline": "Current or Target Professional Title",
  "summary": "Full professional summary or objective statement from resume",
  "profileImageUrl": "https://... or empty string if not found",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "links": {
    "linkedin": "https://linkedin.com/in/...",
    "github": "https://github.com/...",
    "portfolio": "https://..."
  },
  "workExperiences": [
    {
      "company": "Company Name",
      "title": "Job Title / Role",
      "duration": "Dates of employment (e.g. Jan 2021 - Present)",
      "responsibilities": [
        "Key responsibility or bullet point achievement 1",
        "Key responsibility or bullet point achievement 2"
      ]
    }
  ],
  "educations": [
    {
      "institution": "University / School Name",
      "degree": "Degree Title (e.g. Bachelor of Science)",
      "fieldOfStudy": "Field of study or Major",
      "graduationYear": "Year of graduation or attendance (e.g. 2022)"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Detailed project description and key accomplishments",
      "technologies": ["Tech 1", "Tech 2"],
      "link": "https://..."
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Year or Date"
    }
  ]
}`;

/**
 * Parses resume file content (PDF, DOCX, TXT) using Google Gemini AI SDK with model gemini-3.1-flash-lite
 */
export async function parseResumeWithGemini(
  input: {
    buffer?: Buffer;
    text?: string;
    mimeType?: string;
    fileName?: string;
  } | string
): Promise<ParsedResumeData> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

  const ai = new GoogleGenAI({ apiKey });

  let textContent = "";
  let base64Data = "";
  let mimeType = "application/pdf";

  if (typeof input === "string") {
    textContent = input;
  } else {
    mimeType = input.mimeType || "application/pdf";
    if (input.text) {
      textContent = input.text;
    }
    if (input.buffer) {
      base64Data = input.buffer.toString("base64");
    }
  }

  const promptText = `Please parse this resume document and extract all details strictly according to the specified JSON schema. Ensure complete extraction of work experience, bullet points, skills, education, projects, contact info, summary, and profile photo URL if any.`;

  let parts: any[] = [{ text: `${SYSTEM_PROMPT}\n\n${promptText}` }];

  if (base64Data && mimeType) {
    parts.push({
      inlineData: {
        mimeType: mimeType === "application/octet-stream" ? "application/pdf" : mimeType,
        data: base64Data,
      },
    });
  }

  if (textContent) {
    parts.push({
      text: `RESUME CONTENT:\n${textContent}`,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    const rawText = response.text || "";
    const parsed = cleanAndParseJsonResponse(rawText);
    if (parsed) {
      return normalizeParsedData(parsed);
    }
  } catch (error) {
    console.error("Gemini AI Resume Parsing Error:", error);
    if (base64Data && textContent) {
      try {
        const retryRes = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: `${SYSTEM_PROMPT}\n\n${promptText}` },
                { text: `RESUME TEXT CONTENT:\n${textContent}` },
              ],
            },
          ],
        });
        const retryParsed = cleanAndParseJsonResponse(retryRes.text || "");
        if (retryParsed) {
          return normalizeParsedData(retryParsed);
        }
      } catch (retryErr) {
        console.error("Gemini AI Retry failed:", retryErr);
      }
    }
  }

  return {
    fullName: "Candidate Profile",
    email: "",
    phone: "",
    location: "Remote / On-site",
    headline: "Professional Candidate",
    summary: textContent ? textContent.slice(0, 300) : "Uploaded resume candidate profile",
    profileImageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=Candidate%20Profile`,
    skills: ["Problem Solving", "Communication", "Professional Skills"],
    links: {},
    workExperiences: [],
    educations: [],
    projects: [],
    certifications: [],
  };
}


function cleanAndParseJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "");
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Could not parse JSON output from Gemini AI:", e, "\nRaw text:", rawText);
    return null;
  }
}

function normalizeParsedData(parsed: any): ParsedResumeData {
  const name = parsed.fullName || "Candidate Profile";
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  return {
    fullName: name,
    email: parsed.email || "",
    phone: parsed.phone || "",
    location: parsed.location || "Remote / On-site",
    headline: parsed.headline || "Software Professional",
    summary: parsed.summary || "",
    profileImageUrl: parsed.profileImageUrl && parsed.profileImageUrl.startsWith("http")
      ? parsed.profileImageUrl
      : defaultAvatar,
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    links: typeof parsed.links === "object" && parsed.links !== null ? parsed.links : {},
    workExperiences: Array.isArray(parsed.workExperiences)
      ? parsed.workExperiences.map((w: any) => ({
          company: w.company || "Company",
          title: w.title || "Role",
          duration: w.duration || "",
          responsibilities: Array.isArray(w.responsibilities)
            ? w.responsibilities
            : typeof w.responsibilities === "string"
            ? [w.responsibilities]
            : [],
        }))
      : [],
    educations: Array.isArray(parsed.educations)
      ? parsed.educations.map((e: any) => ({
          institution: e.institution || "Institution",
          degree: e.degree || "",
          fieldOfStudy: e.fieldOfStudy || e.field_of_study || "",
          graduationYear: e.graduationYear || e.graduation_year || "",
        }))
      : [],
    projects: Array.isArray(parsed.projects)
      ? parsed.projects.map((p: any) => ({
          title: p.title || "Project",
          description: p.description || "",
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
          link: p.link || "",
        }))
      : [],
    certifications: Array.isArray(parsed.certifications)
      ? parsed.certifications.map((c: any) => ({
          name: typeof c === "string" ? c : c.name || "Certification",
          issuer: typeof c === "object" ? c.issuer || "" : "",
          date: typeof c === "object" ? c.date || "" : "",
        }))
      : [],
  };
}
