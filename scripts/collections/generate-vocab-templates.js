/**
 * Generates vocabulary file templates for German B2, C1, C2 levels
 * Target: 10,300+ words total across all CEFR levels
 */

const fs = require('fs');
const path = require('path');

// B2 Level Structure (1,800 words)
const b2Themes = [
  { name: 'Advanced Communication & Rhetoric', words: 150, sections: ['Argumentation', 'Persuasion', 'Discourse', 'Academic Expression'] },
  { name: 'Professional & Business', words: 180, sections: ['Corporate', 'Management', 'Finance', 'Operations', 'Legal'] },
  { name: 'Politics & Media', words: 140, sections: ['Political Systems', 'Law & Justice', 'Social Issues', 'Media'] },
  { name: 'Science & Technology', words: 130, sections: ['Scientific Method', 'Innovation', 'Digital World', 'Environment'] },
  { name: 'Culture & Arts', words: 110, sections: ['Arts', 'Literature', 'Performance', 'Music'] },
  { name: 'Psychology & Behavior', words: 100, sections: ['Mental Processes', 'Emotions', 'Personality', 'Behavior'] },
  { name: 'Education & Academia', words: 100, sections: ['Higher Education', 'Research', 'Knowledge', 'Teaching'] },
  { name: 'Philosophy & Abstract Thought', words: 90, sections: ['Philosophy', 'Existence', 'Reasoning', 'Values'] },
  { name: 'Medicine & Health', words: 100, sections: ['Medical Professions', 'Conditions', 'Treatment', 'Wellness'] },
  { name: 'Advanced Emotions & States', words: 80, sections: ['Complex Emotions', 'Mental States', 'Dispositions'] },
  { name: 'Society & Globalization', words: 120, sections: ['Social Structures', 'Economics', 'Global Issues', 'Demographics'] },
  { name: 'Technology & Innovation', words: 100, sections: ['IT', 'Engineering', 'Automation', 'Future Tech'] },
  { name: 'Environment & Sustainability', words: 110, sections: ['Climate', 'Conservation', 'Ecology', 'Energy'] },
  { name: 'Law & Rights', words: 90, sections: ['Legal System', 'Rights', 'Contracts', 'Justice'] },
  { name: 'Communication & Language', words: 100, sections: ['Linguistics', 'Rhetoric', 'Interpersonal', 'Written'] }
];

// C1 Level Structure (2,500 words)
const c1Themes = [
  { name: 'Academic Discourse', words: 200, sections: ['Research Methodology', 'Critical Analysis', 'Theoretical Frameworks', 'Scientific Writing'] },
  { name: 'Professional Specialization', words: 220, sections: ['Industry Terminology', 'Project Management', 'Strategic Planning', 'Quality Assurance'] },
  { name: 'Socio-Political Analysis', words: 180, sections: ['Political Theory', 'Policy Analysis', 'Governance', 'Diplomacy'] },
  { name: 'Advanced Sciences', words: 200, sections: ['Natural Sciences', 'Social Sciences', 'Mathematics', 'Research'] },
  { name: 'Economics & Finance', words: 180, sections: ['Macroeconomics', 'Financial Markets', 'Banking', 'Investment'] },
  { name: 'Cultural Studies', words: 160, sections: ['Art History', 'Literary Analysis', 'Cultural Theory', 'Aesthetics'] },
  { name: 'Advanced Psychology', words: 150, sections: ['Cognitive Science', 'Social Psychology', 'Psychotherapy', 'Neuroscience'] },
  { name: 'Philosophy & Ethics', words: 140, sections: ['Epistemology', 'Ethics', 'Metaphysics', 'Logic'] },
  { name: 'Technology & Engineering', words: 170, sections: ['Advanced IT', 'Mechanical Engineering', 'Electrical Engineering', 'Architecture'] },
  { name: 'Legal & Administrative', words: 150, sections: ['Constitutional Law', 'Administrative Law', 'Civil Law', 'Criminal Law'] },
  { name: 'Medicine & Biosciences', words: 160, sections: ['Clinical Medicine', 'Pharmacology', 'Genetics', 'Public Health'] },
  { name: 'Environmental Sciences', words: 130, sections: ['Climate Science', 'Biodiversity', 'Pollution', 'Renewable Energy'] },
  { name: 'Media & Communication Theory', words: 120, sections: ['Mass Media', 'Digital Media', 'Journalism', 'PR'] },
  { name: 'Education & Pedagogy', words: 110, sections: ['Educational Theory', 'Curriculum Development', 'Assessment', 'Learning'] },
  { name: 'Complex Abstract Concepts', words: 130, sections: ['Time & Space', 'Causality', 'Probability', 'Systems Thinking'] },
  { name: 'Nuanced Expression', words: 100, sections: ['Subtle Distinctions', 'Connotations', 'Register', 'Style'] }
];

// C2 Level Structure (3,500 words)
const c2Themes = [
  { name: 'Literary & Poetic Language', words: 280, sections: ['Literary Devices', 'Poetry', 'Prose', 'Drama', 'Literary Criticism'] },
  { name: 'Specialized Professional Jargon', words: 300, sections: ['Legal Jargon', 'Medical Terminology', 'Technical Jargon', 'Academic Jargon'] },
  { name: 'Idiomatic & Figurative', words: 350, sections: ['Idioms', 'Metaphors', 'Proverbs', 'Colloquialisms', 'Slang'] },
  { name: 'Advanced Philosophy', words: 200, sections: ['Continental Philosophy', 'Analytic Philosophy', 'Eastern Philosophy', 'Modern Philosophy'] },
  { name: 'Refined Cultural Discourse', words: 180, sections: ['Art Criticism', 'Music Theory', 'Theatre', 'Cinema', 'Architecture'] },
  { name: 'Specialized Sciences', words: 250, sections: ['Theoretical Physics', 'Advanced Biology', 'Chemistry', 'Earth Sciences'] },
  { name: 'Advanced Medicine', words: 220, sections: ['Specialized Medicine', 'Surgery', 'Diagnostics', 'Therapeutics'] },
  { name: 'Complex Legal Concepts', words: 200, sections: ['Jurisprudence', 'International Law', 'Commercial Law', 'IP Law'] },
  { name: 'Advanced Economics', words: 180, sections: ['Economic Theory', 'Econometrics', 'Development Economics', 'Behavioral Economics'] },
  { name: 'Subtle Nuances & Register', words: 200, sections: ['Formal Register', 'Informal Register', 'Archaic', 'Modern Coinages'] },
  { name: 'Advanced Technology', words: 200, sections: ['AI & ML', 'Quantum Computing', 'Biotechnology', 'Nanotechnology'] },
  { name: 'Historical & Archaic Terms', words: 150, sections: ['Historical Periods', 'Obsolete Terms', 'Regional Variants', 'Dialects'] },
  { name: 'Abstract & Philosophical', words: 180, sections: ['Ontology', 'Phenomenology', 'Hermeneutics', 'Deconstruction'] },
  { name: 'Rare & Sophisticated', words: 200, sections: ['Rare Verbs', 'Rare Nouns', 'Rare Adjectives', 'Complex Compounds'] },
  { name: 'Academic Writing', words: 150, sections: ['Thesis Writing', 'Peer Review', 'Citations', 'Methodology'] },
  { name: 'Rhetorical Mastery', words: 160, sections: ['Advanced Rhetoric', 'Stylistic Devices', 'Eloquence', 'Oratory'] },
  { name: 'Cross-disciplinary Terms', words: 150, sections: ['Interdisciplinary', 'Transdisciplinary', 'Applied Sciences', 'Hybrid Fields'] },
  { name: 'Near-native Expressions', words: 150, sections: ['Native-like Phrases', 'Cultural References', 'Historical Allusions', 'Current Affairs'] }
];

function generateVocabFile(level, themes, targetWords) {
  let content = `# German ${level} Level Vocabulary (~${targetWords.toLocaleString()} words)\n\n`;
  content += `## Overview\n\n`;
  content += `This vocabulary list contains approximately ${targetWords.toLocaleString()} words organized by theme.\n`;
  content += `Target proficiency: ${level} level (CEFR)\n\n`;
  content += `## Themes\n\n`;

  themes.forEach((theme, idx) => {
    content += `${idx + 1}. ${theme.name} (${theme.words} words)\n`;
  });

  content += `\n---\n\n`;

  themes.forEach((theme, idx) => {
    content += `## ${idx + 1}. ${theme.name} (${theme.words} words)\n\n`;
    theme.sections.forEach(section => {
      content += `### ${section}\n`;
      content += `| German | Translation | Example | Notes |\n`;
      content += `|--------|-------------|---------|-------|\n`;
      content += `<!-- TODO: Add ${Math.ceil(theme.words / theme.sections.length)} words for ${section} -->\n\n`;
    });
    content += `---\n\n`;
  });

  content += `## Total: ${level} = ~${targetWords.toLocaleString()} words\n`;

  return content;
}

// Generate files
const b2Content = generateVocabFile('B2', b2Themes, 1800);
const c1Content = generateVocabFile('C1', c1Themes, 2500);
const c2Content = generateVocabFile('C2', c2Themes, 3500);

const docsDir = path.join(__dirname, '..', 'docs');

fs.writeFileSync(path.join(docsDir, 'german-b2-vocabulary.md'), b2Content);
fs.writeFileSync(path.join(docsDir, 'german-c1-vocabulary.md'), c1Content);
fs.writeFileSync(path.join(docsDir, 'german-c2-vocabulary.md'), c2Content);

console.log('✓ Created B2 vocabulary template (1,800 words target)');
console.log('✓ Created C1 vocabulary template (2,500 words target)');
console.log('✓ Created C2 vocabulary template (3,500 words target)');
console.log('\nTemplates created. Ready for vocabulary population.');
console.log('Total target: 10,300+ words across all levels');
