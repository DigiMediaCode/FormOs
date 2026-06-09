import {useMemo, useState} from 'preact/hooks';

const DEFAULT_FORMOS_BASE_URL = 'https://formos.com.au';

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, '');
}

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function parseFormsResponse(body) {
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  return [];
}

export default function HomePage() {
  const [formosBaseUrl, setFormosBaseUrl] = useState(DEFAULT_FORMOS_BASE_URL);
  const [apiToken, setApiToken] = useState('');
  const [savedConnection, setSavedConnection] = useState(null);
  const [status, setStatus] = useState('Not connected');
  const [statusTone, setStatusTone] = useState('neutral');
  const [forms, setForms] = useState([]);
  const [loadingAction, setLoadingAction] = useState('');

  const normalizedBaseUrl = useMemo(
    () => normalizeBaseUrl(formosBaseUrl || DEFAULT_FORMOS_BASE_URL),
    [formosBaseUrl],
  );

  const canCallFormOS = Boolean(savedConnection?.formosBaseUrl && savedConnection?.apiToken);

  function setError(message) {
    setStatus(message);
    setStatusTone('critical');
  }

  function setSuccess(message) {
    setStatus(message);
    setStatusTone('success');
  }

  function validateInputs() {
    const baseUrl = normalizeBaseUrl(formosBaseUrl);
    const token = apiToken.trim();

    if (!baseUrl) {
      throw new Error('FormOS Base URL is required.');
    }

    let url;
    try {
      url = new URL(baseUrl);
    } catch {
      throw new Error('FormOS Base URL must be a valid URL.');
    }

    if (!['https:', 'http:'].includes(url.protocol)) {
      throw new Error('FormOS Base URL must start with https://.');
    }

    if (!token) {
      throw new Error('FormOS API Token is required.');
    }

    return {
      formosBaseUrl: url.origin,
      apiToken: token,
    };
  }

  async function fetchForms(connection) {
    const response = await fetch(`${connection.formosBaseUrl}/api/external/forms`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${connection.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        response.status === 401
          ? 'FormOS rejected this API token. Create a new token in FormOS and try again.'
          : `FormOS returned status ${response.status}.`,
      );
    }

    const body = await response.json();
    return parseFormsResponse(body);
  }

  function saveConnection() {
    try {
      const nextConnection = validateInputs();
      setSavedConnection(nextConnection);
      setFormosBaseUrl(nextConnection.formosBaseUrl);
      setApiToken('');
      setForms([]);
      setSuccess('Connection saved in this app session. Token is hidden after save.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save connection.');
    }
  }

  async function testConnection() {
    const connection = savedConnection;

    if (!connection) {
      setError('Save your FormOS connection before testing.');
      return;
    }

    setLoadingAction('test');
    try {
      const fetchedForms = await fetchForms(connection);
      setSuccess(`Connected to FormOS. ${fetchedForms.length} published form${fetchedForms.length === 1 ? '' : 's'} available.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect to FormOS.');
    } finally {
      setLoadingAction('');
    }
  }

  async function fetchFormList() {
    const connection = savedConnection;

    if (!connection) {
      setError('Save your FormOS connection before fetching forms.');
      return;
    }

    setLoadingAction('fetch');
    try {
      const fetchedForms = await fetchForms(connection);
      setForms(fetchedForms);
      setSuccess(`Fetched ${fetchedForms.length} published form${fetchedForms.length === 1 ? '' : 's'} from FormOS.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to fetch FormOS forms.');
    } finally {
      setLoadingAction('');
    }
  }

  async function copyFormId(formId) {
    try {
      await navigator.clipboard.writeText(formId);
      setSuccess(`Copied Form ID: ${formId}`);
    } catch {
      setError('Copy failed. Select and copy the Form ID manually.');
    }
  }

  return (
    <s-page heading="FormOS Embed">
      <s-section slot="aside" heading="Setup steps">
        <s-stack gap="base">
          <s-paragraph>Step 1: Create an API token in FormOS Dashboard -&gt; API Tokens.</s-paragraph>
          <s-paragraph>Step 2: Paste FormOS Base URL and API token here.</s-paragraph>
          <s-paragraph>Step 3: Save and fetch forms.</s-paragraph>
          <s-paragraph>Step 4: Copy the Form ID.</s-paragraph>
          <s-paragraph>Step 5: Go to Shopify Theme Editor.</s-paragraph>
          <s-paragraph>Step 6: Add the FormOS Form app block.</s-paragraph>
          <s-paragraph>Step 7: Paste FormOS Base URL and Form ID, then save theme.</s-paragraph>
        </s-stack>
      </s-section>

      <s-section heading="Connect your FormOS account">
        <s-stack gap="base">
          <s-paragraph>
            Connect your FormOS account and fetch your published forms.
          </s-paragraph>

          <s-text-field
            label="FormOS Base URL"
            value={formosBaseUrl}
            placeholder={DEFAULT_FORMOS_BASE_URL}
            onInput={(event) => setFormosBaseUrl(event.currentTarget.value)}
          />

          <s-text-field
            label="FormOS API Token"
            value={apiToken}
            type="password"
            placeholder={savedConnection ? 'Token saved - paste a new token to replace it' : 'Paste your FormOS API token'}
            onInput={(event) => setApiToken(event.currentTarget.value)}
          />

          <s-stack direction="inline" gap="small">
            <s-button variant="primary" onClick={saveConnection}>
              Save Connection
            </s-button>
            <s-button disabled={!canCallFormOS || loadingAction === 'test'} onClick={testConnection}>
              {loadingAction === 'test' ? 'Testing...' : 'Test Connection'}
            </s-button>
            <s-button disabled={!canCallFormOS || loadingAction === 'fetch'} onClick={fetchFormList}>
              {loadingAction === 'fetch' ? 'Fetching...' : 'Fetch Forms'}
            </s-button>
          </s-stack>

          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack gap="small">
              <s-badge tone={statusTone}>{statusTone === 'success' ? 'Connected' : statusTone === 'critical' ? 'Error' : 'Not connected'}</s-badge>
              <s-paragraph>{status}</s-paragraph>
              {savedConnection && (
                <s-paragraph>
                  Saved for this session: {savedConnection.formosBaseUrl}. The token is hidden.
                </s-paragraph>
              )}
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Published FormOS forms" padding="none">
        {forms.length > 0 ? (
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Title</s-table-header>
              <s-table-header>Mode</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Updated</s-table-header>
              <s-table-header>Form ID</s-table-header>
              <s-table-header>Action</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {forms.map((form) => (
                <s-table-row key={form.id}>
                  <s-table-cell>{form.title || 'Untitled form'}</s-table-cell>
                  <s-table-cell>{form.mode || 'STANDARD'}</s-table-cell>
                  <s-table-cell>
                    <s-badge tone={form.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {form.status || 'UNKNOWN'}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>{formatDate(form.updatedAt)}</s-table-cell>
                  <s-table-cell>{form.id}</s-table-cell>
                  <s-table-cell>
                    <s-button onClick={() => copyFormId(form.id)}>Copy Form ID</s-button>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        ) : (
          <s-box padding="large" border="base" borderRadius="base">
            <s-stack gap="small" alignItems="center">
              <s-heading>No forms fetched yet</s-heading>
              <s-paragraph>
                Save your FormOS connection, then click Fetch Forms to list published forms.
              </s-paragraph>
              <s-paragraph>
                Current embed base URL preview: {normalizedBaseUrl}/embed/forms/FORM_ID
              </s-paragraph>
            </s-stack>
          </s-box>
        )}
      </s-section>
    </s-page>
  );
}