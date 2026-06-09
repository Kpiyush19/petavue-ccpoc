import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export default function HomeLayout() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["home-skills"] });
      queryClient.removeQueries({ queryKey: ["skill-detail"] });
    };
  }, [queryClient]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-pv-neutral-grey-50">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
