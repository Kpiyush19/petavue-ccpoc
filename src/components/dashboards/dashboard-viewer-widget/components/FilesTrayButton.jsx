import { useState } from 'react';
import { ClickAwayListener, Fade, Popper } from '@mui/material';
import { Files } from '@phosphor-icons/react';
import { Button } from '@/common-components';

export default function FilesTrayButton({
  sessionId,
  onFileClick,
  useGetWorkspaceFiles,
  files: propFiles,
  isLoading: propIsLoading,
  onRefresh: propOnRefresh,
  WorkspaceTray,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const hookResult = useGetWorkspaceFiles?.(sessionId, {
    enabled: !!sessionId,
  });

  const filesData = hookResult?.data ?? propFiles;
  const isLoading = hookResult?.isLoading ?? propIsLoading ?? false;
  const refetch = hookResult?.refetch ?? propOnRefresh;

  const files = filesData?.files || filesData || [];

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = (event) => {
    if (event?.target?.closest('.analytics-chat__artifact-overlay')) {
      return;
    }
    setAnchorEl(null);
  };

  const handleFileClick = (file) => {
    onFileClick?.(file);
  };

  if (!WorkspaceTray) {
    return (
      <Button onClick={handleClick} btnColor="ghost" btnSize="sm">
        <Files size={14} weight={open ? 'fill' : 'regular'} />
        Files
      </Button>
    );
  }

  return (
    <>
      <Button onClick={handleClick} btnColor="ghost" btnSize="sm">
        <Files size={14} weight={open ? 'fill' : 'regular'} />
        Files
      </Button>

      <Popper
        open={open}
        anchorEl={anchorEl}
        transition
        placement="top-start"
        disablePortal
        style={{ zIndex: 5 }}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Fade {...TransitionProps} timeout={200}>
              <div
                className="bg-white rounded-lg shadow-lg border border-[var(--pv-neutral-grey-200)] overflow-hidden"
                style={{ width: 340, height: 460 }}
                data-theme="light"
              >
                <WorkspaceTray
                  files={files}
                  loading={isLoading}
                  onRefresh={refetch}
                  onFileClick={handleFileClick}
                  title="Session Files"
                  showHeader={true}
                  className="h-full"
                />
              </div>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}
