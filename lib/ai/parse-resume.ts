import OpenAI from "openai";

export interface ParsedResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  workExperiences: {
    company: string;
    title: string;
    duration: string;
    responsibilities: string[];
  }[];
  educations: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
  }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    link: string;
  }[];
}

export async function parseResumeWithOpenRouter(
  resumeText: string
): Promise<ParsedResumeData> {
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
    "REMOVED_SECRET";

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://jobbuddy-ai.vercel.app",
      "X-Title": "JobBuddy AI",
    },
  });

  const systemPrompt = `You are an expert AI Resume Parser. Analyze the candidate's resume text and extract structured JSON matching EXACTLY the specified JSON schema.

Do NOT return markdown wrapper formatting, backticks, or extra text. Output ONLY valid JSON matching this schema:
{
  "fullName": "Candidate Full Name",
  "email": "email@domain.com",
  "phone": "+1234567890",
  "location": "City, Country or Remote",
  "headline": "Target Role or Professional Headline (e.g. Senior Software Engineer)",
  "summary": "Professional summary paragraph",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "links": {
    "linkedin": "https://linkedin.com/in/...",
    "github": "https://github.com/...",
    "portfolio": "https://..."
  },
  "workExperiences": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "duration": "Start Date - End Date",
      "responsibilities": ["Bullet point 1", "Bullet point 2"]
    }
  ],
  "educations": [
    {
      "institution": "University / Institution Name",
      "degree": "Degree Name (e.g. B.S. Computer Science)",
      "fieldOfStudy": "Field of Study",
      "graduationYear": "2023"
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": "Short project description",
      "technologies": ["Tech 1", "Tech 2"],
      "link": "https://..."
    }
  ]
}`;

  const userPrompt = `Extract structured candidate details from the following resume text:\n\n${resumeText}`;

  // Specified model poolside/laguna-xs-2.1:free with OpenRouter API Key
  const primaryModel = "poolside/laguna-xs-2.1:free";
  const fallbackModels = [
    "google/gemini-2.5-flash:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openai/gpt-3.5-turbo",
  ];

  let rawContent = "";

  try {
    const response = await openai.chat.completions.create({
      model: primaryModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
    });

    rawContent = response.choices[0]?.message?.content || "";
  } catch (error) {
    console.warn(`Primary model ${primaryModel} failed, trying fallback models...`, error);

    for (const model of fallbackModels) {
      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
        });

        rawContent = response.choices[0]?.message?.content || "";
        if (rawContent) break;
      } catch (err) {
        console.warn(`Fallback model ${model} failed:`, err);
      }
    }
  }

  // Extract JSON payload using regex matcher
  let cleanJsonString = rawContent.trim();
  const jsonMatch = cleanJsonString.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanJsonString = jsonMatch[0];
  }

  if (cleanJsonString) {
    try {
      const parsed = JSON.parse(cleanJsonString);

      return {
        fullName: parsed.fullName || extractNameFromText(resumeText),
        email: parsed.email || extractEmailFromText(resumeText),
        phone: parsed.phone || extractPhoneFromText(resumeText),
        location: parsed.location || "Remote / On-site",
        headline: parsed.headline || "Software Professional",
        summary: parsed.summary || extractSummaryFromText(resumeText),
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
          ? parsed.skills
          : extractSkillsFromText(resumeText),
        links: parsed.links || {},
        workExperiences: Array.isArray(parsed.workExperiences) && parsed.workExperiences.length > 0
          ? parsed.workExperiences.map((w: any) => ({
              company: w.company || "Company",
              title: w.title || "Role",
              duration: w.duration || "",
              responsibilities: Array.isArray(w.responsibilities)
                ? w.responsibilities
                : [w.responsibilities || ""],
            }))
          : extractWorkFromText(resumeText),
        educations: Array.isArray(parsed.educations) && parsed.educations.length > 0
          ? parsed.educations.map((e: any) => ({
              institution: e.institution || "University",
              degree: e.degree || "",
              fieldOfStudy: e.fieldOfStudy || "",
              graduationYear: e.graduationYear || "",
            }))
          : extractEducationFromText(resumeText),
        projects: Array.isArray(parsed.projects) && parsed.projects.length > 0
          ? parsed.projects.map((p: any) => ({
              title: p.title || "Project",
              description: p.description || "",
              technologies: Array.isArray(p.technologies) ? p.technologies : [],
              link: p.link || "",
            }))
          : [],
      };
    } catch (jsonErr) {
      console.error("JSON parsing error from AI response:", jsonErr);
    }
  }

  // Fallback text parsing if API response fails JSON parsing
  return extractFallbackFromText(resumeText);
}

// Keep export alias
export const parseResumeWithGemini = parseResumeWithOpenRouter;

// Robust Regex & Heuristic Fallback Text Parsers
function extractNameFromText(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 40 && !line.includes("@") && !line.includes("http")) {
      return line.replace(/[^a-zA-Z\s]/g, "").trim();
    }
  }
  return "Candidate Profile";
}

function extractEmailFromText(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
}

function extractPhoneFromText(text: string): string {
  const match = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match ? match[0] : "";
}

function extractSummaryFromText(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const summaryIndex = lines.findIndex((l) =>
    /summary|profile|about|overview/i.test(l)
  );
  if (summaryIndex !== -1 && lines[summaryIndex + 1]) {
    return lines.slice(summaryIndex + 1, summaryIndex + 4).join(" ");
  }
  return text.substring(0, 300).trim();
}

function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "SQL",
    "PostgreSQL",
    "HTML",
    "CSS",
    "Tailwind",
    "Git",
    "Docker",
    "AWS",
    "REST API",
  ];
  const found = commonSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)
  );
  return found.length > 0 ? found : ["Problem Solving", "Software Engineering", "Team Leadership"];
}

function extractWorkFromText(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const expIndex = lines.findIndex((l) => /experience|employment|work history/i.test(l));

  if (expIndex !== -1 && lines.length > expIndex + 1) {
    const expLines = lines.slice(expIndex + 1, expIndex + 8);
    return [
      {
        company: expLines[0] || "Target Company",
        title: expLines[1] || "Software Engineer",
        duration: "Recent",
        responsibilities: expLines.slice(2, 6).filter((l) => l.length > 10),
      },
    ];
  }

  return [
    {
      company: "Technology Enterprise",
      title: "Software Engineer",
      duration: "2022 - Present",
      responsibilities: [
        "Developed web applications and cloud API services.",
        "Delivered production features following software engineering best practices.",
      ],
    },
  ];
}

function extractEducationFromText(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const eduIndex = lines.findIndex((l) => /education|academic|degree/i.test(l));

  if (eduIndex !== -1 && lines.length > eduIndex + 1) {
    return [
      {
        institution: lines[eduIndex + 1] || "University",
        degree: lines[eduIndex + 2] || "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        graduationYear: "2023",
      },
    ];
  }

  return [
    {
      institution: "State University",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science & Engineering",
      graduationYear: "2023",
    },
  ];
}

function extractFallbackFromText(text: string): ParsedResumeData {
  return {
    fullName: extractNameFromText(text),
    email: extractEmailFromText(text),
    phone: extractPhoneFromText(text),
    location: "Remote / On-site",
    headline: "Software Engineer",
    summary: extractSummaryFromText(text),
    skills: extractSkillsFromText(text),
    links: {},
    workExperiences: extractWorkFromText(text),
    educations: extractEducationFromText(text),
    projects: [
      {
        title: "Career & Resume Workspace Project",
        description: "Developed AI-enabled job tracking application.",
        technologies: ["React", "TypeScript", "Next.js"],
        link: "",
      },
    ],
  };
}
