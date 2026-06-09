import { useState } from "react";
import { DictionaryTable } from "./DictionaryTable";

export const Dictionary = ({ Skeleton, Tooltip, Button }) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <div className="flex-1 px-4 py-4">
        <div className="bg-white rounded-lg overflow-y-auto h-fit max-h-full">
          <DictionaryTable
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            Skeleton={Skeleton}
            Tooltip={Tooltip}
            Button={Button}
          />
        </div>
      </div>
    </div>
  );
};
