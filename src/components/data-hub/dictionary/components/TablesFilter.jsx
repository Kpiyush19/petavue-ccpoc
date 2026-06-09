import { Funnel } from '@phosphor-icons/react';
import { Popper } from '@/common-components/Popper';

const TablesFilter = ({
  isLoading,
  filter,
  setFilter,
  noCols,
}) => {
  const filters = ['All', 'Enabled for analysis', 'Disabled for analysis'];
  const hasActiveFilter = filter !== 'All';

  const getButtonClass = () => {
    if (isLoading || noCols) {
      return '!bg-[var(--pv-neutral-grey-100)] !text-[var(--pv-neutral-grey-300)] !border-transparent';
    }
    if (hasActiveFilter) {
      return '!border-[var(--pv-primary-500)] !bg-[var(--pv-primary-50)] !text-[var(--pv-primary-500)]';
    }
    return '!border-[var(--pv-neutral-grey-200)] !bg-white !text-[var(--pv-neutral-grey-600)] hover:!bg-[var(--pv-neutral-grey-50)]';
  };

  return (
    <Popper
      placement="bottom-end"
      disabled={isLoading || noCols}
      btnSize="sm"
      btnColor="secondary ghost"
      mainBtnClassName={`!w-8 !h-8 !p-0 !rounded-lg ${getButtonClass()}`}
      popperStyle={{ width: '200px' }}
      buttonChildren={
        <Funnel size={14} weight={hasActiveFilter ? 'fill' : 'bold'} />
      }
    >
      {({ close }) => (
        <div className="flex flex-col">
          {filters.map((f) => (
            <label
              key={f}
              className="px-4 py-3 flex gap-2 items-center hover:bg-[var(--pv-primary-50)] cursor-pointer"
              style={{ accentColor: 'var(--pv-primary-500)' }}
            >
              <input
                type="radio"
                checked={filter === f}
                onChange={() => {
                  setFilter(f);
                  close();
                }}
              />
              {f}
            </label>
          ))}
        </div>
      )}
    </Popper>
  );
};

export default TablesFilter;
