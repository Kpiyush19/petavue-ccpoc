import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/ui';
import { Input } from '@/ui';

const IntegrationDetailDatabase = ({
  connectionName,
  integrationDetail,
  handleTestConnection,
  handleDisconnection,
  index,
  updateConnection,
  removeConnection,
  datasourceRef,
}) => {
  const [host, setHost] = useState(integrationDetail.host);
  const [account, setAccount] = useState(integrationDetail.account);
  const [port, setPort] = useState(integrationDetail.port);
  const [datasource, setDataSource] = useState(integrationDetail.datasource);
  const [user, setUser] = useState(integrationDetail.user);
  const [password, setPassword] = useState(integrationDetail.password);
  const [warehouse, setWarehouse] = useState(integrationDetail.warehouse);
  const [schema, setSchema] = useState(integrationDetail.schema);
  const [region, setRegion] = useState(integrationDetail.region);
  const [database, setDatabase] = useState(integrationDetail.database);

  useEffect(() => {
    const newConnection = {
      host,
      port,
      datasource,
      user,
      password,
      database,
      account,
      warehouse,
      schema,
      region,
    };
    if (
      host?.trim() !== integrationDetail.host?.trim() ||
      port !== integrationDetail.port ||
      datasource?.trim() !== integrationDetail.datasource?.trim() ||
      user?.trim() !== integrationDetail.user?.trim() ||
      password?.trim() !== integrationDetail.password?.trim() ||
      database?.trim() !== integrationDetail.database?.trim() ||
      account?.trim() !== integrationDetail.account?.trim() ||
      warehouse?.trim() !== integrationDetail.warehouse?.trim() ||
      schema?.trim() !== integrationDetail.schema?.trim() ||
      region?.trim() !== integrationDetail.region?.trim()
    ) {
      updateConnection(newConnection, index);
    }
  }, [host, port, datasource, user, password, database, account, warehouse, schema, region]);

  const ActionButtons = ({ showDisconnect = true }) => (
    <div className="flex flex-col bg-white rounded-md p-4">
      <div className="flex gap-3 justify-end mt-9">
        {showDisconnect && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleDisconnection(integrationDetail.id)}
          >
            Disconnect
          </Button>
        )}
        <Button variant="primary" size="lg" onClick={() => handleTestConnection(integrationDetail.id)}>
          Test Connection
        </Button>
      </div>
    </div>
  );

  if (connectionName === 'Salesforce') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <Input
            type="text"
            label="Admin Name"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.admin_name}
          />
          <Input
            type="text"
            label="Service Account User"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.service_account_user}
          />
          <Input
            type="text"
            label="Org URL"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.org_url}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Gong') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-9">
            <Input
              type="text"
              label="Access Key*"
              placeholder="Access Key"
              disabled={!integrationDetail.enableEditing}
              value={integrationDetail.clientId}
            />
            <Input
              type="password"
              label="Access Key Secret*"
              disabled={!integrationDetail.enableEditing}
              placeholder="●●●●●●●●●●●●●●"
              value={integrationDetail.clientSecret}
            />
          </div>
          <Input
            type="text"
            label="API URL*"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.clientURL}
          />
          {!integrationDetail.enableEditing && <ActionButtons />}
        </div>
      </div>
    );
  }

  if (connectionName === 'Google Sheets' || connectionName === 'Google Analytics') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <Input
            type="text"
            label="Name"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.name}
          />
          <Input
            type="text"
            label="Email"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.email}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Slack') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <Input
            type="text"
            label="Workspace name"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.team_name}
          />
          {!integrationDetail.enableEditing && <ActionButtons />}
        </div>
      </div>
    );
  }

  if (connectionName === 'Marketo') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-9">
            <Input
              type="text"
              label="Client ID*"
              placeholder="Access Key"
              disabled={!integrationDetail.enableEditing}
              value={integrationDetail.clientId}
            />
            <Input
              type="password"
              label="Client Secret*"
              disabled={!integrationDetail.enableEditing}
              placeholder="●●●●●●●●●●●●●●"
              value={integrationDetail.clientSecret}
            />
          </div>
          <Input
            type="text"
            label="Client URL*"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.clientURL}
          />
          {!integrationDetail.enableEditing && <ActionButtons />}
        </div>
      </div>
    );
  }

  if (connectionName === 'Jira') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <Input
            type="text"
            label="API Token*"
            placeholder="Enter API Token"
            disabled={!integrationDetail.enableEditing}
            value="●●●●●●●●●●●●●●"
          />
          <div className="flex items-center gap-9">
            <Input
              type="text"
              label="Domain*"
              placeholder="Enter Domain"
              disabled={!integrationDetail.enableEditing}
              value={integrationDetail.domain}
            />
            <Input
              type="text"
              label="Email*"
              disabled={!integrationDetail.enableEditing}
              placeholder="Enter Email"
              value={integrationDetail.email}
            />
          </div>
          {!integrationDetail.enableEditing && <ActionButtons />}
        </div>
      </div>
    );
  }

  if (connectionName === 'Freshdesk') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6 px-3">
          <div className="flex items-center gap-9">
            <Input
              type="text"
              label="API Key*"
              placeholder="Enter API Key"
              disabled={!integrationDetail.enableEditing}
              value="●●●●●●●●●●●●●●"
            />
            <Input
              type="text"
              label="Freshdesk Domain*"
              placeholder="Enter Domain"
              disabled={!integrationDetail.enableEditing}
              value={integrationDetail.domain}
            />
          </div>
          {!integrationDetail.enableEditing && <ActionButtons />}
        </div>
      </div>
    );
  }

  if (connectionName === 'Aircall') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6 px-3">
          <div className="flex items-center gap-9">
            <Input
              type="text"
              label="API ID*"
              placeholder="Enter API ID"
              disabled={!integrationDetail.enableEditing}
              value={integrationDetail.apiId}
            />
            <Input
              type="text"
              label="API Token*"
              placeholder="Enter API Token"
              disabled={!integrationDetail.enableEditing}
              value="●●●●●●●●●●●●●●"
            />
          </div>
          {!integrationDetail.enableEditing && <ActionButtons />}
        </div>
      </div>
    );
  }

  if (connectionName === 'HubSpot') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <Input
            type="text"
            label="User"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.admin_name}
          />
          <Input
            type="text"
            label="Hubspot Domain"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.org_url}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Mixpanel') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <Input
            type="text"
            label="Username"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.username}
          />
          <Input
            type="text"
            label="Secret"
            disabled={!integrationDetail.enableEditing}
            value=""
            placeholder="●●●●●●●●●●●●●●"
          />
          <Input
            type="text"
            label="Project Id"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.projectId}
          />
          <Input
            type="text"
            label="Server Region"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail.serverRegion}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Apollo') {
    return (
      <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
        <div className="flex flex-col gap-6">
          <Input
            type="text"
            label="API Key"
            disabled={!integrationDetail.enableEditing}
            value={integrationDetail?.apiKey || ''}
            placeholder="●●●●●●●●●●●●●●"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${index === 0 ? '' : 'border-t border-[var(--color-grey-200)] pt-4'}`}>
      <div className="flex justify-between mb-6">
        <label className="block text-sm text-[var(--color-text-primary)]">Database {index + 1}</label>
        {integrationDetail.enableEditing && (
          <p
            className="flex items-center gap-2 cursor-pointer text-[var(--color-primary-500)]"
            onClick={() => removeConnection(index)}
          >
            <X />
            Remove
          </p>
        )}
      </div>
      <div className="flex flex-col gap-6">
        <Input
          inputRef={datasourceRef}
          type="text"
          label="Data Source*"
          placeholder="Short Description"
          disabled={!integrationDetail.enableEditing}
          value={datasource}
          onChange={(e) => setDataSource(e?.target.value)}
        />

        {connectionName === 'Snowflake' ? (
          <Input
            type="text"
            label="Account*"
            placeholder="Account"
            disabled={!integrationDetail.enableEditing}
            value={account}
            onChange={(e) => setAccount(e?.target.value)}
          />
        ) : (
          <div className="flex items-center gap-9">
            <Input
              type="text"
              label="Host*"
              placeholder="Host Name"
              disabled={!integrationDetail.enableEditing}
              value={host}
              onChange={(e) => setHost(e?.target.value)}
            />
            <Input
              type="number"
              label="Port*"
              placeholder="Enter Port number"
              disabled={!integrationDetail.enableEditing}
              value={port ?? undefined}
              onChange={(e) =>
                e?.target.value.trim() === ''
                  ? setPort(undefined)
                  : setPort(e?.target.value)
              }
            />
          </div>
        )}

        <div className="flex items-center gap-9">
          <Input
            type="text"
            label="User*"
            placeholder="User Name"
            disabled={!integrationDetail.enableEditing}
            value={user}
            onChange={(e) => setUser(e?.target.value)}
          />
          <Input
            type="text"
            label="Password*"
            disabled={!integrationDetail.enableEditing}
            placeholder="●●●●●●●●●●●●●●"
            value={password}
            onChange={(e) => setPassword(e?.target.value)}
          />
        </div>

        {connectionName === 'Snowflake' && (
          <>
            <div className="flex items-center gap-9">
              <Input
                type="text"
                label="Database*"
                placeholder="Enter database name"
                value={database}
                disabled={!integrationDetail.enableEditing}
                onChange={(e) => setDatabase(e?.target.value)}
              />
              <Input
                type="text"
                label="Warehouse*"
                placeholder="Enter warehouse name"
                value={warehouse}
                disabled={!integrationDetail.enableEditing}
                onChange={(e) => setWarehouse(e?.target.value)}
              />
            </div>
            <div className="flex items-center gap-9">
              <Input
                type="text"
                label="Schema"
                disabled={!integrationDetail.enableEditing}
                placeholder="Enter schema name"
                value={schema}
                onChange={(e) => setSchema(e?.target.value)}
              />
              <Input
                type="text"
                label="Region"
                disabled={!integrationDetail.enableEditing}
                placeholder="Enter region name"
                value={region}
                onChange={(e) => setRegion(e?.target.value)}
              />
            </div>
          </>
        )}

        {connectionName !== 'Snowflake' &&
          (connectionName === 'Postgres' ? (
            <div className="flex items-center gap-9">
              <Input
                type="text"
                label="Schema*"
                disabled={!integrationDetail.enableEditing}
                placeholder="Enter schema name"
                value={schema}
                onChange={(e) => setSchema(e?.target.value)}
              />
              <Input
                type="text"
                label="Database*"
                placeholder="Database name"
                disabled={!integrationDetail.enableEditing}
                value={database}
                onChange={(e) => setDatabase(e?.target.value)}
              />
            </div>
          ) : (
            <Input
              type="text"
              label="Database"
              placeholder="Database name"
              disabled={!integrationDetail.enableEditing}
              value={database}
              onChange={(e) => setDatabase(e?.target.value)}
            />
          ))}
      </div>

      {!integrationDetail.enableEditing && <ActionButtons />}
    </div>
  );
};

export default IntegrationDetailDatabase;
