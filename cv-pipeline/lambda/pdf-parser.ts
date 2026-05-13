export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  period: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface CVData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  languages: string[];
  certifications: Certification[];
}

export function extractCVData(text: string): CVData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const cvData: CVData = {
    name: extractName(lines, text),
    title: extractTitle(lines, text),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
    linkedin: extractUrl(text, /linkedin\.com\/in\/[^\s)]+/i),
    github: extractUrl(text, /github\.com\/[^\s)]+/i),
    website: extractUrl(text, /https?:\/\/(?!linkedin|github)[^\s)]+/i),
    summary: extractSummary(lines, text),
    skills: extractSkills(lines, text),
    experience: extractExperience(lines, text),
    education: extractEducation(lines, text),
    languages: extractLanguages(lines, text),
    certifications: extractCertifications(lines, text),
  };

  return cvData;
}

function extractName(lines: string[], text: string): string {
  const namePatterns = [
    /^(?:CV|Curriculum Vitae)?[:.\s]*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){2,})/i,
    /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){2,})\s*$/m,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return lines[0]?.replace(/CV|Curriculum Vitae/gi, '').trim() || 'Unknown';
}

function extractTitle(lines: string[], text: string): string {
  const titlePatterns = [
    /(Software Engineer|Full Stack Developer|Backend Developer|Frontend Developer|DevOps Engineer|Solutions Architect|Tech Lead|Senior Developer|Principal Engineer|Cloud Architect|Data Engineer|ML Engineer)/i,
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

function extractEmail(text: string): string {
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1] : '';
}

function extractPhone(text: string): string {
  const match = text.match(/(\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})/);
  return match ? match[1] : '';
}

function extractLocation(text: string): string {
  const patterns = [
    /(?:Location|Ubicación|Address)[:\s]+([^\n]+)/i,
    /([A-Z][a-z]+,\s*(?:[A-Z][a-z]+|US|USA|Chile|Argentina|Brazil|Mexico|Spain))/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

function extractUrl(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match ? match[0] : '';
}

function extractSummary(lines: string[], text: string): string {
  const summaryStart = text.match(/(?:Summary|Profile|About Me|Perfil Profesional|Resumen)[:\s]*\n?/i);
  if (!summaryStart) return '';

  const startIndex = summaryStart.index! + summaryStart[0].length;
  const remaining = text.slice(startIndex);

  const endPatterns = [
    /(?:Experience|Experiencia|Work History|Employment)/i,
    /(?:Skills|Habilidades|Technical Skills)/i,
    /(?:Education|Educación|Academic Background)/i,
  ];

  let endIndex = remaining.length;
  for (const pattern of endPatterns) {
    const match = remaining.match(pattern);
    if (match && match.index! < endIndex) {
      endIndex = match.index!;
    }
  }

  return remaining.slice(0, endIndex).trim().split('\n').slice(0, 4).join(' ');
}

function extractSkills(lines: string[], text: string): string[] {
  const skillsSection = extractSection(text, /(?:Skills|Habilidades|Technical Skills|Core Competencies)/i);
  if (!skillsSection) return [];

  const skills = skillsSection
    .split(/[,\n•\-\|]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 50)
    .map(s => s.replace(/^[•\-\*\|]\s*/, ''));

  return [...new Set(skills)];
}

function extractExperience(lines: string[], text: string): Experience[] {
  const experienceSection = extractSection(text, /(?:Experience|Experiencia Laboral|Work Experience|Professional Experience)/i);
  if (!experienceSection) return [];

  const experiences: Experience[] = [];
  const entries = experienceSection.split(/(?=\d{4}\s*[-–—]\s*(?:\d{4}|Present|Actual))/);

  for (const entry of entries) {
    if (!entry.trim()) continue;

    const periodMatch = entry.match(/(\d{4}\s*[-–—]\s*(?:\d{4}|Present|Actual))/);
    const roleMatch = entry.match(/^([^\n]+)/m);
    const companyMatch = entry.match(/(?:at|en|@)\s+([^\n,]+)/i);

    if (roleMatch) {
      experiences.push({
        role: roleMatch[1].trim(),
        company: companyMatch ? companyMatch[1].trim() : extractCompanyFromContext(entry),
        period: periodMatch ? periodMatch[1].trim() : '',
        description: entry.split('\n').slice(2).join(' ').trim().slice(0, 200),
      });
    }
  }

  return experiences;
}

function extractCompanyFromContext(text: string): string {
  const match = text.match(/(?:at|en|@)\s+([A-Z][A-Za-z\s&.]+)/);
  return match ? match[1].trim() : '';
}

function extractEducation(lines: string[], text: string): Education[] {
  const educationSection = extractSection(text, /(?:Education|Educación|Academic Background|Formación Académica)/i);
  if (!educationSection) return [];

  const educations: Education[] = [];
  const entries = educationSection.split(/(?=\d{4})/);

  for (const entry of entries) {
    if (!entry.trim()) continue;

    const periodMatch = entry.match(/(\d{4}\s*[-–—]?\s*\d{4}?)/);
    const degreeMatch = entry.match(/(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Ingeniería|Licenciatura|Diploma|Degree)[^\n]*/i);

    if (degreeMatch) {
      educations.push({
        degree: degreeMatch[0].trim(),
        institution: extractInstitution(entry),
        period: periodMatch ? periodMatch[1].trim() : '',
      });
    }
  }

  return educations;
}

function extractInstitution(text: string): string {
  const patterns = [
    /(?:from|at|en|@)\s+([A-Z][A-Za-z\s&.]+(?:University|Institute|College|Universidad|Instituto))/i,
    /([A-Z][A-Za-z\s&.]+(?:University|Institute|College|Universidad|Instituto))/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

function extractLanguages(lines: string[], text: string): string[] {
  const languagesSection = extractSection(text, /(?:Languages|Idiomas|Lenguas)/i);
  if (!languagesSection) return [];

  return languagesSection
    .split(/[,\n•\-\|]/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.length < 50);
}

function extractCertifications(_lines: string[], text: string): Certification[] {
  const certsSection = extractSection(text, /(?:Certifications|Certificaciones|Certifications & Awards)/i);
  if (!certsSection) return [];

  const certifications: Certification[] = [];
  const certLines = certsSection.split('\n');

  for (const line of certLines) {
    const trimmed = line.trim().replace(/^[•\-\*\|]\s*/, '');
    if (trimmed) {
      const dateMatch = trimmed.match(/(\d{4})/);
      certifications.push({
        name: trimmed.replace(/\d{4}/, '').trim(),
        issuer: extractIssuer(trimmed),
        date: dateMatch ? dateMatch[1] : '',
      });
    }
  }

  return certifications;
}

function extractIssuer(text: string): string {
  const patterns = [
    /(?:from|by|issued by|de)\s+([A-Z][A-Za-z\s&.]+)/i,
    /(?:AWS|Microsoft|Google|Oracle|Cisco|Scrum|PMI)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1]?.trim() || match[0];
  }

  return '';
}

function extractSection(text: string, headerPattern: RegExp): string {
  const headerMatch = text.match(headerPattern);
  if (!headerMatch) return '';

  const startIndex = headerMatch.index! + headerMatch[0].length;
  const remaining = text.slice(startIndex);

  const nextSectionPatterns = [
    /^(?:#{1,3}\s+)?(?:Experience|Experiencia|Work|Skills|Habilidades|Education|Educación|Languages|Idiomas|Certifications|Certificaciones|Projects|Proyectos|Summary|Profile|About|Interests|Intereses|Volunteer|References)/im,
  ];

  let endIndex = remaining.length;
  for (const pattern of nextSectionPatterns) {
    const match = remaining.match(pattern);
    if (match && match.index! < endIndex && match.index! > 10) {
      endIndex = match.index!;
    }
  }

  return remaining.slice(0, endIndex).trim();
}
