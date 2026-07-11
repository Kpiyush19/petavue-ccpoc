import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from '@phosphor-icons/react';
import { isEqual } from 'lodash';
import { Button } from '@/ui';
import Skeleton from './components/Skeleton';
import IntegrationDetailDatabase from './components/IntegrationDetailDatabase';
import { DisconnectIntegrationModal } from './components/DisconnectIntegrationModal';
import { RemoveUnsavedIntegrationModal } from './components/RemoveUnsavedIntegrationModal';
import { UnsavedChangesWarningModal } from './components/UnsavedChangesWarningModal';
import { useGetIntegrationDetails } from './api/getIntegrationDetails';
import { useTestConnection } from './api/testConnection';
import { useConnectDatabase } from './api/connectDatabase';
import { useNotificationStore } from './stores/notifications';
import { emptyConnection } from './components/IntegrationModal';

export const IntegrationDetail = ({
  integrationName,
  onBack,
  onNavigate,
  integrationsPath = '/settings/integrations',
  myProfilePath = '/my-profile',
  hideHeader = false,
}) => {
  const [integrationDetails, setIntegrationDetails] = useState();
  const [changesMade, setChangesMade] = useState(false);
  const { addNotification } = useNotificationStore();
  const datasourceRef = useRef(null);

  const getIntegrationDetails = useGetIntegrationDetails();
  const testConnection = useTestConnection();
  const connectDatabase = useConnectDatabase();

  const [disconnectionConnectionId, setDisconnectionConnectionId] = useState();
  const [isRemovingConnection, setIsRemovingConnection] = useState(false);
  const [connectionRemovalIndex, setConnectionRemovalIndex] = useState();
  const [isDisconnecting, setDisconnect] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  const isSingleConnectionType =
    integrationName === 'Salesforce' ||
    integrationName === 'Google Sheets' ||
    integrationName === 'Google Analytics' ||
    integrationName === 'Slack' ||
    integrationName === 'Marketo' ||
    integrationName === 'Gong' ||
    integrationName === 'Jira' ||
    integrationName === 'Freshdesk' ||
    integrationName === 'Aircall' ||
    integrationName === 'HubSpot' ||
    integrationName === 'Mixpanel' ||
    integrationName === 'Apollo' ||
    integrationName === 'Iceberg';

  const goBack = () => {
    if (changesMade) {
      setShowUnsavedChangesModal(true);
    } else {
      if (onBack) {
        onBack();
      } else if (onNavigate) {
        onNavigate(integrationsPath);
      }
    }
  };

  useEffect(() => {
    if (integrationDetails && integrationDetails.length === 0) {
      if (integrationName === 'Google Sheets') {
        onNavigate?.(myProfilePath);
      } else {
        onNavigate?.(integrationsPath);
      }
    }
  }, [integrationDetails]);

  const fetchDetails = async () => {
    const details = await getIntegrationDetails.mutateAsync({
      item: integrationName?.toLowerCase(),
    });

    if (isSingleConnectionType) {
      setIntegrationDetails([{ ...details }]);
    } else {
      setIntegrationDetails(details);
    }
  };

  useEffect(() => {
    if (integrationName) {
      fetchDetails();
    }
  }, [integrationName]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!changesMade) return;
      event.preventDefault();
      setShowUnsavedChangesModal(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [changesMade]);

  const handleAddNewConnection = () => {
    setIntegrationDetails((prev) => {
      if (integrationName === 'Postgres') {
        return [
          ...prev,
          {
            ...emptyConnection,
            schema: 'public',
            enableEditing: true,
          },
        ];
      }
      return [
        ...prev,
        {
          ...emptyConnection,
          enableEditing: true,
        },
      ];
    });

    setTimeout(() => {
      datasourceRef.current && datasourceRef.current.focus();
    }, 0);
  };

  const updateConnection = (newConnection, index) => {
    setIntegrationDetails((prevConnections) => {
      const currentConnection = prevConnections[index];
      if (
        !isEqual(currentConnection, {
          ...newConnection,
          enableEditing: currentConnection.enableEditing,
        })
      ) {
        return prevConnections.map((conn, idx) => {
          if (idx === index) {
            return { ...newConnection, enableEditing: conn.enableEditing };
          }
          return conn;
        });
      }
      return prevConnections;
    });
    setChangesMade(true);
  };

  const saveConnections = async () => {
    const connections = integrationDetails
      .filter((detail) => detail.id === undefined)
      .map((detail) => ({
        ...detail,
        host: integrationName === 'Snowflake' ? undefined : detail.host,
        port: integrationName === 'Snowflake' ? undefined : parseInt(detail.port),
        account: integrationName !== 'Snowflake' ? undefined : detail.account,
        region: integrationName !== 'Snowflake' ? undefined : detail.region,
        schema:
          integrationName !== 'Snowflake' && integrationName !== 'Postgres'
            ? undefined
            : detail.schema,
        warehouse: integrationName !== 'Snowflake' ? undefined : detail.warehouse,
        enableEditing: undefined,
      }));

    try {
      const response = await connectDatabase.mutateAsync({
        database: integrationName?.toLowerCase(),
        connections,
      });
      if (response?.['success']) {
        addNotification({
          type: 'success',
          title: 'Database Connected successfully',
        });
        fetchDetails();
      }
    } catch (e) {
      toast.error('Failed to save connections');
    }
    setChangesMade(false);
  };

  const handleTestConnection = async (connectionId) => {
    const response = await testConnection.mutateAsync({
      database: integrationName,
      connectionId,
    });
    if (response?.['success']) {
      addNotification({ type: 'success', title: 'Test Connection Successful' });
    } else {
      addNotification({ type: 'error', title: 'Test Connection Failed' });
    }
  };

  const removeConnection = (index) => {
    setConnectionRemovalIndex(index);
    setIsRemovingConnection(true);
  };

  const handleRemoveConnection = (index) => {
    setIntegrationDetails((prevConnections) =>
      prevConnections.filter((_, idx) => idx !== index)
    );
  };

  const handleDisconnection = async (connectionId) => {
    setDisconnectionConnectionId(connectionId);
    setDisconnect(true);
  };

  const handleExitWithUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate(integrationsPath);
    }
  };

  const handleSaveAndExit = async () => {
    await saveConnections();
    setShowUnsavedChangesModal(false);
  };

  return (
    <>
      <div className="h-screen flex flex-col">
        {!hideHeader && (
          <div className="flex items-center border-b border-[var(--color-grey-200)] h-[64px] shrink-0 bg-white justify-between px-6 py-4">
            <div className="flex gap-4 items-center">
              <div
                onClick={goBack}
                className="flex flex-row justify-between cursor-pointer items-center w-fit"
              >
                <ArrowLeft size={25} />
              </div>
              <h1 className="text-[var(--color-text-primary)] text-lg leading-7">
                {integrationName} Details
              </h1>
            </div>
            <div className="flex gap-4">
              {!isSingleConnectionType && (
                <>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleAddNewConnection}
                  >
                    <Plus size={16} />
                    Add New Connection
                  </Button>
                  <Button variant="primary" size="lg" onClick={saveConnections} disabled={!changesMade}>
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col h-full overflow-y-auto bg-[var(--color-grey-50)]">
          <div className="flex flex-col bg-white overflow-y-auto h-full rounded-md px-4 pb-4 pt-6">
            {getIntegrationDetails.isLoading ? (
              <div className="flex flex-col w-full gap-6">
                <div className="flex flex-col h-[66px] w-full justify-between">
                  <Skeleton width="80px" height="20px" />
                  <div className="flex h-[36px] w-full bg-[var(--color-grey-100)] rounded-lg px-3 py-2">
                    <Skeleton width="180px" height="20px" />
                  </div>
                </div>
                <div className="flex w-full gap-9 justify-between">
                  <div className="flex flex-col h-[66px] w-full justify-between">
                    <Skeleton width="80px" height="20px" />
                    <div className="flex h-[36px] w-full bg-[var(--color-grey-100)] rounded-lg px-3 py-2">
                      <Skeleton width="180px" height="20px" />
                    </div>
                  </div>
                  <div className="flex flex-col h-[66px] w-full justify-between">
                    <Skeleton width="80px" height="20px" />
                    <div className="flex h-[36px] w-full bg-[var(--color-grey-100)] rounded-lg px-3 py-2">
                      <Skeleton width="180px" height="20px" />
                    </div>
                  </div>
                </div>
              </div>
            ) : integrationDetails && integrationDetails.length > 0 ? (
              integrationDetails.map((detail, index) => (
                <IntegrationDetailDatabase
                  key={index}
                  connectionName={integrationName}
                  integrationDetail={detail}
                  handleTestConnection={handleTestConnection}
                  handleDisconnection={handleDisconnection}
                  index={index}
                  removeConnection={removeConnection}
                  updateConnection={updateConnection}
                  datasourceRef={datasourceRef}
                  loading={getIntegrationDetails.isLoading}
                />
              ))
            ) : null}
          </div>
        </div>
      </div>

      <DisconnectIntegrationModal
        database={integrationName}
        connectionId={disconnectionConnectionId}
        isModalOpen={isDisconnecting}
        fetchConnections={fetchDetails}
        title={integrationName}
        onClose={() => setDisconnect(false)}
        onNavigate={onNavigate}
        integrationsPath={integrationsPath}
        myProfilePath={myProfilePath}
      />

      <RemoveUnsavedIntegrationModal
        database={integrationName}
        connectionId={disconnectionConnectionId}
        isModalOpen={isRemovingConnection}
        handleRemoveConnection={handleRemoveConnection}
        connectionRemovalIndex={connectionRemovalIndex}
        title={integrationName}
        onClose={() => setIsRemovingConnection(false)}
      />

      <UnsavedChangesWarningModal
        isModalOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onExit={handleExitWithUnsavedChanges}
        onSaveChanges={handleSaveAndExit}
      />
    </>
  );
};

export default IntegrationDetail;
