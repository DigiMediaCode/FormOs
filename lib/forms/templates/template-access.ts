import "server-only";

import type { SubscriptionPlan } from "@prisma/client";
import { fieldTypeLabel, isOfficeField, type FormFieldType } from "@/lib/forms/fields";
import type { WorkflowTemplateDefinition } from "@/lib/forms/templates/vertical-workflow-templates";
import { normalizePlanLimits, type PlanLimits, type UserPlanAccess } from "@/lib/plans/limits";

export type TemplateRequiredCapabilities = {
  allowTemplates?: boolean;
  allowOfficeUseFields?: boolean;
  allowConditionalLogic?: boolean;
  allowPdfGeneration?: boolean;
  allowGoogleDrive?: boolean;
  allowDropbox?: boolean;
  requiredFieldTypes: FormFieldType[];
  maxConditionalRules: number;
};

export type TemplatePlanOption = Pick<
  SubscriptionPlan,
  "id" | "name" | "slug" | "limits" | "sortOrder"
>;

export type TemplateAccessStatus = {
  canCreate: boolean;
  hasPlanAccess: boolean;
  isTrialAvailable: boolean;
  isTrialCreation: boolean;
  trialExpired: boolean;
  trialUsed: boolean;
  formLimitReached: boolean;
  ctaLabel: string;
  message: string;
  minimumPlanName: string | null;
  minimumPlanSlug: string | null;
  requiredCapabilities: TemplateRequiredCapabilities;
  featureBadges: string[];
};

const BOOLEAN_CAPABILITY_LABELS: Array<
  [keyof Omit<TemplateRequiredCapabilities, "requiredFieldTypes" | "maxConditionalRules">, string]
> = [
  ["allowTemplates", "Templates"],
  ["allowOfficeUseFields", "Office fields"],
  ["allowConditionalLogic", "Conditional logic"],
  ["allowPdfGeneration", "PDF generation"],
  ["allowGoogleDrive", "Google Drive"],
  ["allowDropbox", "Dropbox"],
];

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function isFormLimitReached(access: UserPlanAccess) {
  return (
    access.limits.maxForms !== null &&
    access.usage.formsUsed >= access.limits.maxForms
  );
}

function missingBooleanCapability(
  limits: PlanLimits,
  capabilities: TemplateRequiredCapabilities,
) {
  return BOOLEAN_CAPABILITY_LABELS.find(
    ([key]) => capabilities[key] === true && !limits[key],
  )?.[1];
}

function missingFieldType(
  limits: PlanLimits,
  capabilities: TemplateRequiredCapabilities,
) {
  if (limits.allowedFieldTypes === null) {
    return null;
  }

  return capabilities.requiredFieldTypes.find(
    (fieldType) => !limits.allowedFieldTypes?.includes(fieldType),
  );
}

export function getTemplateRequiredCapabilities(
  template: WorkflowTemplateDefinition,
): TemplateRequiredCapabilities {
  const fields = template.getFields();
  const requiredFieldTypes = unique([
    ...(template.requiredCapabilities.requiredFieldTypes ?? []),
    ...fields.map((field) => field.type),
  ]);
  const conditionalRules = fields.filter(
    (field) => field.conditionalLogic?.enabled,
  ).length;
  const maxConditionalRules = Math.max(
    conditionalRules,
    template.requiredCapabilities.maxConditionalRules ?? 0,
  );

  return {
    allowTemplates: template.requiredCapabilities.allowTemplates ?? true,
    allowOfficeUseFields:
      template.requiredCapabilities.allowOfficeUseFields ??
      fields.some(isOfficeField),
    allowConditionalLogic:
      template.requiredCapabilities.allowConditionalLogic ??
      maxConditionalRules > 0,
    allowPdfGeneration: template.requiredCapabilities.allowPdfGeneration ?? false,
    allowGoogleDrive: template.requiredCapabilities.allowGoogleDrive,
    allowDropbox: template.requiredCapabilities.allowDropbox,
    requiredFieldTypes,
    maxConditionalRules,
  };
}

export function planSatisfiesTemplateCapabilities(
  limits: PlanLimits,
  capabilities: TemplateRequiredCapabilities,
) {
  if (missingBooleanCapability(limits, capabilities)) {
    return false;
  }

  if (missingFieldType(limits, capabilities)) {
    return false;
  }

  if (
    capabilities.maxConditionalRules > 0 &&
    limits.maxConditionalRules !== null &&
    capabilities.maxConditionalRules > limits.maxConditionalRules
  ) {
    return false;
  }

  return true;
}

export function getMinimumPlanForTemplate(
  template: WorkflowTemplateDefinition,
  activePlans: TemplatePlanOption[],
) {
  const capabilities = getTemplateRequiredCapabilities(template);

  return [...activePlans]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((plan) =>
      planSatisfiesTemplateCapabilities(
        normalizePlanLimits(plan.limits),
        capabilities,
      ),
    ) ?? null;
}

export function getTemplateRequirementBadges(
  template: WorkflowTemplateDefinition,
) {
  const capabilities = getTemplateRequiredCapabilities(template);
  const fieldBadges = capabilities.requiredFieldTypes
    .filter((fieldType) =>
      ["signature", "initials", "image_upload", "html"].includes(fieldType),
    )
    .map(fieldTypeLabel);
  const capabilityBadges = BOOLEAN_CAPABILITY_LABELS.filter(
    ([key]) => capabilities[key] === true,
  ).map(([, label]) => label);

  return unique([...template.featureBadges, ...capabilityBadges, ...fieldBadges]);
}

function getMissingRequirementMessage(
  limits: PlanLimits,
  capabilities: TemplateRequiredCapabilities,
) {
  const booleanCapability = missingBooleanCapability(limits, capabilities);

  if (booleanCapability) {
    return booleanCapability;
  }

  const fieldType = missingFieldType(limits, capabilities);

  if (fieldType) {
    return fieldTypeLabel(fieldType);
  }

  if (
    capabilities.maxConditionalRules > 0 &&
    limits.maxConditionalRules !== null &&
    capabilities.maxConditionalRules > limits.maxConditionalRules
  ) {
    return `${capabilities.maxConditionalRules} conditional rules`;
  }

  return "premium workflow features";
}

export function getTemplateAccessStatus({
  access,
  activePlans,
  template,
}: {
  access: UserPlanAccess;
  activePlans: TemplatePlanOption[];
  template: WorkflowTemplateDefinition;
}): TemplateAccessStatus {
  const requiredCapabilities = getTemplateRequiredCapabilities(template);
  const hasPlanAccess = planSatisfiesTemplateCapabilities(
    access.limits,
    requiredCapabilities,
  );
  const minimumPlan = getMinimumPlanForTemplate(template, activePlans);
  const formLimitReached = isFormLimitReached(access);
  const featureBadges = getTemplateRequirementBadges(template);

  if (formLimitReached) {
    return {
      canCreate: false,
      hasPlanAccess,
      isTrialAvailable: false,
      isTrialCreation: false,
      trialExpired: false,
      trialUsed: false,
      formLimitReached: true,
      ctaLabel: "Form limit reached",
      message: "Your form limit has been reached. Upgrade to create more forms.",
      minimumPlanName: minimumPlan?.name ?? null,
      minimumPlanSlug: minimumPlan?.slug ?? null,
      requiredCapabilities,
      featureBadges,
    };
  }

  if (hasPlanAccess) {
    return {
      canCreate: true,
      hasPlanAccess: true,
      isTrialAvailable: false,
      isTrialCreation: false,
      trialExpired: false,
      trialUsed: false,
      formLimitReached: false,
      ctaLabel: "Use Template",
      message: "Included in your current access.",
      minimumPlanName: minimumPlan?.name ?? null,
      minimumPlanSlug: minimumPlan?.slug ?? null,
      requiredCapabilities,
      featureBadges,
    };
  }

  const missingRequirement = getMissingRequirementMessage(
    access.limits,
    requiredCapabilities,
  );
  const requiredPlanText = minimumPlan?.name
    ? `This workflow template requires features included in ${minimumPlan.name}.`
    : `This workflow template requires ${missingRequirement}.`;

  return {
    canCreate: false,
    hasPlanAccess: false,
    isTrialAvailable: false,
    isTrialCreation: false,
    trialExpired: false,
    trialUsed: false,
    formLimitReached: false,
    ctaLabel: minimumPlan?.name ? `Upgrade to ${minimumPlan.name}` : "Upgrade",
    message: requiredPlanText,
    minimumPlanName: minimumPlan?.name ?? null,
    minimumPlanSlug: minimumPlan?.slug ?? null,
    requiredCapabilities,
    featureBadges,
  };
}
