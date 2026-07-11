import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs } from "@/ui";
import workstreamsData from "./data/workstreams/workstreams.json";

export default function HomeLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isWorkstreams = location.pathname.includes("/home/workstreams");
  const isSkillPage = location.pathname.includes("/home/skill");
  const activeIndex = isSkillPage ? null : isWorkstreams ? 1 : 0;

  const handleTabChange = (e) => {
    if (e.index === 0) {
      navigate("/home");
    } else {
      navigate(`/home/workstreams/${workstreamsData[0]?.id}`);
    }
  };

  const tabData = [
    { label: "Home", content: null },
    { label: "Workstreams", content: null }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-grey-50">
      <div className="bg-white border-b border-neutral-300">
        <Tabs
          activeIndex={activeIndex}
          onTabChange={handleTabChange}
          tabData={tabData}
          navClassName="w-fit justify-start px-8 h-[52px]"
          headerClassName="w-auto mx-0"
          showDefaultBottomBorder={false}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
