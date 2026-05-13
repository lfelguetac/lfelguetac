import { CVData } from './pdf-parser';

export function generateReadme(data: CVData): string {
  const sections: string[] = [];

  sections.push(generateHeader(data));
  sections.push(generateContactBar(data));

  if (data.summary) {
    sections.push(generateSummary(data.summary));
  }

  if (data.skills.length > 0) {
    sections.push(generateSkills(data.skills));
  }

  if (data.experience.length > 0) {
    sections.push(generateExperience(data.experience));
  }

  if (data.education.length > 0) {
    sections.push(generateEducation(data.education));
  }

  if (data.certifications.length > 0) {
    sections.push(generateCertifications(data.certifications));
  }

  if (data.languages.length > 0) {
    sections.push(generateLanguages(data.languages));
  }

  sections.push(generateFooter());

  return sections.join('\n\n');
}

function generateHeader(data: CVData): string {
  const title = data.title ? `\n### \`${data.title}\`` : '';
  const name = data.name.toUpperCase();

  return `
<div align="center">

# 👋 Hi, I'm ${name}
${title}

</div>
`.trim();
}

function generateContactBar(data: CVData): string {
  const links: string[] = [];

  if (data.email) {
    links.push(`📧 [${data.email}](mailto:${data.email})`);
  }
  if (data.phone) {
    links.push(`📱 ${data.phone}`);
  }
  if (data.location) {
    links.push(`📍 ${data.location}`);
  }
  if (data.linkedin) {
    links.push(`💼 [LinkedIn](${data.linkedin})`);
  }
  if (data.github) {
    links.push(`🐙 [GitHub](${data.github})`);
  }
  if (data.website) {
    links.push(`🌐 [Website](${data.website})`);
  }

  if (links.length === 0) return '';

  return `
<div align="center">

${links.join(' • ')}

</div>
`.trim();
}

function generateSummary(summary: string): string {
  return `
---

### 🎯 About Me

> ${summary}
`.trim();
}

function generateSkills(skills: string[]): string {
  const techBadges = skills.map(skill => {
    const normalized = skill.toLowerCase().replace(/\s+/g, '-');
    return `<img src="https://img.shields.io/badge/${encodeURIComponent(skill)}-151515?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTUtMTAtNXpNMiAxN2wxMCA1IDEwLTVNMiAxMmwxMCA1IDEwLTUiLz48L3N2Zz4=" alt="${skill}">`;
  });

  const skillsGrid = skills
    .map(skill => {
      const color = getSkillColor(skill);
      return `<img src="https://img.shields.io/badge/${encodeURIComponent(skill)}-${color}?style=for-the-badge&labelColor=1a1a2e" alt="${skill}">`;
    })
    .join(' ');

  return `
---

### 🛠️ Tech Stack & Skills

<div align="center">

${skillsGrid}

</div>
`.trim();
}

function getSkillColor(skill: string): string {
  const colors: Record<string, string> = {
    'javascript': 'F7DF1E',
    'typescript': '3178C6',
    'python': '3776AB',
    'java': 'ED8B00',
    'react': '61DAFB',
    'node.js': '339933',
    'nodejs': '339933',
    'aws': 'FF9900',
    'docker': '2496ED',
    'kubernetes': '326CE5',
    'terraform': '7B42BC',
    'postgresql': '4169E1',
    'mongodb': '47A248',
    'redis': 'DC382D',
    'graphql': 'E10098',
    'html': 'E34F26',
    'css': '1572B6',
    'sass': 'CC6699',
    'git': 'F05032',
    'linux': 'FCC624',
    'go': '00ADD8',
    'rust': 'DEA584',
    'c++': '00599C',
    'c#': '239120',
    'php': '777BB4',
    'ruby': 'CC342D',
    'swift': 'FA7343',
    'flutter': '02569B',
    'android': '3DDC84',
    'ios': '000000',
    'figma': 'F24E1E',
    'jenkins': 'D24939',
    'circleci': '343434',
    'github-actions': '2088FF',
    'azure': '0078D4',
    'gcp': '4285F4',
    'firebase': 'FFCA28',
    'mysql': '4479A1',
    'sqlite': '003B57',
    'elasticsearch': '005571',
    'kafka': '231F20',
    'rabbitmq': 'FF6600',
    'nginx': '009639',
    'apache': 'D22128',
  };

  const lower = skill.toLowerCase();
  for (const [key, color] of Object.entries(colors)) {
    if (lower.includes(key)) return color;
  }

  return '6e7681';
}

function generateExperience(experiences: { role: string; company: string; period: string; description: string }[]): string {
  const items = experiences
    .map(exp => {
      const header = exp.company
        ? `**${exp.role}** @ \`${exp.company}\``
        : `**${exp.role}**`;
      const period = exp.period ? `\n📅 \`${exp.period}\`` : '';
      const desc = exp.description ? `\n\n${exp.description}` : '';
      return `
<div style="margin-bottom: 16px;">

▸ ${header}${period}${desc}

</div>
`.trim();
    })
    .join('\n\n');

  return `
---

### 💼 Experience

${items}
`.trim();
}

function generateEducation(educations: { degree: string; institution: string; period: string }[]): string {
  const items = educations
    .map(edu => {
      const degree = `\`${edu.degree}\``;
      const institution = edu.institution ? `@ ${edu.institution}` : '';
      const period = edu.period ? `\n📅 \`${edu.period}\`` : '';
      return `▸ ${degree} ${institution}${period}`;
    })
    .join('\n\n');

  return `
---

### 🎓 Education

${items}
`.trim();
}

function generateCertifications(certifications: { name: string; issuer: string; date: string }[]): string {
  const items = certifications
    .map(cert => {
      const name = `🏆 **${cert.name}**`;
      const issuer = cert.issuer ? ` — ${cert.issuer}` : '';
      const date = cert.date ? ` \`${cert.date}\`` : '';
      return `▸ ${name}${issuer}${date}`;
    })
    .join('\n\n');

  return `
---

### 📜 Certifications

${items}
`.trim();
}

function generateLanguages(languages: string[]): string {
  const items = languages
    .map(lang => `▸ 🌐 ${lang}`)
    .join('\n\n');

  return `
---

### 🗣️ Languages

${items}
`.trim();
}

function generateFooter(): string {
  return `
---

<div align="center">

📄 *Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*

</div>
`.trim();
}
