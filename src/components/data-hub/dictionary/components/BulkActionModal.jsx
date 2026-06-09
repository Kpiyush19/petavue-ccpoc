import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/common-components/Modal';
import { Button } from '@/common-components/Button';
import { useDictBulkAction } from '../api';

export const BulkActionModal = ({
  isOpen,
  handleCloseModal,
  selectedBulkDetails,
  selectedTab,
  bulkActionPostCleaner,
}) => {
  const [saving, setSaving] = useState(false);
  const dictBulkAction = useDictBulkAction();

  const { operation, booleanVal, selectAll, bulkCols, bulkExcludeCols, filterConfig, searchQuery } = selectedBulkDetails || {};
  const count = selectAll ? 'all selected' : bulkCols?.length || 0;

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const data = {
        action: booleanVal ? 'enable' : 'disable',
        selectAll: selectAll || false,
        columns: selectAll
          ? bulkExcludeCols?.map((c) => c.name) || []
          : bulkCols?.map((c) => c.name) || [],
        ...(filterConfig && {
          dataFillOperator: filterConfig.dataFillOperator,
          dataFillValue: filterConfig.dataFillValue,
          ...(typeof filterConfig.status === 'boolean' && { status: filterConfig.status }),
          ...(filterConfig.formats && { formats: filterConfig.formats }),
          ...(filterConfig.dataTypes && { dataTypes: filterConfig.dataTypes }),
          ...(filterConfig.tags && { tags: filterConfig.tags }),
        }),
        ...(searchQuery && { keyword: searchQuery }),
      };

      await dictBulkAction.mutateAsync({
        integrationId: selectedTab?.integrationId,
        tableId: selectedTab?.id,
        data,
      });

      if (bulkActionPostCleaner?.current) {
        bulkActionPostCleaner.current();
      }
      handleCloseModal();
    } catch {
      toast.error('Failed to apply bulk action');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Confirm Bulk Action"
      variant="warning"
      className="w-[500px]"
      headerClassName="px-6"
      childClassName="px-6 pb-4"
    >
      <p className="text-[var(--pv-neutral-grey-600)]">
        Are you sure you want to <strong>{operation}</strong> for {count} columns?
      </p>
      <div className="flex justify-between mt-6 pt-4 px-6 -mx-6 border-t border-[var(--pv-neutral-grey-100)]">
        <Button btnColor="secondary" btnSize="lg" onClick={handleCloseModal}>
          Cancel
        </Button>
        <Button btnColor="primary" btnSize="lg" onClick={handleConfirm} disabled={saving}>
          {saving ? 'Processing...' : 'Confirm'}
        </Button>
      </div>
    </Modal>
  );
};
