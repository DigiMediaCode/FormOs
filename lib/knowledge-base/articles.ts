import "server-only";

import { prisma } from "@/lib/prisma";

export const KB_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type KbStatus = (typeof KB_STATUSES)[number];

export const DEFAULT_KB_CATEGORIES = [
  "Getting Started",
  "Forms & Builder",
  "Healthcare Admin",
  "File Uploads",
  "Signatures & PDFs",
  "Billing & Plans",
  "Account & Security",
  "Team & Staff",
] as const;

type DefaultKbArticle = {
  category: (typeof DEFAULT_KB_CATEGORIES)[number];
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  isFeatured?: boolean;
  sortOrder?: number;
};

const DEFAULT_KB_CATEGORY_DETAILS: Record<
  (typeof DEFAULT_KB_CATEGORIES)[number],
  { description: string; sortOrder: number }
> = {
  "Getting Started": {
    description:
      "Start using FormOS, create your first form, publish it, and share it with customers.",
    sortOrder: 10,
  },
  "Forms & Builder": {
    description:
      "Learn how to add fields, arrange forms, use templates, and control public and office-only fields.",
    sortOrder: 20,
  },
  "Healthcare Admin": {
    description:
      "Use FormOS safely for healthcare administrative workflows such as appointment requests, intake, consent acknowledgements, and office review.",
    sortOrder: 25,
  },
  "File Uploads": {
    description:
      "Understand how Google Drive and Dropbox uploads work for public form submissions.",
    sortOrder: 30,
  },
  "Signatures & PDFs": {
    description:
      "Use signatures, initials, office completion, and completed PDF delivery.",
    sortOrder: 40,
  },
  "Billing & Plans": {
    description:
      "Manage plans, limits, Stripe billing, subscriptions, and account usage.",
    sortOrder: 50,
  },
  "Account & Security": {
    description:
      "Manage login, email verification, password reset, account security, and safe public forms.",
    sortOrder: 60,
  },
  "Team & Staff": {
    description:
      "Invite staff, manage team access, and understand workspace permissions.",
    sortOrder: 70,
  },
};

export const DEFAULT_KB_ARTICLES: DefaultKbArticle[] = [
  {
    category: "Getting Started",
    title: "What is FormOS?",
    slug: "what-is-formos",
    excerpt:
      "FormOS helps businesses build online forms, agreements, file upload workflows, and completed PDFs.",
    isFeatured: true,
    sortOrder: 10,
    content: `<h2>What FormOS does</h2>
<p>FormOS is a form and agreement platform for collecting customer information, signatures, file uploads, and office-use follow-up fields in one workflow.</p>
<p>You can create a form, share a public link or QR code, receive submissions, complete internal office fields, and send a completed PDF to the form owner and submitter.</p>
<h2>Common uses</h2>
<ul>
  <li>Vehicle hire agreements</li>
  <li>Client intake forms</li>
  <li>Consent forms</li>
  <li>Document collection</li>
  <li>Staff onboarding</li>
  <li>Service agreements</li>
</ul>`,
  },
  {
    category: "Getting Started",
    title: "How do I create my first form?",
    slug: "how-to-create-your-first-form",
    excerpt:
      "Create a blank form or start from a template, then add the fields your customer needs to complete.",
    isFeatured: true,
    sortOrder: 20,
    content: `<h2>Create a form</h2>
<ol>
  <li>Go to Dashboard.</li>
  <li>Open Forms.</li>
  <li>Select New Form.</li>
  <li>Choose a blank form or a template if one is available.</li>
  <li>Add fields in the builder and save your changes.</li>
</ol>
<p>After creating the form, use the builder to add text fields, dropdowns, checkboxes, file uploads, signatures, initials, section headings, and office-use fields.</p>`,
  },
  {
    category: "Getting Started",
    title: "How do I publish and share a form?",
    slug: "how-to-publish-and-share-a-form",
    excerpt:
      "Publish the form, then share its public link or QR code with customers.",
    isFeatured: true,
    sortOrder: 30,
    content: `<h2>Publishing a form</h2>
<p>A form must be published before public users can access and submit it. Draft and archived forms are not available publicly.</p>
<ol>
  <li>Open the form detail page from your dashboard.</li>
  <li>Publish the form.</li>
  <li>Copy the public link or download the QR code.</li>
  <li>Share the link or QR code with your customer.</li>
</ol>
<p>If the form contains file upload fields, make sure Google Drive or Dropbox is connected and selected as the active storage provider before sharing.</p>`,
  },
  {
    category: "Getting Started",
    title: "Why is my public form unavailable?",
    slug: "why-is-my-public-form-unavailable",
    excerpt:
      "A public form may be unavailable if it is draft, archived, missing, or blocked by plan/storage requirements.",
    sortOrder: 40,
    content: `<h2>Common reasons</h2>
<ul>
  <li>The form is still in Draft status.</li>
  <li>The form has been archived.</li>
  <li>The public link is incorrect.</li>
  <li>The form owner account is suspended.</li>
  <li>The form uses features not available on the current plan.</li>
</ul>
<p>Open the form detail page in your dashboard and confirm that the status is Published.</p>`,
  },
  {
    category: "Forms & Builder",
    title: "What field types does FormOS support?",
    slug: "what-field-types-does-formos-support",
    excerpt:
      "FormOS supports text, long text, email, phone, address, dates, numbers, dropdowns, uploads, signatures, initials, and display content.",
    isFeatured: true,
    sortOrder: 10,
    content: `<h2>Supported field types</h2>
<ul>
  <li>Text and long text</li>
  <li>Email, phone, and address</li>
  <li>Date, number, and currency</li>
  <li>Dropdown and checkbox</li>
  <li>File upload</li>
  <li>Signature and initials</li>
  <li>Static text, section heading, and HTML content</li>
</ul>
<p>Available field types may depend on your subscription plan and any custom quota overrides applied by Super Admin.</p>`,
  },
  {
    category: "Forms & Builder",
    title: "What are Office Use Only fields?",
    slug: "what-are-office-use-only-fields",
    excerpt:
      "Office Use Only fields are hidden from public submitters and completed later by the form owner or permitted staff.",
    isFeatured: true,
    sortOrder: 20,
    content: `<h2>How Office Use Only fields work</h2>
<p>Office Use Only fields are internal fields. They do not appear on the public form and cannot be filled by the public submitter.</p>
<p>After a submission is received, the form owner or permitted workspace staff can fill these internal fields from the submission detail page.</p>
<h2>Examples</h2>
<ul>
  <li>Internal approval notes</li>
  <li>Vehicle inspection details</li>
  <li>Staff review outcome</li>
  <li>Office completion checks</li>
</ul>`,
  },
  {
    category: "Forms & Builder",
    title: "Can I reorder fields in the builder?",
    slug: "can-i-reorder-fields-in-the-builder",
    excerpt:
      "Yes. The builder supports field ordering and compact editing so forms can be arranged naturally.",
    sortOrder: 30,
    content: `<p>Yes. In the form builder, fields can be moved and arranged into the order you want customers to complete them.</p>
<p>The public form renders fields in the order saved in the builder. Office-only fields remain hidden from public users even if they are placed among public fields.</p>`,
  },
  {
    category: "Forms & Builder",
    title: "How do templates work?",
    slug: "how-do-templates-work",
    excerpt:
      "Templates create a ready-made draft form that can be edited before publishing.",
    sortOrder: 40,
    content: `<h2>Using templates</h2>
<p>Templates help you start faster by creating a draft form with prebuilt fields and settings.</p>
<p>For example, the Vehicle Hire Agreement template includes customer details, file upload fields, agreement content, signatures, initials, and office-use fields.</p>
<p>After creating a form from a template, you can edit it in the builder before publishing.</p>`,
  },
  {
    category: "Healthcare Admin",
    title: "Using FormOS for healthcare admin workflows",
    slug: "using-formos-for-healthcare-admin-workflows",
    excerpt:
      "How healthcare providers can use FormOS for appointment requests, intake forms, consent acknowledgements, uploads, signatures, and PDF workflows safely.",
    isFeatured: true,
    sortOrder: 10,
    content: `<h2>What FormOS can support</h2>
<p>FormOS supports administrative workflow forms for healthcare and service businesses. Examples include GP appointment requests, new patient intake forms, consent acknowledgements, document uploads, signatures, office review fields, and completed PDF records.</p>
<h2>Important limitations</h2>
<p>FormOS is not an emergency medical service, electronic medical record system, practice management system, Medicare billing system, or substitute for professional clinical advice.</p>
<p>If this is an emergency in Australia, call 000.</p>
<h2>Privacy responsibilities</h2>
<p>Form owners decide what information their forms collect. Healthcare providers should review each form before publishing and make sure they have the required consent, authority, and legal basis for the information they request.</p>
<p>Templates are starting points and should be reviewed and configured by the healthcare provider before use.</p>
<h2>Storage and PDF workflows</h2>
<p>Where the owner's plan and integration settings allow it, uploaded files can be routed to Google Drive or Dropbox. FormOS can also generate completed PDFs for administrative follow-up workflows where PDF generation is available.</p>
<h2>Safe setup tips</h2>
<ul>
  <li>Use clear emergency wording on appointment request forms.</li>
  <li>Avoid collecting unnecessary clinical detail in general admin forms.</li>
  <li>Use Office Use Only fields for staff review notes that should not appear publicly.</li>
  <li>Review consent and privacy wording with the healthcare provider before publishing.</li>
</ul>`,
  },
  {
    category: "File Uploads",
    title: "How do file uploads work?",
    slug: "how-do-file-uploads-work",
    excerpt:
      "Uploaded files are sent to the form owner's connected storage provider, not permanently stored on the FormOS server.",
    isFeatured: true,
    sortOrder: 10,
    content: `<h2>Where uploaded files go</h2>
<p>When a public user uploads a file, FormOS sends the file to the form owner's active storage provider.</p>
<p>FormOS does not permanently store uploaded file binaries on its server. Submission records store safe metadata such as file name, MIME type, size, provider, and folder/path information.</p>
<h2>Supported providers</h2>
<ul>
  <li>Google Drive</li>
  <li>Dropbox</li>
</ul>`,
  },
  {
    category: "File Uploads",
    title: "How do Google Drive uploads work?",
    slug: "how-do-google-drive-uploads-work",
    excerpt:
      "Connect Google Drive, choose it as the active provider, and FormOS routes public uploads into organized folders.",
    sortOrder: 20,
    content: `<h2>Google Drive setup</h2>
<ol>
  <li>Go to Settings / Integrations.</li>
  <li>Connect Google Drive.</li>
  <li>Configure the upload folder if needed.</li>
  <li>Set Google Drive as the active upload provider.</li>
</ol>
<p>When active, uploads are organized by form and submission so files are easier to find.</p>`,
  },
  {
    category: "File Uploads",
    title: "How do Dropbox uploads work?",
    slug: "how-do-dropbox-uploads-work",
    excerpt:
      "Connect Dropbox, configure a parent folder path, and set Dropbox as the active upload provider.",
    sortOrder: 30,
    content: `<h2>Dropbox setup</h2>
<ol>
  <li>Go to Settings / Integrations.</li>
  <li>Connect Dropbox.</li>
  <li>Enter a parent folder path, such as /FormOS Uploads.</li>
  <li>Set Dropbox as the active upload provider.</li>
</ol>
<p>Dropbox paths are normalized and path traversal is blocked for safety.</p>`,
  },
  {
    category: "File Uploads",
    title: "Why can public users not upload files?",
    slug: "why-can-public-users-not-upload-files",
    excerpt:
      "File uploads require an active connected storage provider and a plan that allows upload fields.",
    sortOrder: 40,
    content: `<h2>Check these items</h2>
<ul>
  <li>Google Drive or Dropbox is connected.</li>
  <li>An active upload provider is selected.</li>
  <li>Your plan allows file upload fields.</li>
  <li>The uploaded file type and size are allowed.</li>
</ul>
<p>If storage is unavailable, the public form shows a clear unavailable message for upload fields.</p>`,
  },
  {
    category: "Signatures & PDFs",
    title: "How do signatures and initials work?",
    slug: "how-do-signatures-and-initials-work",
    excerpt:
      "Public users can draw signatures and initials on desktop or mobile, and each signature field saves separately.",
    isFeatured: true,
    sortOrder: 10,
    content: `<h2>Signature capture</h2>
<p>Signature and initials fields allow public users to draw directly on the form using a mouse, trackpad, or phone screen.</p>
<p>Each signature or initials field saves its own image data separately in the submission, so agreements can contain multiple signature fields.</p>`,
  },
  {
    category: "Signatures & PDFs",
    title: "What does Use First Signature do?",
    slug: "what-does-use-first-signature-do",
    excerpt:
      "On forms with multiple signature fields, later fields can copy the first signature while remaining editable.",
    sortOrder: 20,
    content: `<p>If a form has multiple signature fields, later signature fields may show a Use first signature button.</p>
<p>When clicked, FormOS copies the first signature into that field. The copied field is still editable: the user can clear it and draw a different signature if needed.</p>
<p>Copied signatures count as valid for required signature validation.</p>`,
  },
  {
    category: "Signatures & PDFs",
    title: "How do completed PDFs work?",
    slug: "how-do-completed-pdfs-work",
    excerpt:
      "When a submission is finalized, FormOS generates a clean completed PDF and emails it to the owner and submitter when possible.",
    isFeatured: true,
    sortOrder: 30,
    content: `<h2>Completed PDF delivery</h2>
<p>After office fields are completed, the owner can finalize the submission. FormOS generates a completed PDF using the submitted public answers, office-use answers, signatures, and initials.</p>
<p>The completed PDF is emailed to the form owner and to the submitter if FormOS can detect a valid submitter email from the public form data.</p>
<p>Uploaded images or documents are not embedded into the completed PDF.</p>`,
  },
  {
    category: "Signatures & PDFs",
    title: "Can I download a completed PDF?",
    slug: "can-i-download-a-completed-pdf",
    excerpt:
      "Form owners can download completed PDFs from the submission detail page when the workflow allows it.",
    sortOrder: 40,
    content: `<p>Yes. The form owner can use the Download Completed PDF option from the submission detail page when available.</p>
<p>Generated PDFs are created on demand and are not permanently stored by FormOS.</p>`,
  },
  {
    category: "Billing & Plans",
    title: "How do plans and limits work?",
    slug: "how-do-plans-and-limits-work",
    excerpt:
      "Plans control limits such as forms, submissions, storage features, PDF generation, team access, and field types.",
    isFeatured: true,
    sortOrder: 10,
    content: `<h2>Plan limits</h2>
<p>FormOS plans can control feature availability and usage limits. Examples include form count, monthly submissions, field types, file uploads, completed PDFs, custom branding, and team members.</p>
<p>Super Admin can also grant custom quota overrides. Overrides win over normal plan limits.</p>`,
  },
  {
    category: "Billing & Plans",
    title: "How do I manage my subscription?",
    slug: "how-do-i-manage-my-subscription",
    excerpt:
      "Use Billing settings to view your plan, start Stripe Checkout, or open the Stripe Customer Portal.",
    sortOrder: 20,
    content: `<h2>Billing settings</h2>
<p>Go to Settings / Billing to view your current plan, subscription status, usage summary, and available plans.</p>
<p>Paid subscriptions use Stripe-hosted Checkout and Stripe Customer Portal. FormOS does not store card details or payment method data.</p>`,
  },
  {
    category: "Billing & Plans",
    title: "What happens if payment is past due or canceled?",
    slug: "what-happens-if-payment-is-past-due-or-canceled",
    excerpt:
      "Past due subscriptions keep access temporarily with a warning; canceled subscriptions may fall back to Free limits.",
    sortOrder: 30,
    content: `<p>If a subscription is past due, FormOS may show a billing warning and ask you to update billing details in Stripe Customer Portal.</p>
<p>If a subscription is canceled and no valid billing period remains, the account may fall back to Free plan limits unless a Super Admin override applies.</p>`,
  },
  {
    category: "Billing & Plans",
    title: "What are custom quota overrides?",
    slug: "what-are-custom-quota-overrides",
    excerpt:
      "Custom quota overrides are Super Admin-granted limits that take priority over the normal plan.",
    sortOrder: 40,
    content: `<p>Custom quota overrides allow Super Admin to adjust limits for a specific user. This can include extra forms, extra submissions, additional features, or unlimited access.</p>
<p>Overrides are respected even if a Stripe subscription changes. User override wins over plan limits.</p>`,
  },
  {
    category: "Account & Security",
    title: "How do I verify my email?",
    slug: "how-do-i-verify-my-email",
    excerpt:
      "Use the verification email sent during signup, or resend verification from the dashboard when available.",
    sortOrder: 10,
    content: `<p>After signup, FormOS sends an email verification link. Open the link to verify your account email.</p>
<p>If you cannot find the email, check spam or junk folders. If a resend option is available on your dashboard, use it to send a fresh verification email.</p>`,
  },
  {
    category: "Account & Security",
    title: "How do I reset my password?",
    slug: "how-do-i-reset-my-password",
    excerpt:
      "Use Forgot Password to receive a one-time password reset link.",
    sortOrder: 20,
    content: `<ol>
  <li>Open the login page.</li>
  <li>Select Forgot password.</li>
  <li>Enter your email address.</li>
  <li>Open the reset link from your email.</li>
  <li>Create a new password.</li>
</ol>
<p>Password reset tokens are stored as hashes, expire, and are one-time use.</p>`,
  },
  {
    category: "Account & Security",
    title: "Can I sign in with Google or Lark?",
    slug: "can-i-sign-in-with-google-or-lark",
    excerpt:
      "FormOS supports email/password login and OAuth login with Google and Lark when configured.",
    sortOrder: 30,
    content: `<p>Yes. If OAuth is configured, you can sign in with Google or Lark.</p>
<p>Google login is separate from Google Drive storage. Connecting Google Drive for uploads is done from Settings / Integrations.</p>
<p>Lark login is separate from the Lark Mail email notification provider.</p>`,
  },
  {
    category: "Account & Security",
    title: "Is submitted data public?",
    slug: "is-submitted-data-public",
    excerpt:
      "No. Public users can submit forms, but dashboard submissions are visible only to the owner or permitted workspace roles.",
    isFeatured: true,
    sortOrder: 40,
    content: `<p>No. Submission data is not publicly listed.</p>
<p>Only the form owner and permitted workspace members can access submissions in the dashboard. Public form pages do not expose owner private data, storage tokens, OAuth tokens, or private submission answers.</p>`,
  },
  {
    category: "Team & Staff",
    title: "How do I invite staff members?",
    slug: "how-do-i-invite-staff-members",
    excerpt:
      "Business or custom-allowed users can invite staff from Team settings.",
    sortOrder: 10,
    content: `<ol>
  <li>Go to Settings / Team.</li>
  <li>Enter the staff member email address.</li>
  <li>Select Admin or Staff role.</li>
  <li>Send the invite.</li>
</ol>
<p>The invite recipient must accept the invite using the same email address.</p>`,
  },
  {
    category: "Team & Staff",
    title: "What can Admin and Staff users do?",
    slug: "what-can-admin-and-staff-users-do",
    excerpt:
      "Owner, Admin, and Staff roles have different permissions in a workspace.",
    isFeatured: true,
    sortOrder: 20,
    content: `<h2>Owner</h2>
<p>The workspace owner has full access, including billing, integrations, team settings, forms, and submissions.</p>
<h2>Admin</h2>
<p>Admins can manage forms and submissions where allowed, including office fields and finalization workflows.</p>
<h2>Staff</h2>
<p>Staff can access permitted forms/submissions and complete office work where allowed. Staff cannot manage billing, integrations, team settings, or Super Admin areas.</p>`,
  },
  {
    category: "Team & Staff",
    title: "Why can I not see Team settings?",
    slug: "why-can-i-not-see-team-settings",
    excerpt:
      "Team access depends on your plan and workspace role.",
    sortOrder: 30,
    content: `<p>Team settings are owner-only and require a plan or custom override that allows team members.</p>
<p>If you are a staff member, Team settings are hidden because only the workspace owner can invite, remove, or change staff roles.</p>`,
  },
];

const RESERVED_KB_SLUGS = new Set([
  "admin",
  "dashboard",
  "login",
  "signup",
  "api",
  "f",
  "p",
  "blog",
  "pricing",
  "privacy-policy",
  "terms-of-service",
  "data-security",
  "contact",
  "help",
]);

const BLOCKED_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
];

export function slugifyKbTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeKbSlug(input: string, fallback: string) {
  return slugifyKbTitle(input.trim() || fallback);
}

export function validateKbSlug(slug: string) {
  if (!slug) {
    return "Slug is required.";
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug can only use lowercase letters, numbers, and hyphens.";
  }

  if (slug.includes("--")) {
    return "Slug cannot contain repeated hyphens.";
  }

  if (RESERVED_KB_SLUGS.has(slug)) {
    return "This slug is reserved. Please choose another slug.";
  }

  return null;
}

export async function assertKbCategorySlugAvailable(
  slug: string,
  categoryId?: string,
) {
  const existing = await prisma.kbCategory.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== categoryId) {
    throw new Error("A knowledge base category with this slug already exists.");
  }
}

export async function assertKbArticleSlugAvailable(
  slug: string,
  articleId?: string,
) {
  const existing = await prisma.kbArticle.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== articleId) {
    throw new Error("A knowledge base article with this slug already exists.");
  }
}

export function sanitizeKbHtml(content: string) {
  let safe = content;

  for (const tag of BLOCKED_TAGS) {
    safe = safe.replace(
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"),
      "",
    );
    safe = safe.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }

  safe = safe
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]*/gi, "");

  return safe;
}

export function renderKbContent(content: string | null | undefined) {
  const source = content?.trim();

  if (!source) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(source)) {
    return sanitizeKbHtml(source);
  }

  return source
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

export async function seedDefaultKbCategoriesIfMissing() {
  await seedDefaultKbContentIfMissing({ includeArticles: false });
}

export async function seedDefaultKbContentIfMissing({
  includeArticles = true,
}: {
  includeArticles?: boolean;
} = {}) {
  const categoryByName = new Map<string, { id: string; slug: string }>();

  for (const name of DEFAULT_KB_CATEGORIES) {
    const slug = slugifyKbTitle(name);
    const details = DEFAULT_KB_CATEGORY_DETAILS[name];

    const category = await prisma.kbCategory.upsert({
      where: { slug },
      update: {
        description: details.description,
        sortOrder: details.sortOrder,
      },
      create: {
        name,
        slug,
        description: details.description,
        status: "PUBLISHED",
        sortOrder: details.sortOrder,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    categoryByName.set(name, category);
  }

  if (!includeArticles) {
    return;
  }

  for (const article of DEFAULT_KB_ARTICLES) {
    const category = categoryByName.get(article.category);

    if (!category) {
      continue;
    }

    await prisma.kbArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        status: "PUBLISHED",
        categoryId: category.id,
        sortOrder: article.sortOrder ?? 0,
        isFeatured: article.isFeatured ?? false,
        metaTitle: article.title,
        metaDescription: article.excerpt,
        publishedAt: new Date(),
      },
    });
  }
}

export async function getPublishedKbCategories() {
  return prisma.kbCategory.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          articles: {
            where: {
              status: "PUBLISHED",
            },
          },
        },
      },
    },
  });
}

export async function getPublishedKbArticles({
  categorySlug,
  featured,
  q,
  take,
}: {
  categorySlug?: string;
  featured?: boolean;
  q?: string;
  take?: number;
} = {}) {
  const search = q?.trim();

  return prisma.kbArticle.findMany({
    where: {
      status: "PUBLISHED",
      ...(featured ? { isFeatured: true } : {}),
      ...(categorySlug
        ? {
            category: {
              slug: categorySlug,
              status: "PUBLISHED",
            },
          }
        : {
            category: {
              is: {
                status: "PUBLISHED",
              },
            },
          }),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { excerpt: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { publishedAt: "desc" },
      { updatedAt: "desc" },
    ],
    take,
    include: {
      category: true,
    },
  });
}

export async function getPublishedKbCategory(slug: string) {
  return prisma.kbCategory.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });
}

export async function getPublishedKbArticle(
  categorySlug: string,
  articleSlug: string,
) {
  return prisma.kbArticle.findFirst({
    where: {
      slug: articleSlug,
      status: "PUBLISHED",
      category: {
        slug: categorySlug,
        status: "PUBLISHED",
      },
    },
    include: {
      category: true,
    },
  });
}

export function kbCategoryDataFromForm(
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeKbSlug(String(formData.get("slug") ?? ""), name);
  const status = String(formData.get("status") ?? "PUBLISHED").toUpperCase();
  const sortOrder = parseInteger(formData.get("sortOrder"));

  if (!name) {
    throw new Error("Name is required.");
  }

  const slugError = validateKbSlug(slug);

  if (slugError) {
    throw new Error(slugError);
  }

  if (!KB_STATUSES.includes(status as KbStatus)) {
    throw new Error("Invalid category status.");
  }

  return {
    name,
    slug,
    description: optionalString(formData.get("description")),
    status,
    sortOrder,
  };
}

export function kbArticleDataFromForm(
  formData: FormData,
  userId: string,
  existingArticleId?: string,
) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = normalizeKbSlug(String(formData.get("slug") ?? ""), title);
  const status = String(formData.get("status") ?? "DRAFT").toUpperCase();
  const categoryId = optionalString(formData.get("categoryId"));
  const sortOrder = parseInteger(formData.get("sortOrder"));
  const isFeatured = formData.get("isFeatured") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }

  const slugError = validateKbSlug(slug);

  if (slugError) {
    throw new Error(slugError);
  }

  if (!KB_STATUSES.includes(status as KbStatus)) {
    throw new Error("Invalid article status.");
  }

  const publishedAtInput = optionalString(formData.get("publishedAt"));
  const publishedAt =
    status === "PUBLISHED"
      ? publishedAtInput
        ? new Date(publishedAtInput)
        : new Date()
      : null;

  if (publishedAtInput && Number.isNaN(publishedAt?.getTime())) {
    throw new Error("Published at must be a valid date/time.");
  }

  return {
    data: {
      title,
      slug,
      excerpt: optionalString(formData.get("excerpt")),
      content: optionalString(formData.get("content")),
      status,
      sortOrder,
      isFeatured,
      metaTitle: optionalString(formData.get("metaTitle")),
      metaDescription: optionalString(formData.get("metaDescription")),
      publishedAt,
      updatedById: userId,
      ...(existingArticleId ? {} : { createdById: userId }),
      category: categoryId
        ? {
            connect: {
              id: categoryId,
            },
          }
        : existingArticleId
          ? {
              disconnect: true,
            }
          : undefined,
    },
    slug,
  };
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseInteger(value: FormDataEntryValue | null) {
  const number = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(number) ? number : 0;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
