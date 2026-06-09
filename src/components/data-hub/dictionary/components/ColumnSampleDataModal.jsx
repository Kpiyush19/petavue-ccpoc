import { Modal } from '@/common-components/Modal';
import { useGetColumnSampleData } from '../api';

export const ColumnSampleDataModal = ({
  isOpen,
  handleClose,
  columnDetails,
}) => {
  const { tableId, columnName, tableName } = columnDetails || {};

  const sampleData = useGetColumnSampleData({
    tableId,
    columnName,
    config: {
      enabled: isOpen && !!tableId && !!columnName,
      staleTime: Infinity,
    },
  });

  const samples = sampleData.data?.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Sample Data"
      variant="primary"
      className="w-[500px]"
      headerClassName="px-6"
      childClassName="px-6 pb-4"
    >
      <p className="text-sm text-[var(--pv-neutral-grey-500)] -mt-2 mb-4">
        {tableName} / {columnName}
      </p>
      <div className="max-h-80 overflow-y-auto">
        {sampleData.isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-[var(--pv-neutral-grey-100)] rounded animate-pulse" />
            ))}
          </div>
        ) : samples.length === 0 ? (
          <div className="text-center text-[var(--pv-neutral-grey-500)] py-8">
            No sample data available
          </div>
        ) : (
          <div className="space-y-2">
            {samples.map((sample, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-[var(--pv-neutral-grey-50)] rounded text-sm font-mono break-all"
              >
                {sample?.value ?? sample ?? '-'}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
