import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/common-components/Modal';
import { Button } from '@/common-components/Button';
import Input from '@/common-components/Input';
import { useUpdateDictionaryDetail, useUpdateDictionaryTableDescription } from '../api';
import { useQueryClient } from '../context';

export const EditDescModal = ({
  isOpen,
  handleCloseModal,
  editDescDetails,
  selectedTab,
  setSelectedTab,
  currIntegSelected,
  setCurrIntegSelected,
  setTables,
}) => {
  const [description, setDescription] = useState('');
  const [originalDesc, setOriginalDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const updateDictionaryDetail = useUpdateDictionaryDetail();
  const updateTableDescription = useUpdateDictionaryTableDescription();

  useEffect(() => {
    if (isOpen) {
      const desc = editDescDetails?.desc || '';
      setDescription(desc);
      setOriginalDesc(desc);
    }
  }, [isOpen, editDescDetails?.desc]);

  const isSaveDisabled = saving || description.trim() === '' || description === originalDesc;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (editDescDetails?.type === 'integ') {
        await updateDictionaryDetail.mutateAsync({
          id: currIntegSelected?.id,
          data: { description },
        });
        if (setCurrIntegSelected) {
          setCurrIntegSelected((prev) => ({ ...prev, description }));
        }
        queryClient.setQueryData(['dictionariesList'], (prevData) => {
          if (!prevData) return prevData;
          const prev = structuredClone(prevData);
          if (Array.isArray(prev.data)) {
            const idx = prev.data.findIndex((d) => d.id === currIntegSelected?.id);
            if (idx > -1) {
              prev.data[idx].description = description;
            }
          }
          return prev;
        });
      } else if (editDescDetails?.type === 'table') {
        await updateTableDescription.mutateAsync({
          id: currIntegSelected?.id,
          tableId: selectedTab?.id,
          data: { description },
        });
        if (setSelectedTab) {
          setSelectedTab((prev) => ({ ...prev, description }));
        }
        if (setTables) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === selectedTab?.id ? { ...t, description } : t
            )
          );
        }
      }
      handleCloseModal();
    } catch {
      toast.error('Failed to update description');
    } finally {
      setSaving(false);
    }
  };

  const title = `Edit ${editDescDetails?.type === 'integ' ? 'Source' : 'Table'} Description`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={title}
      variant="primary"
      className="w-[600px]"
      headerClassName="px-6"
      childClassName="px-6 pb-4"
    >
      <Input
        type="textarea"
        label={editDescDetails?.name}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description..."
        minRows={4}
        maxRows={8}
      />
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
