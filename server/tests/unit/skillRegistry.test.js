import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_SKILLS,
  SKILL_CATEGORIES,
  normalizeSkillKey,
  findSkillByNameOrAlias,
  resolveSkillIcon,
  searchCanonicalSkills,
} from '../../src/config/skillRegistry.js';
import { Skill } from '../../src/models/Skill.js';

describe('Developer Skills & Icon Integration Unit Tests', () => {
  test('normalizeSkillKey standardizes casing, symbols, and aliases', () => {
    assert.equal(normalizeSkillKey('Node.js'), 'node.js');
    assert.equal(normalizeSkillKey('React.js'), 'react.js');
    assert.equal(normalizeSkillKey('C++'), 'c++');
    assert.equal(normalizeSkillKey('C#'), 'c#');
    assert.equal(normalizeSkillKey('.NET'), '.net');
    assert.equal(normalizeSkillKey('  Docker!  '), 'docker');
    assert.equal(normalizeSkillKey(''), '');
    assert.equal(normalizeSkillKey(null), '');
  });

  test('Canonical Registry contains all 30+ requested technologies', () => {
    const requiredTechs = [
      'HTML5',
      'CSS3',
      'JavaScript',
      'TypeScript',
      'React',
      'Angular',
      'Vue.js',
      'Next.js',
      'Node.js',
      'Express.js',
      'MongoDB',
      'MySQL',
      'PostgreSQL',
      'Redis',
      'Python',
      'Java',
      'C',
      'C++',
      'C#',
      'PHP',
      'Go',
      'Rust',
      'Ruby',
      'Git',
      'GitHub',
      'GitLab',
      'Docker',
      'Kubernetes',
      'AWS',
      'Azure',
      'Google Cloud',
      'Figma',
      'Firebase',
      'Linux',
    ];

    for (const tech of requiredTechs) {
      const match = findSkillByNameOrAlias(tech);
      assert.ok(match, `Expected ${tech} to be present in canonical skills registry`);
      assert.ok(match.iconUrl, `${tech} must have an iconUrl`);
      assert.ok(match.color, `${tech} must have an official color`);
      assert.match(match.color, /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/, `${tech} color must be valid hex`);
    }
  });

  test('findSkillByNameOrAlias resolves case-insensitively and through aliases', () => {
    // Exact & casing
    assert.equal(findSkillByNameOrAlias('react')?.name, 'React');
    assert.equal(findSkillByNameOrAlias('REACT')?.name, 'React');
    assert.equal(findSkillByNameOrAlias('python')?.name, 'Python');

    // Aliases
    assert.equal(findSkillByNameOrAlias('js')?.name, 'JavaScript');
    assert.equal(findSkillByNameOrAlias('ts')?.name, 'TypeScript');
    assert.equal(findSkillByNameOrAlias('py')?.name, 'Python');
    assert.equal(findSkillByNameOrAlias('k8s')?.name, 'Kubernetes');
    assert.equal(findSkillByNameOrAlias('gcp')?.name, 'Google Cloud');
    assert.equal(findSkillByNameOrAlias('postgres')?.name, 'PostgreSQL');
    assert.equal(findSkillByNameOrAlias('c++')?.name, 'C++');
    assert.equal(findSkillByNameOrAlias('c#')?.name, 'C#');
  });

  test('resolveSkillIcon returns multi-tier CDN URLs for canonical skills', () => {
    const reactIcon = resolveSkillIcon('React');
    assert.equal(reactIcon.found, true);
    assert.equal(reactIcon.name, 'React');
    assert.equal(reactIcon.category, 'Frontend development');
    assert.ok(reactIcon.iconUrl.includes('jsdelivr.net') || reactIcon.iconUrl.includes('simpleicons.org'));
    assert.ok(reactIcon.fallbackUrl.includes('simpleicons.org'));
    assert.ok(reactIcon.iconifyUrl.includes('iconify.design'));
    assert.equal(reactIcon.color, '#61DAFB');
  });

  test('resolveSkillIcon provides graceful fallback for unknown / custom skills', () => {
    const custom = resolveSkillIcon('CustomSpecialTech');
    assert.equal(custom.found, false);
    assert.equal(custom.name, 'CustomSpecialTech');
    assert.ok(custom.iconUrl.includes('simpleicons.org/customspecialtech'));
    assert.ok(custom.fallbackUrl.includes('iconify.design'));
    assert.equal(custom.color, '#64748b');
  });

  test('searchCanonicalSkills ranks prefix matches and obeys limit', () => {
    const results = searchCanonicalSkills('git', 5);
    assert.ok(results.length > 0 && results.length <= 5);
    // Git should rank before GitLab or GitHub if exact start
    assert.equal(results[0].name, 'Git');

    const emptySearch = searchCanonicalSkills('', 3);
    assert.equal(emptySearch.length, 3);
  });

  test('Skill Mongoose model validates schema including icon fields', () => {
    const skillDoc = new Skill({
      name: 'Docker',
      category: 'DevOps and cloud',
      iconProvider: 'devicon',
      iconName: 'docker',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg',
      fallbackUrl: 'https://cdn.simpleicons.org/docker/2496ED',
      iconifyUrl: 'https://api.iconify.design/logos/docker-icon.svg',
      color: '#2496ED',
    });

    const err = skillDoc.validateSync();
    assert.equal(err, undefined);
    assert.equal(skillDoc.name, 'Docker');
    assert.equal(skillDoc.category, 'DevOps and cloud');
    assert.equal(skillDoc.iconProvider, 'devicon');
  });

  test('Skill Mongoose model rejects missing required name', () => {
    const invalidSkill = new Skill({});
    const err = invalidSkill.validateSync();
    assert.ok(err);
    assert.ok(err.errors.name);
  });
});
