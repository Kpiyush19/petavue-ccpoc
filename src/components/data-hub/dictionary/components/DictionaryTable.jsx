import { useState } from 'react';
import { useGetDictionariesList } from '../api';
import { useNavigate, useNotifications, useUser, useBasePath } from '../context';
import { DictionaryElement } from './DictionaryElement';
import { EditDescModal } from './EditDescModal';

export const DictionaryTable = ({
  searchQuery,
  setSearchQuery,
  Skeleton,
  Tooltip,
  Button,
}) => {
  const [editDescModal, setEditDescModal] = useState(false);
  const [editDescDetails, setEditDescDetails] = useState({});
  const [currIntegSelected, setCurrIntegSelected] = useState({});

  const navigate = useNavigate();
  const basePath = useBasePath();
  const user = useUser();
  const { addNotification } = useNotifications();

  const dictionariesListData = useGetDictionariesList({
    keyword: searchQuery,
    config: { staleTime: Infinity },
  });

  const handleRowClick = (row) => {
    if (row && typeof row === 'object') {
      const { id, datasource } = row;
      if (id && datasource) {
        navigate(`${basePath}/${id}`, { state: { id, datasource, searchQuery } });
      } else {
        addNotification({ type: 'error', title: 'Something went wrong' });
      }
    }
  };

  let list = [];
  if (Array.isArray(dictionariesListData.data?.data) && dictionariesListData.data.data.length > 0) {
    const rawData = dictionariesListData.data.data;
    list = structuredClone(rawData).filter(
      (row) => (Array.isArray(row?.tables) && row.tables.length > 0) || row?.isInitialSyncInProgress
    );
  }

  const SkeletonComp = Skeleton || (({ width, height }) => (
    <div className="bg-[var(--pv-neutral-grey-200)] rounded animate-pulse" style={{ width, height }} />
  ));

  const ButtonComp = Button || (({ onClick, children, className }) => (
    <button onClick={onClick} className={`px-4 py-2 bg-[var(--pv-primary-500)] text-white rounded hover:bg-[var(--pv-primary-500)] ${className || ''}`}>
      {children}
    </button>
  ));

  return (
    <div className="relative h-full w-full" style={{ zIndex: 0 }}>
      <div
        className={`flex items-center w-full justify-between bg-white sticky pr-6 ${list.length === 0 && !dictionariesListData.isLoading ? '' : 'border-b border-[var(--pv-neutral-grey-100)] pt-1'}`}
        style={{ minWidth: '1030px', top: 0, zIndex: 1 }}
      >
        {dictionariesListData.isLoading ? (
          <div className="flex items-center gap-2.5 px-4 py-3">
            <SkeletonComp width={55} height={18} />
            <SkeletonComp width={24} height={22} />
          </div>
        ) : list.length > 0 ? (
          <div className="flex items-center gap-2.5 px-4 py-3">
            <span className="text-sm">Sources</span>
            <span className="text-xs font-normal bg-[var(--pv-primary-500)] text-white py-1 px-1.5 rounded-md">
              {dictionariesListData.data?.data?.length || 0}
            </span>
          </div>
        ) : null}
      </div>

      <div className="relative flex flex-col rounded-md w-full h-[calc(100%-55px)]" style={{ zIndex: 0 }}>
        {dictionariesListData.isLoading ? (
          <div className="flex flex-col w-full">
            {/* Header skeleton */}
            <div className="grid py-4 px-8" style={{ gridTemplateColumns: '3% 18% 59% 20%' }}>
              <span className="px-2"><SkeletonComp width={12} height={16} /></span>
              <span className="px-2"><SkeletonComp width={80} height={16} /></span>
              <span className="px-2"><SkeletonComp width={70} height={16} /></span>
              <span className="px-2"><SkeletonComp width={45} height={16} /></span>
            </div>
            {/* Row skeletons */}
            <div className="w-full flex flex-col px-6 gap-2">
              {[...Array(8)].map((_, ind) => (
                <div key={ind} className="grid items-center w-full py-3 px-2 border border-[var(--pv-neutral-grey-100)] rounded-lg" style={{ gridTemplateColumns: '3% 18% 59% 20%' }}>
                  <span className="px-2"><SkeletonComp width={16} height={16} /></span>
                  <div className="flex items-center gap-2 px-2">
                    <SkeletonComp width={20} height={20} />
                    <SkeletonComp width={ind % 2 === 0 ? 120 : 80} height={16} />
                  </div>
                  <span className="px-2"><SkeletonComp width={ind % 2 === 0 ? '80%' : '50%'} height={16} /></span>
                  <div className="flex items-center gap-2 px-2">
                    <SkeletonComp width={ind % 2 === 0 ? 60 : 40} height={16} />
                    <SkeletonComp width={32} height={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : list.length > 0 ? (
          <div className="w-full flex flex-col h-full overflow-y-auto" style={{ minWidth: '1000px', flex: 1, zIndex: 0 }}>
            <div className="grid py-4 px-8 h-fit sticky bg-white" style={{ gridTemplateColumns: '3% 18% 59% 20%', top: 0, zIndex: 1 }}>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">#</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Data Sources</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Description</span>
              <span className="text-xs text-[var(--pv-neutral-grey-500)] font-medium px-2">Tables</span>
            </div>
            <div className="flex flex-col gap-2 px-6 mb-4" style={{ zIndex: 0 }}>
              {list.map((row, index) => (
                <DictionaryElement
                  key={row.id || index}
                  row={row}
                  ind={index}
                  user={user}
                  basePath={basePath}
                  handleRowClick={handleRowClick}
                  setEditDescDetails={setEditDescDetails}
                  setEditDescModal={setEditDescModal}
                  setCurrIntegSelected={setCurrIntegSelected}
                  Tooltip={Tooltip}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full justify-center items-center gap-2">
            <span className="font-medium text-lg">No Sources Available</span>
            <span className="text-[var(--pv-neutral-grey-500)]">Connect integrations to access and manage your data sources.</span>
          </div>
        )}
      </div>

      <EditDescModal
        isOpen={editDescModal}
        handleCloseModal={() => setEditDescModal(false)}
        editDescDetails={editDescDetails}
        currIntegSelected={currIntegSelected}
      />
    </div>
  );
};
