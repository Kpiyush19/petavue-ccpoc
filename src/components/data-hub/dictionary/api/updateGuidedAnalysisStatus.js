import { useMutation } from '@tanstack/react-query';
import { useAxios, useNotifications, useQueryClient } from '../context';

const updateGuidedAnalysisStatus = (axios, { metadata, data }) => {
  let endpoint = `/api/v1/integration/data-dictionaries/${metadata.integrationId}/${metadata.tableId}`;
  if (metadata.columnName) {
    endpoint += `/${metadata.columnName}`;
  }
  endpoint += '/enable-for-analysis';
  return axios.put(endpoint, data);
};

export const useUpdateGuidedAnalysisStatus = ({ config } = {}) => {
  const axios = useAxios();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: (params) => updateGuidedAnalysisStatus(axios, params),
    onError: (error, { metadata }) => {
        addNotification({
          type: 'error',
          title: error?.response?.data?.error?.message || 'Failed to Update',
        });
        if (metadata.columnName) {
          const { queryKey, setColumns, col } = metadata;
          setColumns((prev) => {
            let temp = structuredClone(prev || []);
            return temp.map((colm) => {
              if (colm.name === col.name) {
                colm.disabledForGuidedAnalysis = !colm.disabledForGuidedAnalysis;
              }
              return colm;
            });
          });
          queryClient.setQueryData(queryKey, (prevData) => {
            let prev = structuredClone(prevData || {});
            let columns = prev?.data || [];
            if (Array.isArray(columns) && columns.length > 0) {
              const colInd = columns.findIndex(
                (column) => column.name === col.name
              );
              if (colInd > -1) {
                columns[colInd] = {
                  ...columns[colInd],
                  disabledForGuidedAnalysis:
                    !columns[colInd].disabledForGuidedAnalysis,
                };
              }
            }
            prev.data = columns;
            return prev;
          });
        } else {
          const {
            currIntegSelected,
            tablesPageNumber,
            selectedTab,
            setSelectedTab,
          } = metadata;
          queryClient.setQueryData(
            ['allTables', '', '', '', currIntegSelected?.id, tablesPageNumber],
            (prevData) => {
              let prev = structuredClone(prevData || {});
              let dictionaries = prev?.data || [];
              if (Array.isArray(dictionaries) && dictionaries.length > 0) {
                const tabInd = dictionaries.findIndex(
                  (tab) => tab.id === selectedTab.id
                );
                if (tabInd > -1) {
                  dictionaries[tabInd] = {
                    ...dictionaries[tabInd],
                    disabledForGuidedAnalysis:
                      !dictionaries[tabInd].disabledForGuidedAnalysis,
                  };
                }
              }
              prev.data = dictionaries;
              return prev;
            }
          );
          queryClient.setQueryData(['dictionariesList'], (prevData) => {
            let prev = structuredClone(prevData || []);
            let data = prev?.data;
            if (Array.isArray(data) && data.length > 0) {
              const index = data.findIndex(
                (integ) => integ.id === currIntegSelected?.id
              );
              if (index > -1) {
                let tableList = data[index].tables;
                if (Array.isArray(tableList) && tableList.length > 0) {
                  const ind = tableList.findIndex(
                    (tab) => tab.id === selectedTab?.id
                  );
                  if (ind > -1) {
                    tableList[ind].disabledForGuidedAnalysis =
                      !tableList[ind].disabledForGuidedAnalysis;
                  }
                  data[index].tables = tableList;
                }
              }
            }
            prev.data = data;
            return prev;
          });
          setSelectedTab((prev) => ({
            ...prev,
            disabledForGuidedAnalysis: !prev.disabledForGuidedAnalysis,
          }));
        }
      },
      onSuccess: (_, { data, metadata }) => {
        const {
          tableId,
          setEnabledCols,
          pagiColPageNum,
          columnName,
        } = metadata;
        const { enable } = data;

        addNotification({
          type: 'success',
          title: 'Updated Successfully',
        });

        if (metadata.columnName) {
          const queryKeys = queryClient
            .getQueryCache()
            .findAll(['tableColumns', tableId]);
          if (Array.isArray(queryKeys) && queryKeys.length > 0) {
            queryKeys.forEach((queryKey) => {
              const queryList = queryKey.queryKey;
              queryClient.setQueryData(queryList, (prevData) => {
                let prev = structuredClone(prevData || {});
                let colData = prev.data || [];
                if (Array.isArray(colData) && colData.length > 0) {
                  colData.forEach((col) => {
                    if (col.name === columnName) {
                      col.disabledForGuidedAnalysis = !enable;
                    }
                  });
                }
                if (typeof prev?.meta?.totalEnabledColumns === 'number') {
                  if (enable) {
                    prev.meta.totalEnabledColumns =
                      prev.meta.totalEnabledColumns + 1;
                  } else {
                    prev.meta.totalEnabledColumns =
                      prev.meta.totalEnabledColumns - 1;
                  }
                }
                return prev;
              });
              queryList.forEach((query) => {
                if (typeof query === 'boolean') {
                  queryClient.refetchQueries({ queryKey: queryList });
                }
              });
            });
          }
          queryClient.resetQueries({ queryKey: ['searchedTablesWithTableName'] });
          queryClient.resetQueries({ queryKey: ['searchedColumnsWithColumnName'] });
          if (pagiColPageNum !== 1) {
            if (enable) {
              setEnabledCols((prev) => ++prev);
            } else {
              setEnabledCols((prev) => --prev);
            }
          }
        }
      },
    ...config,
  });
};
