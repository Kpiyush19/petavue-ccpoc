import { PencilSimple } from "@phosphor-icons/react";

export const DictionaryElement = ({
  row,
  ind,
  user,
  basePath,
  handleRowClick,
  setEditDescDetails,
  setEditDescModal,
  setCurrIntegSelected,
  Tooltip
}) => {
  const index = ind + 1;
  const isAdmin = user?.role?.toLowerCase() === "admin";

  let enabledRows = 0;
  if (Array.isArray(row?.tables) && row.tables.length > 0) {
    row.tables.forEach((tab) => {
      if (!tab.disabledForGuidedAnalysis) {
        enabledRows++;
      }
    });
  }

  if (row?.isInitialSyncInProgress) {
    return (
      <div
        className="flex flex-col justify-center px-2 border bg-[var(--pv-neutral-grey-50)] border-[var(--pv-neutral-grey-200)] rounded-lg py-3 cursor-default"
        style={{ minHeight: "54px" }}
      >
        <div className="grid items-center" style={{ gridTemplateColumns: "3% 18% 59% 20%" }}>
          <span className="px-2 h-full flex items-center">{index}.</span>
          <div className="flex items-center px-2 h-full gap-2">
            <img src={row.logo} alt="" style={{ width: "16px", aspectRatio: 1 }} />
            <span className="flex text-sm">{row.datasource}</span>
          </div>
          <div className="flex justify-between items-center">
            {Tooltip ? (
              <Tooltip title={row.description || "No description added."} placement="top">
                <p
                  className={`m-0 px-2 h-full whitespace-nowrap overflow-hidden overflow-ellipsis ${row.description ? "" : "text-[var(--pv-neutral-grey-500)]"}`}
                  style={{ maxWidth: "100%" }}
                >
                  {row.description ? row.description.replace(/\n/g, "  \n") : "No description added."}
                </p>
              </Tooltip>
            ) : (
              <p
                className={`m-0 px-2 h-full whitespace-nowrap overflow-hidden overflow-ellipsis ${row.description ? "" : "text-[var(--pv-neutral-grey-500)]"}`}
                style={{ maxWidth: "100%" }}
                title={row.description || "No description added."}
              >
                {row.description ? row.description.replace(/\n/g, "  \n") : "No description added."}
              </p>
            )}
          </div>
          <span className="px-2 h-full flex items-center text-sm">Initial Sync in progress</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex flex-col justify-center px-2 border border-[var(--pv-neutral-grey-100)] rounded-lg py-3 cursor-pointer hover:bg-[var(--pv-primary-50)] hover:shadow-[0px_8px_24px_0px_rgba(144,144,144,0.1)]"
      style={{ minHeight: "54px" }}
      onClick={() => handleRowClick(row)}
    >
      <div className="grid items-center" style={{ gridTemplateColumns: "3% 18% 59% 20%" }}>
        <span className="px-2 h-full flex items-center">{index}.</span>
        <div className="flex items-center px-2 h-full gap-2">
          <img src={row.logo} alt="" style={{ width: "16px", aspectRatio: 1 }} />
          <a
            href={`${basePath}/${row.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRowClick(row);
            }}
            className="flex hover:text-[var(--pv-primary-500)] hover:underline text-sm"
          >
            {row.datasource}
          </a>
        </div>
        <div className="flex justify-between items-center">
          {Tooltip ? (
            <Tooltip title={row.description || "No description added."} placement="top">
              <p
                className={`m-0 px-2 h-full whitespace-nowrap overflow-hidden overflow-ellipsis ${row.description ? "" : "text-[var(--pv-neutral-grey-500)]"}`}
                style={{ maxWidth: "100%" }}
              >
                {row.description ? row.description.replace(/\n/g, "  \n") : "No description added."}
              </p>
            </Tooltip>
          ) : (
            <p
              className={`m-0 px-2 h-full whitespace-nowrap overflow-hidden overflow-ellipsis ${row.description ? "" : "text-[var(--pv-neutral-grey-500)]"}`}
              style={{ maxWidth: "100%" }}
              title={row.description || "No description added."}
            >
              {row.description ? row.description.replace(/\n/g, "  \n") : "No description added."}
            </p>
          )}
          <button
            className={`p-2 mr-2 rounded-lg hidden group-hover:block ${isAdmin ? "cursor-pointer hover:bg-[var(--pv-neutral-grey-100)]" : "cursor-not-allowed"}`}
            disabled={!isAdmin}
            onClick={(e) => {
              e.stopPropagation();
              if (isAdmin) {
                setCurrIntegSelected({ id: row.id });
                setEditDescDetails({
                  desc: row.description || "",
                  type: "integ",
                  name: row.datasource
                });
                setEditDescModal(true);
              }
            }}
            title="Edit description"
          >
            <PencilSimple size={12} />
          </button>
        </div>
        <span className="px-2 h-full flex items-center">
          {enabledRows}/{row?.tables?.length} Enabled
        </span>
      </div>
    </div>
  );
};
