import { useEffect, useState, useRef } from "react";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "../../../../common-components/Modal";
import { Button } from "../../../../common-components/Button";
import { useConnectDatabase } from "../api/connectDatabase";
import IntegrationModalDatabase from "./IntegrationModalDatabase";
import { useNotificationStore } from "../stores/notifications";
import { z } from "zod";

export const emptyConnection = {
  host: "",
  port: "",
  account: "",
  schema: "",
  region: "",
  warehouse: "",
  datasource: "",
  user: "",
  password: "",
  database: "",
  clientId: "",
  clientSecret: "",
  clientURL: "",
  apiToken: "",
  apiId: "",
  apiKey: "",
  domain: "",
  email: "",
  username: "",
  secret: "",
  projectId: "",
  serverRegion: ""
};

const emailSchema = z.string().email({ message: "Invalid email address" });
const urlSchema = z.string().url({ message: "Invalid url" });

export const IntegrationModal = ({
  isModalOpen,
  onClose,
  selectedCard,
  refetchSourceIntegrations,
  setIsSpinnerModalOpen
}) => {
  const [connections, setConnections] = useState([emptyConnection]);
  const [canConnect, setCanConnect] = useState(false);
  const { addNotification } = useNotificationStore();
  const [connecting, setConnecting] = useState(false);

  const datasourceRef = useRef(null);

  useEffect(() => {
    if (connections.length > 0) {
      const firstConnection = connections[0];
      const shouldBeAbleToConnect =
        selectedCard?.name === "Snowflake"
          ? firstConnection.account.trim() !== "" &&
            firstConnection.datasource.trim() !== "" &&
            firstConnection.user.trim() !== "" &&
            firstConnection.password.trim() !== "" &&
            firstConnection.warehouse.trim() !== "" &&
            firstConnection.database.trim() !== ""
          : selectedCard?.name === "Marketo" || selectedCard?.name === "Gong"
            ? firstConnection.clientId.trim() !== "" &&
              firstConnection.clientSecret.trim() !== "" &&
              firstConnection.clientURL.trim() !== ""
            : selectedCard?.name === "Jira"
              ? firstConnection.apiToken.trim() !== "" &&
                firstConnection.domain.trim() !== "" &&
                emailSchema.safeParse(firstConnection.email.trim()).success &&
                firstConnection.email.trim() !== "" &&
                urlSchema.safeParse(firstConnection.domain.trim()).success
              : selectedCard?.name === "Freshdesk"
                ? firstConnection.apiKey.trim() !== "" &&
                  firstConnection.domain.trim() !== "" &&
                  urlSchema.safeParse(firstConnection.domain.trim()).success
                : selectedCard?.name === "Aircall"
                  ? firstConnection.apiId.trim() !== "" && firstConnection.apiToken.trim() !== ""
                  : selectedCard?.name === "Postgres"
                    ? firstConnection.host.trim() !== "" &&
                      firstConnection.datasource.trim() !== "" &&
                      firstConnection.port &&
                      firstConnection.user.trim() !== "" &&
                      firstConnection.password.trim() !== "" &&
                      firstConnection.schema.trim() !== "" &&
                      firstConnection.database.trim() !== ""
                    : selectedCard?.name === "Mixpanel"
                      ? firstConnection.username.trim() !== "" &&
                        firstConnection.secret.trim() !== "" &&
                        firstConnection.projectId.trim() !== "" &&
                        firstConnection.serverRegion.trim() !== ""
                      : selectedCard?.name === "Apollo"
                        ? firstConnection.apiKey.trim() !== ""
                        : firstConnection.host.trim() !== "" &&
                          firstConnection.datasource.trim() !== "" &&
                          firstConnection.port &&
                          firstConnection.user.trim() !== "" &&
                          firstConnection.password.trim() !== "" &&
                          firstConnection.database.trim() !== "";

      if (shouldBeAbleToConnect !== canConnect) {
        setCanConnect(shouldBeAbleToConnect);
      }
    }
  }, [connections, canConnect, selectedCard?.name]);

  const updateConnection = (newConnection, index) => {
    setConnections((prevConnections) => {
      if (JSON.stringify(prevConnections[index]) !== JSON.stringify(newConnection)) {
        return prevConnections.map((conn, idx) => (idx === index ? newConnection : conn));
      }
      return prevConnections;
    });
  };

  const removeConnection = (index) => {
    setConnections((prevConnections) => prevConnections.filter((_, idx) => idx !== index));
  };

  const connectDatabase = useConnectDatabase();

  const handleCloseModal = () => {
    setConnections([emptyConnection]);
    onClose();
  };

  const handleConnect = async () => {
    setConnecting(true);
    const connectionList = connections;

    if (selectedCard?.name === "Gainsight") {
      setIsSpinnerModalOpen(true);
      handleCloseModal();
    } else {
      const database = selectedCard?.name.charAt(0).toUpperCase() + selectedCard?.name.slice(1);

      try {
        const data = {
          database: selectedCard?.name.toLowerCase(),
          connections:
            selectedCard?.name === "Marketo" ||
            selectedCard?.name === "Gong" ||
            selectedCard?.name === "Jira" ||
            selectedCard?.name === "Aircall" ||
            selectedCard?.name === "Freshdesk" ||
            selectedCard?.name === "Mixpanel" ||
            selectedCard?.name === "Apollo"
              ? connectionList[0]
              : connectionList
        };
        const response = await connectDatabase.mutateAsync(data);

        if (response["success"]) {
          addNotification({
            type: "success",
            title: `${database} Connected Successfully`
          });
          refetchSourceIntegrations();
          handleCloseModal();
        }
        setConnecting(false);
      } catch (e) {
        setConnecting(false);
      }
    }
  };

  const handleAddNewComponent = () => {
    setConnections((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        ...emptyConnection
      }
    ]);
    setTimeout(() => {
      datasourceRef.current && datasourceRef.current.focus();
    }, 0);
  };

  const singleConnectionIntegrations = ["Gong", "Marketo", "Jira", "Freshdesk", "Aircall", "Mixpanel", "Apollo"];

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      title={`${selectedCard?.name} Integration`}
      className="w-[742px]"
      topStripClassName="hidden"
      headerClassName="py-3 px-5"
      titleClassName="text-[14px] font-medium"
    >
      <div className="overflow-y-auto max-h-[500px]">
        {connections.map((connection, index) => (
          <IntegrationModalDatabase
            key={index}
            index={index}
            connection={connection}
            connectionName={selectedCard?.name}
            updateConnection={updateConnection}
            removeConnection={removeConnection}
            datasourceRef={datasourceRef}
            connecting={connecting}
          />
        ))}
      </div>

      <div className="flex justify-between px-6 py-4 border-t border-[var(--pv-neutral-grey-200)] items-end gap-1.5">
        <Button btnColor="ghost" btnSize="lg" onClick={handleCloseModal}>
          Cancel
        </Button>
        <div className="flex gap-4">
          {!singleConnectionIntegrations.includes(selectedCard?.name) && (
            <Button btnColor="secondary" btnSize="lg" onClick={handleAddNewComponent} disabled={connecting}>
              <Plus />
              <span className="whitespace-nowrap">Add New Connection</span>
            </Button>
          )}
          <Button btnColor="primary" btnSize="lg" onClick={handleConnect} disabled={!canConnect || connecting}>
            {connecting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Connecting</span>
              </>
            ) : (
              "Test & Connect"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default IntegrationModal;
