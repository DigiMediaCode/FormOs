import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const connection = await prisma.formosConnection.findUnique({
    where: { shop: session.shop },
    select: {
      formosBaseUrl: true,
      connectedAt: true,
      lastTestedAt: true,
      lastError: true,
    },
  });

  return json({
    shop: session.shop,
    connection: connection
      ? {
          ...connection,
          connectedAt: connection.connectedAt.toISOString(),
          lastTestedAt: connection.lastTestedAt?.toISOString() ?? null,
        }
      : null,
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

      return json<ActionData>({
        status: "success",
        message: "FormOS connection saved. The API token is stored securely and hidden.",
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
  const { connection } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";
  const forms = actionData?.forms ?? [];

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
      Copy Form ID
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
              {actionData ? (
                <Box
                  background={actionData.status === "success" ? "bg-surface-success" : "bg-surface-critical"}
                  borderRadius="300"
                  padding="300"
                >
                  <Text as="p">{actionData.message}</Text>
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
                    Fetch Forms
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
              <Text as="p">3. Test the connection.</Text>
              <Text as="p">4. Fetch forms and copy a Form ID.</Text>
              <Text as="p">5. Add the FormOS Form block in Theme Editor.</Text>
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
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text", "text"]}
                  headings={["Title", "Mode", "Status", "Updated", "Form ID", "Action"]}
                  rows={formRows}
                />
              ) : (
                <Text as="p" tone="subdued">
                  Click Fetch Forms after saving a valid FormOS API token.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
