import { useEffect, useState } from 'react';
import { X } from '@phosphor-icons/react';
import Input from '../../../../common-components/Input';

const IntegrationModalDatabase = ({
  index,
  connection,
  connectionName,
  removeConnection,
  updateConnection,
  datasourceRef,
  connecting,
}) => {
  const [host, setHost] = useState('');
  const [account, setAccount] = useState('');
  const [port, setPort] = useState('');
  const [datasource, setDataSource] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [schema, setSchema] = useState('');
  const [region, setRegion] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [clientURL, setClientUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [projectId, setProjectId] = useState('');
  const [serverRegion, setServerRegion] = useState('');

  useEffect(() => {
    if (connectionName === 'Postgres') setSchema('public');
  }, []);

  useEffect(() => {
    const newConnection =
      connectionName === 'Snowflake'
        ? { account, datasource, user, password, database, warehouse, schema, region }
        : connectionName === 'Marketo' || connectionName === 'Gong'
          ? { clientId, clientSecret, clientURL }
          : connectionName === 'Jira'
            ? { apiToken, domain, email }
            : connectionName === 'Freshdesk'
              ? { apiKey, domain }
              : connectionName === 'Aircall'
                ? { apiId, apiToken }
                : connectionName === 'Postgres'
                  ? { host, port: Number(port), datasource, user, password, schema, database }
                  : connectionName === 'Mixpanel'
                    ? { username, secret, projectId, serverRegion }
                    : connectionName === 'Apollo'
                      ? { apiKey }
                      : { host, port: Number(port), datasource, user, password, database };

    updateConnection(newConnection, index);
  }, [
    host, port, datasource, user, password, account, warehouse, schema, region,
    connectionName, database, index, clientId, clientSecret, clientURL, apiToken,
    apiId, apiKey, domain, email, username, secret, projectId, serverRegion,
  ]);

  if (connectionName === 'Gong') {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            label="Access Key*"
            placeholder="Enter user name"
            value={clientId}
            onChange={(e) => setClientId(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="password"
            label="Access Key Secret*"
            placeholder="••••••••••"
            value={clientSecret}
            onChange={(e) => setClientSecret(e?.target.value)}
            disabled={connecting}
          />
        </div>
        <Input
          type="text"
          label="API URL*"
          placeholder="Enter API URL"
          value={clientURL}
          onChange={(e) => setClientUrl(e?.target.value)}
          disabled={connecting}
        />
      </div>
    );
  }

  if (connectionName === 'Marketo') {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            label="Client ID*"
            placeholder="Enter Client ID"
            value={clientId}
            onChange={(e) => setClientId(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="password"
            label="Client Secret*"
            placeholder="••••••••••"
            value={clientSecret}
            onChange={(e) => setClientSecret(e?.target.value)}
            disabled={connecting}
          />
        </div>
        <Input
          type="text"
          label="Client URL*"
          placeholder="Enter Client URL"
          value={clientURL}
          onChange={(e) => setClientUrl(e?.target.value)}
          disabled={connecting}
        />
      </div>
    );
  }

  if (connectionName === 'Jira') {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <Input
          type="text"
          label="API Token*"
          placeholder="Enter API Token"
          value={apiToken}
          onChange={(e) => setApiToken(e?.target.value)}
          disabled={connecting}
        />
        <div className="flex items-center gap-4">
          <Input
            type="url"
            label="Domain*"
            placeholder="Enter Domain"
            value={domain}
            onChange={(e) => setDomain(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="email"
            label="Email*"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e?.target.value)}
            disabled={connecting}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Freshdesk') {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            label="API Key*"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="url"
            label="Freshdesk Domain*"
            placeholder="Enter Domain"
            value={domain}
            onChange={(e) => setDomain(e?.target.value)}
            disabled={connecting}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Aircall') {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            label="API ID*"
            placeholder="Enter API ID"
            value={apiId}
            onChange={(e) => setApiId(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="text"
            label="API Token*"
            placeholder="Enter API Token"
            value={apiToken}
            onChange={(e) => setApiToken(e?.target.value)}
            disabled={connecting}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Mixpanel') {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            label="Username*"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="text"
            label="Secret*"
            placeholder="Enter Secret"
            value={secret}
            onChange={(e) => setSecret(e?.target.value)}
            disabled={connecting}
          />
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="text"
            label="Project ID*"
            placeholder="Enter Project ID"
            value={projectId}
            onChange={(e) => setProjectId(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="text"
            label="Server Region*"
            placeholder="Enter Server Region"
            value={serverRegion}
            onChange={(e) => setServerRegion(e?.target.value)}
            disabled={connecting}
          />
        </div>
      </div>
    );
  }

  if (connectionName === 'Apollo') {
    return (
      <div className="flex flex-col px-6 py-4">
        <Input
          type="text"
          label="Api Key*"
          placeholder="Enter Api Key"
          value={apiKey}
          onChange={(e) => setApiKey(e?.target.value)}
          disabled={connecting}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6 justify-between">
      <div className={`flex justify-between ${index !== 0 ? 'border-t pt-6 mx-6' : 'px-6 pt-4'}`}>
        <label className="block text-sm text-[var(--pv-neutral-grey-700)]">Database {index + 1}</label>
        {index !== 0 && (
          <button
            className="flex items-center gap-2 cursor-pointer text-[var(--pv-primary-500)]"
            onClick={() => removeConnection(index)}
          >
            <X size={16} />
            Remove
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3 px-6">
        <Input
          type="text"
          label="Data Source*"
          placeholder="Add short description"
          value={datasource}
          onChange={(e) => setDataSource(e?.target.value)}
          disabled={connecting}
          inputRef={datasourceRef}
        />
        {connectionName === 'Snowflake' ? (
          <Input
            type="text"
            label="Account*"
            placeholder="Enter Account Name"
            value={account}
            onChange={(e) => setAccount(e?.target.value)}
            disabled={connecting}
          />
        ) : (
          <div className="flex items-center gap-4">
            <Input
              type="text"
              label="Host*"
              placeholder="Enter host name"
              value={host}
              onChange={(e) => setHost(e?.target.value)}
              disabled={connecting}
            />
            <Input
              type="number"
              label="Port*"
              placeholder="Enter Port number"
              value={port}
              onChange={(e) => setPort(e?.target.value)}
              disabled={connecting}
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <Input
            type="text"
            label="User*"
            placeholder="Enter user name"
            value={user}
            onChange={(e) => setUser(e?.target.value)}
            disabled={connecting}
          />
          <Input
            type="password"
            label="Password*"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e?.target.value)}
            disabled={connecting}
          />
        </div>

        {connectionName === 'Snowflake' && (
          <>
            <div className="flex items-center gap-4">
              <Input
                type="text"
                label="Database*"
                placeholder="Enter database name"
                value={database}
                onChange={(e) => setDatabase(e?.target.value)}
                disabled={connecting}
              />
              <Input
                type="text"
                label="Warehouse*"
                placeholder="Enter warehouse name"
                value={warehouse}
                onChange={(e) => setWarehouse(e?.target.value)}
                disabled={connecting}
              />
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="text"
                label="Schema"
                placeholder="Enter schema name"
                value={schema}
                onChange={(e) => setSchema(e?.target.value)}
                disabled={connecting}
              />
              <Input
                type="text"
                label="Region"
                placeholder="Enter region name"
                value={region}
                onChange={(e) => setRegion(e?.target.value)}
                disabled={connecting}
              />
            </div>
          </>
        )}

        {connectionName !== 'Snowflake' && (
          connectionName === 'Postgres' ? (
            <div className="flex items-center gap-4">
              <Input
                type="text"
                label="Schema*"
                placeholder="Enter schema name"
                value={schema}
                onChange={(e) => setSchema(e?.target.value)}
                disabled={connecting}
              />
              <Input
                type="text"
                label="Database*"
                placeholder="Enter database name"
                value={database}
                onChange={(e) => setDatabase(e?.target.value)}
                disabled={connecting}
              />
            </div>
          ) : (
            <Input
              type="text"
              label="Database*"
              placeholder="Enter database name"
              value={database}
              onChange={(e) => setDatabase(e?.target.value)}
              disabled={connecting}
            />
          )
        )}
      </div>
    </div>
  );
};

export default IntegrationModalDatabase;
