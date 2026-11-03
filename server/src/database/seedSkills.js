import mongoose from 'mongoose';
import { Skill, createSkillSlug } from '../models/Skill.js';
import { CANONICAL_SKILLS } from '../config/skillRegistry.js';

/**
 * Idempotently seeds canonical skills into MongoDB
 */
export const seedCanonicalSkills = async () => {
  try {
    let inserted = 0;
    let updated = 0;

    for (const item of CANONICAL_SKILLS) {
      const slug = createSkillSlug(item.name);
      const existing = await Skill.findOne({ slug });

      if (!existing) {
        await Skill.create({
          name: item.name,
          slug,
          category: item.category,
          aliases: item.aliases || [],
          iconProvider: item.iconProvider || 'devicon',
          iconName: item.iconName || '',
          iconUrl: item.iconUrl || '',
          fallbackUrl: item.fallbackUrl || '',
          iconifyUrl: item.iconifyUrl || '',
          color: item.color || '#64748b',
          usageCount: 1,
        });
        inserted++;
      } else {
        // Refresh icon fields if empty
        let needsUpdate = false;
        if (!existing.iconUrl && item.iconUrl) {
          existing.iconUrl = item.iconUrl;
          needsUpdate = true;
        }
        if (!existing.fallbackUrl && item.fallbackUrl) {
          existing.fallbackUrl = item.fallbackUrl;
          needsUpdate = true;
        }
        if (!existing.color && item.color) {
          existing.color = item.color;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await existing.save();
          updated++;
        }
      }
    }

    if (inserted > 0 || updated > 0) {
      console.log(`✅ Seeded ${inserted} canonical skills, updated ${updated} with icon metadata.`);
    }
    return { inserted, updated, total: CANONICAL_SKILLS.length };
  } catch (err) {
    console.warn(`[SeedSkills] Non-critical warning seeding canonical skills: ${err.message}`);
    return { error: err.message };
  }
};

export default seedCanonicalSkills;

