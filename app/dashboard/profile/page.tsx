"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  GraduationCap,
  FolderGit2,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  Globe,
  ExternalLink
} from "lucide-react";

interface WorkExperienceItem {
  id?: string;
  company: string;
  title: string;
  duration: string;
  responsibilities: string[];
}

interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
}

interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [workExperiences, setWorkExperiences] = useState<WorkExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const populateFromParsedData = (parsedData: any) => {
    if (!parsedData) return;
    if (parsedData.fullName) setFullName(parsedData.fullName);
    if (parsedData.email) setEmail(parsedData.email);
    if (parsedData.phone) setPhone(parsedData.phone);
    if (parsedData.location) setLocation(parsedData.location);
    if (parsedData.headline) setHeadline(parsedData.headline);
    if (parsedData.summary) setSummary(parsedData.summary);
    if (Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
      setSkills(parsedData.skills);
    }
    if (parsedData.links) {
      if (parsedData.links.linkedin) setLinkedin(parsedData.links.linkedin);
      if (parsedData.links.github) setGithub(parsedData.links.github);
      if (parsedData.links.portfolio) setPortfolio(parsedData.links.portfolio);
    }

    if (Array.isArray(parsedData.workExperiences) && parsedData.workExperiences.length > 0) {
      setWorkExperiences(
        parsedData.workExperiences.map((w: any) => ({
          company: w.company || "Company",
          title: w.title || "Role",
          duration: w.duration || "",
          responsibilities: Array.isArray(w.responsibilities)
            ? w.responsibilities
            : [w.responsibilities || ""],
        }))
      );
    }

    if (Array.isArray(parsedData.educations) && parsedData.educations.length > 0) {
      setEducations(
        parsedData.educations.map((e: any) => ({
          institution: e.institution || "University",
          degree: e.degree || "",
          fieldOfStudy: e.fieldOfStudy || "",
          graduationYear: e.graduationYear || "",
        }))
      );
    }

    if (Array.isArray(parsedData.projects) && parsedData.projects.length > 0) {
      setProjects(
        parsedData.projects.map((p: any) => ({
          title: p.title || "Project",
          description: p.description || "",
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
          link: p.link || "",
        }))
      );
    }
  };

  const fetchProfileData = async () => {
    setLoading(true);

    // 1. Instant check from localStorage
    try {
      const cached = localStorage.getItem("jobbuddy_parsed_profile");
      if (cached) {
        populateFromParsedData(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Could not read cached profile:", e);
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 2. Fetch Profile from Supabase DB
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.email) setEmail(profile.email);
        if (profile.phone) setPhone(profile.phone);
        if (profile.location) setLocation(profile.location);
        if (profile.headline) setHeadline(profile.headline);
        if (profile.summary) setSummary(profile.summary);
        if (Array.isArray(profile.skills) && profile.skills.length > 0) {
          setSkills(profile.skills);
        }

        const links = profile.links || {};
        if (links.linkedin) setLinkedin(links.linkedin);
        if (links.github) setGithub(links.github);
        if (links.portfolio) setPortfolio(links.portfolio);
      } else {
        if (!fullName) setFullName(user.user_metadata?.full_name || "");
        if (!email) setEmail(user.email || "");
      }

      // 3. Fetch Work Experiences
      const { data: workData } = await supabase
        .from("work_experiences")
        .select("*")
        .eq("user_id", user.id);

      if (workData && workData.length > 0) {
        setWorkExperiences(
          workData.map((w: any) => ({
            id: w.id,
            company: w.company,
            title: w.title,
            duration: w.duration || "",
            responsibilities: Array.isArray(w.responsibilities)
              ? w.responsibilities
              : [],
          }))
        );
      }

      // 4. Fetch Educations
      const { data: eduData } = await supabase
        .from("educations")
        .select("*")
        .eq("user_id", user.id);

      if (eduData && eduData.length > 0) {
        setEducations(
          eduData.map((e: any) => ({
            id: e.id,
            institution: e.institution,
            degree: e.degree || "",
            fieldOfStudy: e.field_of_study || "",
            graduationYear: e.graduation_year || "",
          }))
        );
      }

      // 5. Fetch Projects
      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id);

      if (projData && projData.length > 0) {
        setProjects(
          projData.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || "",
            technologies: Array.isArray(p.technologies) ? p.technologies : [],
            link: p.link || "",
          }))
        );
      }

      // 6. Fail-safe: Check latest resume in Resumes table if fields are still empty
      const { data: resumeRows } = await supabase
        .from("resumes")
        .select("parsed_data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (resumeRows && resumeRows[0]?.parsed_data) {
        populateFromParsedData(resumeRows[0].parsed_data);
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("User session expired. Please sign in again.");
      setSaving(false);
      return;
    }

    try {
      // 1. Upsert Profile
      const { error: profileErr } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          location: location,
          headline: headline,
          summary: summary,
          skills: skills,
          links: {
            linkedin,
            github,
            portfolio,
          },
          has_completed_onboarding: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileErr) throw profileErr;

      // 2. Replace Work Experiences
      await supabase.from("work_experiences").delete().eq("user_id", user.id);
      if (workExperiences.length > 0) {
        const workRows = workExperiences.map((w) => ({
          user_id: user.id,
          company: w.company,
          title: w.title,
          duration: w.duration,
          responsibilities: w.responsibilities,
        }));
        await supabase.from("work_experiences").insert(workRows);
      }

      // 3. Replace Educations
      await supabase.from("educations").delete().eq("user_id", user.id);
      if (educations.length > 0) {
        const eduRows = educations.map((e) => ({
          user_id: user.id,
          institution: e.institution,
          degree: e.degree,
          field_of_study: e.fieldOfStudy,
          graduation_year: e.graduationYear,
        }));
        await supabase.from("educations").insert(eduRows);
      }

      // 4. Replace Projects
      await supabase.from("projects").delete().eq("user_id", user.id);
      if (projects.length > 0) {
        const projRows = projects.map((p) => ({
          user_id: user.id,
          title: p.title,
          description: p.description,
          technologies: p.technologies,
          link: p.link,
        }));
        await supabase.from("projects").insert(projRows);
      }

      // Update cached localStorage copy
      const updatedProfile = {
        fullName,
        email,
        phone,
        location,
        headline,
        summary,
        skills,
        links: { linkedin, github, portfolio },
        workExperiences,
        educations,
        projects,
      };
      localStorage.setItem("jobbuddy_parsed_profile", JSON.stringify(updatedProfile));

      setSuccessMsg("Profile information updated successfully!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save profile updates.");
    } finally {
      setSaving(false);
    }
  };

  // Helper Handlers for Array fields
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      {
        company: "",
        title: "",
        duration: "",
        responsibilities: [""],
      },
    ]);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };

  const updateWorkExperience = (
    index: number,
    field: keyof WorkExperienceItem,
    value: any
  ) => {
    const updated = [...workExperiences];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperiences(updated);
  };

  const addResponsibility = (workIndex: number) => {
    const updated = [...workExperiences];
    updated[workIndex].responsibilities.push("");
    setWorkExperiences(updated);
  };

  const updateResponsibility = (
    workIndex: number,
    respIndex: number,
    value: string
  ) => {
    const updated = [...workExperiences];
    updated[workIndex].responsibilities[respIndex] = value;
    setWorkExperiences(updated);
  };

  const removeResponsibility = (workIndex: number, respIndex: number) => {
    const updated = [...workExperiences];
    updated[workIndex].responsibilities = updated[workIndex].responsibilities.filter(
      (_, i) => i !== respIndex
    );
    setWorkExperiences(updated);
  };

  const addEducation = () => {
    setEducations([
      ...educations,
      {
        institution: "",
        degree: "",
        fieldOfStudy: "",
        graduationYear: "",
      },
    ]);
  };

  const removeEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  const updateEducation = (
    index: number,
    field: keyof EducationItem,
    value: string
  ) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const addProject = () => {
    setProjects([
      ...projects,
      {
        title: "",
        description: "",
        technologies: [],
        link: "",
      },
    ]);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof ProjectItem, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-[#57cc99] animate-spin mb-3" />
        <p className="text-xs text-zinc-400 font-medium">Loading candidate profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16161b] border border-[#23232b] p-6 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Auto-Filled Profile</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Candidate Profile & Resume Data
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review and edit information parsed from your resume.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-6 py-3 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-sm rounded-2xl shadow-lg shadow-[#57cc99]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#57cc99]/10 border border-[#57cc99]/30 text-[#57cc99] text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#57cc99] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SECTION 1: Personal Details */}
      <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 pb-4 border-b border-[#23232b]">
          <User className="w-5 h-5 text-[#57cc99]" />
          <span>Personal Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full px-4 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-white text-sm focus:outline-none focus:border-[#57cc99]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Target Headline / Title
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full px-4 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-white text-sm focus:outline-none focus:border-[#57cc99]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-white text-sm focus:outline-none focus:border-[#57cc99]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-white text-sm focus:outline-none focus:border-[#57cc99]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Location / Timezone
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA or Remote"
              className="w-full px-4 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-white text-sm focus:outline-none focus:border-[#57cc99]"
            />
          </div>
        </div>

        {/* Links */}
        <div className="pt-4 border-t border-[#23232b] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#57cc99]" />
            <span>Links & Profiles</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="LinkedIn URL"
                className="w-full pl-10 pr-3 py-2 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
              />
            </div>

            <div className="relative">
              <ExternalLink className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="GitHub URL"
                className="w-full pl-10 pr-3 py-2 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
              />
            </div>

            <div className="relative">
              <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="Portfolio / Website"
                className="w-full pl-10 pr-3 py-2 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Professional Summary */}
      <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 pb-4 border-b border-[#23232b]">
          <FileText className="w-5 h-5 text-[#57cc99]" />
          <span>Professional Summary</span>
        </h2>

        <textarea
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief summary of your professional background, core accomplishments, and key strengths..."
          className="w-full px-4 py-3 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-white text-sm focus:outline-none focus:border-[#57cc99] leading-relaxed"
        />
      </div>

      {/* SECTION 3: Skills */}
      <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5 pb-4 border-b border-[#23232b]">
          <Sparkles className="w-5 h-5 text-[#57cc99]" />
          <span>Skills & Technologies</span>
        </h2>

        {/* Add Skill Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="Add skill (e.g. React, TypeScript, Python) and press Enter"
            className="flex-1 px-4 py-2.5 bg-[#0f0f12] border border-[#23232b] rounded-2xl text-white text-sm focus:outline-none focus:border-[#57cc99]"
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2.5 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-bold rounded-2xl text-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Skills Tag List */}
        <div className="flex flex-wrap gap-2 pt-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f0f12] border border-[#23232b] text-xs font-semibold text-zinc-200 group hover:border-[#57cc99]/40"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-zinc-500 hover:text-rose-400 transition-colors"
                title="Remove skill"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* SECTION 4: Work Experience */}
      <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-[#23232b]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-[#57cc99]" />
            <span>Work Experience</span>
          </h2>

          <button
            type="button"
            onClick={addWorkExperience}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-[#57cc99] font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </button>
        </div>

        {workExperiences.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500">
            No work experiences added yet. Click "Add Position" above to add one.
          </div>
        ) : (
          <div className="space-y-6">
            {workExperiences.map((work, wIdx) => (
              <div
                key={wIdx}
                className="p-5 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-4 relative"
              >
                <button
                  type="button"
                  onClick={() => removeWorkExperience(wIdx)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Delete experience entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pr-8">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={work.company}
                      onChange={(e) =>
                        updateWorkExperience(wIdx, "company", e.target.value)
                      }
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={work.title}
                      onChange={(e) =>
                        updateWorkExperience(wIdx, "title", e.target.value)
                      }
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Duration / Dates
                    </label>
                    <input
                      type="text"
                      value={work.duration}
                      onChange={(e) =>
                        updateWorkExperience(wIdx, "duration", e.target.value)
                      }
                      placeholder="e.g. Jan 2021 - Present"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>
                </div>

                {/* Responsibilities List */}
                <div className="space-y-2 pt-2 border-t border-[#23232b]">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Responsibilities / Bullet Points
                    </label>
                    <button
                      type="button"
                      onClick={() => addResponsibility(wIdx)}
                      className="text-[11px] font-bold text-[#57cc99] hover:underline"
                    >
                      + Add Bullet
                    </button>
                  </div>

                  {work.responsibilities.map((resp, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      <span className="text-[#57cc99] text-xs font-bold">•</span>
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) =>
                          updateResponsibility(wIdx, rIdx, e.target.value)
                        }
                        placeholder="Bullet point description of accomplishments..."
                        className="flex-1 px-3 py-1.5 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                      />
                      <button
                        type="button"
                        onClick={() => removeResponsibility(wIdx, rIdx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: Education */}
      <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-[#23232b]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-[#57cc99]" />
            <span>Education</span>
          </h2>

          <button
            type="button"
            onClick={addEducation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-[#57cc99] font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Education</span>
          </button>
        </div>

        {educations.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500">
            No education information added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {educations.map((edu, eIdx) => (
              <div
                key={eIdx}
                className="p-5 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-4 relative"
              >
                <button
                  type="button"
                  onClick={() => removeEducation(eIdx)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Delete education entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(eIdx, "institution", e.target.value)
                      }
                      placeholder="e.g. Stanford University"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Degree
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(eIdx, "degree", e.target.value)
                      }
                      placeholder="e.g. Bachelor of Science"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy}
                      onChange={(e) =>
                        updateEducation(eIdx, "fieldOfStudy", e.target.value)
                      }
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      value={edu.graduationYear}
                      onChange={(e) =>
                        updateEducation(eIdx, "graduationYear", e.target.value)
                      }
                      placeholder="e.g. 2023"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 6: Projects */}
      <div className="bg-[#16161b] border border-[#23232b] rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-[#23232b]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-[#57cc99]" />
            <span>Projects & Certifications</span>
          </h2>

          <button
            type="button"
            onClick={addProject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f0f12] hover:bg-[#1e1e26] border border-[#23232b] text-[#57cc99] font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500">
            No projects or certifications added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((proj, pIdx) => (
              <div
                key={pIdx}
                className="p-5 rounded-2xl bg-[#0f0f12] border border-[#23232b] space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeProject(pIdx)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Delete project entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => updateProject(pIdx, "title", e.target.value)}
                      placeholder="e.g. AI Resume Generator"
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Project Link
                    </label>
                    <input
                      type="text"
                      value={proj.link}
                      onChange={(e) => updateProject(pIdx, "link", e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) =>
                      updateProject(pIdx, "description", e.target.value)
                    }
                    placeholder="Short description of key features & achievements..."
                    className="w-full px-3 py-2 bg-[#16161b] border border-[#23232b] rounded-xl text-xs text-white focus:outline-none focus:border-[#57cc99]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Action Bottom */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-8 py-3.5 bg-[#57cc99] hover:bg-[#46b887] text-[#0f0f12] font-extrabold text-sm rounded-2xl shadow-xl shadow-[#57cc99]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Complete Profile</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
