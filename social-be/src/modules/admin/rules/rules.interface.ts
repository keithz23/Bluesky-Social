import { RuleSeverity } from '@prisma/client';

export interface ActiveRuleResponse {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
}

export interface RulesResponse {
  id: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reports: number;
    keywords: number;
  };
}
