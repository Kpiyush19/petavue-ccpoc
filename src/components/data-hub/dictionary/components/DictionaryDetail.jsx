import { DictionaryDetailBox } from "./DictionaryDetailBox";

export const DictionaryDetail = ({ dataCatalogId, Skeleton, Tooltip, Markdown }) => {
  return (
    <div className="h-full w-full flex flex-col bg-[var(--pv-neutral-grey-50)] overflow-hidden">
      <div className="flex relative h-full overflow-y-auto">
        <div style={{ width: "calc(100vw - 48px)" }}>
          <DictionaryDetailBox
            dataCatalogId={dataCatalogId}
            Skeleton={Skeleton}
            Tooltip={Tooltip}
            Markdown={Markdown}
          />
        </div>
      </div>
    </div>
  );
};
