import { useState, useEffect } from "react";
import UsersTabTable from "./components/UsersTabTable";
import AddUserModal from "./components/AddUserModal";
import { useUserStore } from "./stores/userStore";
import { useShallow } from "zustand/react/shallow";

const getUserFromToken = () => {
  try {
    const token = localStorage.getItem("auth_token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.userRole || payload.role,
      };
    }
  } catch (e) {
    console.error("Failed to decode token:", e);
  }
  return null;
};

export const UserManagement = ({ showInviteButton = true }) => {
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false);

  const { userDetail, setUser } = useUserStore(
    useShallow((state) => ({
      userDetail: state.user,
      setUser: state.setUser
    }))
  );

  useEffect(() => {
    if (!userDetail) {
      const tokenUser = getUserFromToken();
      if (tokenUser) {
        setUser(tokenUser);
      }
    }
  }, [userDetail, setUser]);

  const handleButtonClick = () => {
    setIsInviteUserModalOpen(true);
  };

  const isAdmin = userDetail?.role?.toLowerCase?.() === "admin";

  return (
    <div className="relative flex flex-col flex-1 min-h-full overflow-y-auto bg-[var(--pv-neutral-grey-50)]">
      <UsersTabTable
        itemsPerPage={10}
        tableWrapperClassName="px-4 pb-2 rounded-lg"
        showCheckBox={isAdmin && showInviteButton}
        handleButtonClick={handleButtonClick}
      />
      <AddUserModal isOpen={isInviteUserModalOpen} onClose={() => setIsInviteUserModalOpen(false)} />
    </div>
  );
};

export default UserManagement;
