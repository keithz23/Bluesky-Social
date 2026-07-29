import { KeywordAction, PrismaClient, RuleSeverity } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const id = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, '')}`;

type RuleSeed = {
  title: string;
  description: string;
  severity: RuleSeverity;
  displayOrder: number;
  keywords: { word: string; action: KeywordAction }[];
};

const rules: RuleSeed[] = [
  {
    title: 'Hate Speech',
    description:
      'Content that attacks or demeans a group based on race, ethnicity, religion, gender, or sexual orientation.',
    severity: RuleSeverity.CRITICAL,
    displayOrder: 1,
    keywords: [
      { word: 'go back to your country', action: KeywordAction.AUTO_HIDE },
      { word: 'subhuman', action: KeywordAction.AUTO_HIDE },
      { word: 'racial slur', action: KeywordAction.AUTO_HIDE },
      { word: 'ethnic cleansing', action: KeywordAction.AUTO_HIDE },
    ],
  },
  {
    title: 'Harassment & Bullying',
    description:
      'Repeated hostile behavior directed at a specific person intended to intimidate or demean them.',
    severity: RuleSeverity.HIGH,
    displayOrder: 2,
    keywords: [
      { word: 'kill yourself', action: KeywordAction.AUTO_HIDE },
      { word: 'nobody likes you', action: KeywordAction.WARN },
      { word: 'ugly loser', action: KeywordAction.WARN },
      { word: 'you should disappear', action: KeywordAction.AUTO_HIDE },
      { word: 'stupid idiot', action: KeywordAction.FLAG },
    ],
  },
  {
    title: 'Violence & Threats',
    description:
      'Explicit or implied threats of physical harm against a person, group, or location.',
    severity: RuleSeverity.CRITICAL,
    displayOrder: 3,
    keywords: [
      { word: 'i will kill you', action: KeywordAction.AUTO_HIDE },
      { word: 'bomb threat', action: KeywordAction.AUTO_HIDE },
      { word: 'shoot up the school', action: KeywordAction.AUTO_HIDE },
      { word: 'bring a gun', action: KeywordAction.AUTO_HIDE },
    ],
  },
  {
    title: 'Self-Harm & Suicide',
    description:
      'References to self-harm or suicide, flagged for wellbeing intervention rather than punitive action.',
    severity: RuleSeverity.CRITICAL,
    displayOrder: 4,
    keywords: [
      { word: 'want to end it all', action: KeywordAction.FLAG },
      { word: 'thinking about suicide', action: KeywordAction.FLAG },
      { word: 'self harm', action: KeywordAction.FLAG },
      { word: 'no reason to live', action: KeywordAction.FLAG },
    ],
  },
  {
    title: 'Spam & Scams',
    description:
      'Unsolicited promotional content, phishing attempts, or get-rich-quick schemes.',
    severity: RuleSeverity.MEDIUM,
    displayOrder: 5,
    keywords: [
      { word: 'buy followers now', action: KeywordAction.AUTO_HIDE },
      { word: 'click this link to claim', action: KeywordAction.AUTO_HIDE },
      { word: 'work from home earn 5000', action: KeywordAction.AUTO_HIDE },
      { word: 'act now limited time offer', action: KeywordAction.WARN },
      { word: 'double your bitcoin', action: KeywordAction.AUTO_HIDE },
    ],
  },
  {
    title: 'Adult & Sexual Content',
    description:
      'Explicit sexual content or solicitation not permitted on the platform.',
    severity: RuleSeverity.HIGH,
    displayOrder: 6,
    keywords: [
      { word: 'onlyfans link in bio', action: KeywordAction.AUTO_HIDE },
      { word: 'sell nudes', action: KeywordAction.AUTO_HIDE },
      { word: 'explicit content dm me', action: KeywordAction.WARN },
    ],
  },
  {
    title: 'Illegal Activity',
    description:
      'Promotion or facilitation of illegal goods, services, or activity.',
    severity: RuleSeverity.HIGH,
    displayOrder: 7,
    keywords: [
      { word: 'weed for sale', action: KeywordAction.AUTO_HIDE },
      { word: 'fake id for sale', action: KeywordAction.AUTO_HIDE },
      { word: 'stolen credit cards', action: KeywordAction.AUTO_HIDE },
      { word: 'counterfeit goods', action: KeywordAction.WARN },
    ],
  },
  {
    title: 'Misinformation',
    description:
      'False or misleading claims presented as fact, particularly around health or civic events.',
    severity: RuleSeverity.MEDIUM,
    displayOrder: 8,
    keywords: [
      { word: 'vaccines cause autism', action: KeywordAction.WARN },
      { word: 'election was rigged', action: KeywordAction.FLAG },
      { word: 'miracle cure for cancer', action: KeywordAction.WARN },
    ],
  },
  {
    title: 'Profanity',
    description:
      'General coarse language that does not target a specific person or group.',
    severity: RuleSeverity.LOW,
    displayOrder: 9,
    keywords: [
      { word: 'damn it', action: KeywordAction.FLAG },
      { word: 'wtf', action: KeywordAction.FLAG },
      { word: 'piece of crap', action: KeywordAction.FLAG },
    ],
  },
  {
    title: 'Doxxing & Personal Info',
    description:
      'Sharing another person\u2019s private information (address, phone number, ID) without consent.',
    severity: RuleSeverity.CRITICAL,
    displayOrder: 10,
    keywords: [
      { word: 'here is his home address', action: KeywordAction.AUTO_HIDE },
      { word: 'leaked phone number', action: KeywordAction.AUTO_HIDE },
      { word: 'find where she lives', action: KeywordAction.AUTO_HIDE },
    ],
  },
];

export async function main() {
  console.log(`Seeding ${rules.length} rules...`);

  for (const rule of rules) {
    const ruleId = id('rule');

    await prisma.rule.upsert({
      where: { title: rule.title },
      update: {
        description: rule.description,
        severity: rule.severity,
        displayOrder: rule.displayOrder,
        isActive: true,
      },
      create: {
        id: ruleId,
        title: rule.title,
        description: rule.description,
        severity: rule.severity,
        displayOrder: rule.displayOrder,
        isActive: true,
      },
    });

    // Re-fetch to get the real id (in case the rule already existed with a different id)
    const persistedRule = await prisma.rule.findUniqueOrThrow({
      where: { title: rule.title },
      select: { id: true },
    });

    for (const keyword of rule.keywords) {
      await prisma.keyword.upsert({
        where: { word: keyword.word },
        update: {
          action: keyword.action,
          ruleId: persistedRule.id,
        },
        create: {
          id: id('keyword'),
          word: keyword.word,
          action: keyword.action,
          ruleId: persistedRule.id,
        },
      });
    }

    console.log(`  - ${rule.title}: ${rule.keywords.length} keywords`);
  }

  console.log('Rules & keywords seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
