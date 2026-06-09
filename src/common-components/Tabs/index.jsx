import { TabView as PrTabView, TabPanel as PrTabPanel } from "primereact/tabview";
import { twJoin, twMerge } from "tailwind-merge";

const textSizeClassnames = {
  small: "text-xs px-4 pt-3 pb-2",
  medium: "text-sm px-5 pt-4 pb-3",
  large: "text-base px-6 pt-5 pb-4"
};

export const Tabs = ({
  className,
  activeIndex = 0,
  onTabChange,
  tabData = [],
  size = "medium",
  extended = false,
  headerActionClassName,
  disabled = false,
  headerClassName,
  navClassName,
  styleClass,
  showDefaultBottomBorder = true,
  activeBorderClassName = ""
}) => {
  return (
    <>
      {tabData.length > 0 ? (
        <PrTabView
          className={`${className}`}
          activeIndex={activeIndex}
          onTabChange={onTabChange}
          pt={{
            root: {
              className: "w-full",
              ...(styleClass && { style: styleClass?.wrapper })
            },
            nav: {
              className: twMerge("p-0 m-0 w-fit xl:w-full flex justify-center", twJoin(navClassName && navClassName)),
              style: {
                listStyleType: "none"
              }
            },
            panelContainer: {
              className: "p-0 h-full"
            }
          }}
        >
          {tabData.map((elem, index) => {
            return (
              <PrTabPanel
                header={elem.label}
                key={index}
                leftIcon={elem.leftIcon}
                rightIcon={elem.RightIcon}
                pt={{
                  root: { className: "h-full" },
                  header: ({ context }) => ({
                    className: twMerge(
                      `w-full`,
                      extended ? `px` : `mx-4`,
                      context.index === activeIndex
                        ? `border-pv-primary-primary-500 border-b-4 text-pv-primary-primary-500 ${activeBorderClassName}`
                        : showDefaultBottomBorder
                          ? `border-pv-neutral-grey-100 border-b`
                          : ``,
                      headerClassName && headerClassName,
                      disabled ? `border-pv-neutral-grey-300` : ``
                    ),
                    style: {
                      minWidth: "fit-content"
                    }
                  }),
                  headerAction: ({ context }) => ({
                    className: twMerge(
                      "hover:no-underline focus:no-underline border-none hover:text-pv-primary-primary-500 flex items-center justify-center cursor-pointer",
                      headerActionClassName && headerActionClassName,
                      disabled
                        ? "text-t-disabled hover:text-t-disabled focus:text-t-disabled font-normal cursor-not-allowed"
                        : context.index === activeIndex
                          ? `text-pv-primary-primary-500 focus:text-pv-primary-primary-500 font-medium`
                          : `text-pv-text-primary-text font-normal`,
                      textSizeClassnames[size]
                    )
                  })
                }}
              >
                {elem.content}
              </PrTabPanel>
            );
          })}
        </PrTabView>
      ) : (
        <></>
      )}
    </>
  );
};

export default Tabs;
