import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/common-components/Modal';
import { Button } from '@/common-components/Button';
import Input from '@/common-components/Input';
import { useUpdateColumnDetails } from '../api';

export const EditDictColumnDetailModal = ({
  isOpen,
  handleCloseModal,
  selectedColDetails,
  setColumns,
  showLabel = true,
}) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [originalLabel, setOriginalLabel] = useState('');
  const [originalDesc, setOriginalDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const updateColumnDetails = useUpdateColumnDetails();

  useEffect(() => {
    if (isOpen && selectedColDetails) {
      const lbl = selectedColDetails.label || '';
      const desc = selectedColDetails.description || '';
      setLabel(lbl);
      setDescription(desc);
      setOriginalLabel(lbl);
      setOriginalDesc(desc);
    }
  }, [isOpen, selectedColDetails]);

  const hasChanges = label !== originalLabel || description !== originalDesc;
  const isSaveDisabled = saving || !hasChanges;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      await updateColumnDetails.mutateAsync({
        integrationId: selectedColDetails.integrationId,
        tableId: selectedColDetails.tableId,
        columnName: selectedColDetails.name,
        data: { label, description },
      });

      if (setColumns) {
        setColumns((prev) =>
          prev.map((col) =>
            col.name === selectedColDetails.name
              ? { ...col, label, description }
              : col
          )
        );
      }
      handleCloseModal();
    } catch {
      toast.error('Failed to update column details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Edit Column Details"
      variant="primary"
      className="w-[600px]"
      headerClassName="px-6"
      childClassName="px-6 pb-4"
    >
      <div className="space-y-4">
        <Input
          label="Column Name"
          value={selectedColDetails?.name || ''}
          disabled
        />
        {showLabel && (
          <Input
            label="Display Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter display label..."
          />
        )}
        <Input
          type="textarea"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
          minRows={3}
          maxRows={6}
        />
      </div>
      <div className="flex justify-between mt-6 pt-4 px-6 -mx-6 border-t border-[var(--pv-neutral-grey-100)]">
        <Button btnColor="secondary" btnSize="lg" onClick={handleCloseModal}>
          Cancel
        </Button>
        <Button btnColor="primary" btnSize="lg" onClick={handleSave} disabled={isSaveDisabled}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Modal>
  );
};
