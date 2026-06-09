import { Modal } from "../../../../common-components/Modal";
import { Button } from "../../../../common-components/Button";
import { useDisconnectDatabase } from "../api/disconnectDatabase";
import { queryClient } from "../../../../lib/queryClient";

export const DisconnectIntegrationModal = ({
  isModalOpen,
  onClose,
  title,
  database,
  connectionId,
  fetchConnections,
  onNavigate,
  integrationsPath = "/settings/integrations",
  myProfilePath = "/my-profile"
}) => {
  const disconnectDatabase = useDisconnectDatabase();

  const singleConnectionTypes = [
    "Salesforce",
    "Google Sheets",
    "Marketo",
    "Gong",
    "Slack",
    "Jira",
    "Freshdesk",
    "Aircall"
  ];

  const disconnect = async () => {
    await disconnectDatabase.mutateAsync({ database, connectionId });
    onClose();

    if (!singleConnectionTypes.includes(database)) {
      await fetchConnections();
      queryClient.refetchQueries(["source_integrations", "tenant-level"]);
    } else if (database === "Google Sheets") {
      onNavigate?.(myProfilePath);
      queryClient.refetchQueries(["source_integrations", "user-level"]);
    } else {
      onNavigate?.(integrationsPath);
      queryClient.refetchQueries(["source_integrations", "tenant-level"]);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      title="Disconnect"
      className="w-[500px]"
      topStripClassName="hidden"
      headerClassName="py-3 px-4"
      titleClassName="text-[14px] font-medium"
      variant="error"
    >
      <div className="flex flex-col">
        <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
          <p className="text-sm text-[var(--pv-neutral-grey-600)]">
            Disconnecting {database === "Google Sheets" ? "Google Sheets" : "this connection"} will result in the loss
            of access to associated services and data.
          </p>
          <p className="text-sm font-medium text-[var(--pv-text-primary-text)]">Are you sure you want to disconnect?</p>
        </div>
        <div className="border-t border-[var(--pv-neutral-grey-150)]">
          <div className="flex justify-between items-center py-3 px-4">
            <Button btnColor="ghost" btnSize="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button btnColor="primary red" btnSize="lg" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DisconnectIntegrationModal;
