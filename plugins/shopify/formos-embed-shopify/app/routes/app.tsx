import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useMemo, useState } from "react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  FormLayout,
  InlineStack,
  Layout,
  Link,
  Page,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import prisma from "~/db.server";
import {
  saveFormosConnection,
  testSavedConnection,
  type FormosFormSummary,
} from "~/formos.server";
import { authenticate } from "~/shopify.server";

type ActionData = {
  status: "success" | "error";
  message: string;
  forms?: FormosFormSummary[];
};

function serializeConnection(
  connection: {
    formosBaseUrl: string;
    connectedAt: Date;
    lastTestedAt: Date | null;
    lastError: string | null;
  } | null,
) {
  return connection
    ? {
        ...connection,
        connectedAt: connection.connectedAt.toISOString(),
        lastTestedAt: connection.lastTestedAt?.toISOString() ?? null,
      }
    : null;
}

async function getConnection(shop: string) {
  return prisma.formosConnection.findUnique({
    where: { shop },
    select: {
      formosBaseUrl: true,
      connectedAt: true,
      lastTestedAt: true,
      lastError: true,
    },
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  let connection = await getConnection(session.shop);
  let forms: FormosFormSummary[] = [];
  let loadMessage: ActionData | null = null;

  if (connection) {
    try {
      forms = await testSavedConnection(session.shop);
      loadMessage = {
        status: "success",
        message: `Connected to FormOS. ${forms.length} published form${forms.length === 1 ? "" : "s"} available.`,
      };
    } catch (error) {
      loadMessage = {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to refresh FormOS forms.",
      };
    }

    connection = await getConnection(session.shop);
  }

  return json({
    shop: session.shop,
    connection: serializeConnection(connection),
    forms,
    loadMessage,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  try {
    if (intent === "save") {
      await saveFormosConnection({
        shop: session.shop,
        formosBaseUrl: String(formData.get("formosBaseUrl") ?? ""),
        formosApiToken: String(formData.get("formosApiToken") ?? ""),
      });
      const forms = await testSavedConnection(session.shop);

      return json<ActionData>({
        status: "success",
        message: `FormOS connection saved and ${forms.length} published form${forms.length === 1 ? "" : "s"} loaded. The API token is stored securely and hidden.`,
        forms,
      });
    }

    if (intent === "test" || intent === "fetch") {
      const forms = await testSavedConnection(session.shop);

      return json<ActionData>({
        status: "success",
        message:
          intent === "test"
            ? `Connected to FormOS. ${forms.length} published form${forms.length === 1 ? "" : "s"} available.`
            : `Fetched ${forms.length} published form${forms.length === 1 ? "" : "s"} from FormOS.`,
        forms,
      });
    }

    return json<ActionData>(
      { status: "error", message: "Unknown action." },
      { status: 400 },
    );
  } catch (error) {
    return json<ActionData>(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to complete FormOS connection action.",
      },
      { status: 400 },
    );
  }
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function FormosEmbedApp() {
  const { connection, forms: loaderForms, loadMessage } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";
  const forms = actionData?.forms ?? loaderForms ?? [];
  const statusMessage = actionData ?? loadMessage;
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? "");
  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? forms[0] ?? null,
    [forms, selectedFormId],
  );
  const selectedEmbedUrl = selectedForm
    ? `${connection?.formosBaseUrl ?? "https://formos.com.au"}/embed/forms/${selectedForm.id}`
    : "";
  const selectedFormOptions = [
    { label: "Choose a published FormOS form", value: "" },
    ...forms.map((form) => ({
      label: `${form.title || "Untitled form"} (${form.mode})`,
      value: form.id,
    })),
  ];

  const formRows = forms.map((form) => [
    form.title,
    form.mode,
    <Badge tone={form.status === "PUBLISHED" ? "success" : undefined}>
      {form.status}
    </Badge>,
    formatDate(form.updatedAt),
    <code key={`${form.id}-id`}>{form.id}</code>,
    <Button
      key={`${form.id}-copy`}
      onClick={() => navigator.clipboard?.writeText(form.id)}
      size="slim"
    >
      Copy ID
    </Button>,
  ]);

  return (
    <Page title="FormOS Embed">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Connect FormOS
              </Text>
              <Text as="p" tone="subdued">
                Paste a FormOS API token to test the connection and fetch published
                forms. Tokens are hidden after saving and submissions still go
                directly to FormOS.
              </Text>
              {statusMessage ? (
                <Box
                  background={statusMessage.status === "success" ? "bg-surface-success" : "bg-surface-critical"}
                  borderRadius="300"
                  padding="300"
                >
                  <Text as="p">{statusMessage.message}</Text>
                </Box>
              ) : null}
              <Form method="post">
                <input name="intent" type="hidden" value="save" />
                <FormLayout>
                  <TextField
                    autoComplete="off"
                    label="FormOS Base URL"
                    name="formosBaseUrl"
                    defaultValue={connection?.formosBaseUrl ?? "https://formos.com.au"}
                    helpText="Example: https://formos.com.au"
                  />
                  <TextField
                    autoComplete="off"
                    label="FormOS API Token"
                    name="formosApiToken"
                    type="password"
                    placeholder={connection ? "Token saved. Paste a new token to replace it." : "Paste FormOS API token"}
                    helpText="Create this in FormOS Dashboard -> API Tokens. The saved token is not shown again."
                  />
                  <InlineStack gap="300">
                    <Button submit variant="primary" loading={isBusy && navigation.formData?.get("intent") === "save"}>
                      Save Connection
                    </Button>
                  </InlineStack>
                </FormLayout>
              </Form>
              <InlineStack gap="300">
                <Form method="post">
                  <input name="intent" type="hidden" value="test" />
                  <Button submit loading={isBusy && navigation.formData?.get("intent") === "test"}>
                    Test Connection
                  </Button>
                </Form>
                <Form method="post">
                  <input name="intent" type="hidden" value="fetch" />
                  <Button submit loading={isBusy && navigation.formData?.get("intent") === "fetch"}>
                    Refresh Forms
                  </Button>
                </Form>
              </InlineStack>
              <InlineStack gap="200">
                <Badge tone={connection?.lastError ? "critical" : connection ? "success" : undefined}>
                  {connection?.lastError ? "Connection needs attention" : connection ? "Connected" : "Not connected"}
                </Badge>
                <Text as="span" tone="subdued">
                  Connected: {formatDate(connection?.connectedAt)}
                </Text>
                <Text as="span" tone="subdued">
                  Last tested: {formatDate(connection?.lastTestedAt)}
                </Text>
              </InlineStack>
              {connection?.lastError ? (
                <Text as="p" tone="critical">
                  {connection.lastError}
                </Text>
              ) : null}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Setup steps
              </Text>
              <Text as="p">1. Create an API token in FormOS.</Text>
              <Text as="p">2. Paste the token here and save.</Text>
              <Text as="p">3. Forms load after saving and refresh whenever this page opens.</Text>
              <Text as="p">4. Choose a form below and copy the Form ID.</Text>
              <Text as="p">5. Add the FormOS Form block in Theme Editor and paste the Base URL/Form ID.</Text>
              <Link url="https://formos.com.au/dashboard/settings/api-tokens" target="_blank">
                Open FormOS API Tokens
              </Link>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Published FormOS forms
              </Text>
              {forms.length > 0 ? (
                <Card>
                  <BlockStack gap="300">
                    <Select
                      label="Choose form for Shopify Theme Editor"
                      options={selectedFormOptions}
                      value={selectedForm?.id ?? selectedFormId}
                      onChange={setSelectedFormId}
                      helpText="Shopify theme block settings cannot load live external dropdowns, so choose the form here and paste the ID into the FormOS Form block."
                    />
                    {selectedForm ? (
                      <InlineStack gap="300" align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text as="p">
                            <strong>{selectedForm.title}</strong>
                          </Text>
                          <Text as="p" tone="subdued">
                            Form ID: <code>{selectedForm.id}</code>
                          </Text>
                          <Text as="p" tone="subdued">
                            Embed URL: <code>{selectedEmbedUrl}</code>
                          </Text>
                        </BlockStack>
                        <InlineStack gap="200">
                          <Button onClick={() => navigator.clipboard?.writeText(selectedForm.id)}>
                            Copy Form ID
                          </Button>
                          <Button onClick={() => navigator.clipboard?.writeText(connection?.formosBaseUrl ?? "https://formos.com.au")}>
                            Copy Base URL
                          </Button>
                        </InlineStack>
                      </InlineStack>
                    ) : null}
                  </BlockStack>
                </Card>
              ) : null}
              {forms.length > 0 ? (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text", "text"]}
                  headings={["Title", "Mode", "Status", "Updated", "Form ID", "Copy"]}
                  rows={formRows}
                />
              ) : (
                <Text as="p" tone="subdued">
                  Save a valid FormOS API token to load published forms. Connected stores also refresh forms each time this page opens.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
