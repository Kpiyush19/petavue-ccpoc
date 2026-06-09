import { useEffect, useMemo, useState } from "react";
import { DotsThree, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import RemoveUserModal from "./RemoveUserModal";
import AssignRoleModal from "./AssignRoleModal";
import EditUserModal from "./EditUserModal";
import Avatar from "./Avatar";
import Skeleton from "./Skeleton";
import Button from "./Button";
import Input from "./Input";
import Dropdown from "./Dropdown";
import Menu from "./Menu";
import CheckBox from "./CheckBox";
import TableWithPagination from "./TableWithPagination";
import { useGetAllUsers } from "../api/getAllUsers";
import { useDeleteUser } from "../api/deleteUser";
import { useUpdateRole } from "../api/updateRole";
import { useReinvite } from "../api/reinviteUser";

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const tabButtonText = "Add User";

const UserTableSkeleton = ({ len = 10, showFullSkeleton = true }) => {
  const colSectors = showFullSkeleton ? "5% 25% 25% 10% 20% 15%" : "35% 35% 10% 20%";

  return (
    <div className="flex flex-col w-full px-4">
      <div className="grid bg-[var(--pv-neutral-grey-50)] rounded-t-lg" style={{ gridTemplateColumns: colSectors }}>
        {showFullSkeleton && (
          <div className="w-full p-2">
            <Skeleton width={19} height={19} />
          </div>
        )}
        {["Name", "Email", "Role", "Added", ""].slice(0, showFullSkeleton ? 5 : 4).map((_, idx) => (
          <div key={idx} className="w-full p-2">
            <Skeleton width="40%" height={19} />
          </div>
        ))}
      </div>
      {Array.from({ length: len }).map((_, ind) => (
        <div className="grid h-[64px] items-center" style={{ gridTemplateColumns: colSectors }} key={ind}>
          {showFullSkeleton && (
            <div className="w-full p-2">
              <Skeleton width={19} height={19} />
            </div>
          )}
          {[1, 2, 3, 4, 5].slice(0, showFullSkeleton ? 5 : 4).map((_, idx) => (
            <div key={idx} className="w-full p-2">
              <Skeleton width={ind % 2 === 0 ? "70%" : "50%"} height={19} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const UsersTabTable = ({ tableWrapperClassName, itemsPerPage, showCheckBox = true, handleButtonClick }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRemovingUser, setRemovingUser] = useState(false);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [rowChecked, setRowChecked] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [isEditingUser, setEditingUser] = useState(false);
  const [selectedData, setSelectedData] = useState();
  const [selectAll, setSelectAll] = useState(false);
  const [initLoad, setInitLoad] = useState(true);

  const deleteUserMutation = useDeleteUser();
  const updateRoleMutation = useUpdateRole();
  const reinviteUser = useReinvite();

  const handleDeleteUser = (e, data) => {
    e.stopPropagation();
    setRemovingUser(true);
    setSelectedData(data);
    setSelectedRole("");
    setSelectAll(false);
  };

  const handleEditUser = (e, data) => {
    e.stopPropagation();
    setEditingUser(true);
    setSelectedData(data);
  };

  const selectedUsersCount = rowChecked.length;

  const columns = showCheckBox
    ? ["CheckBox", "User Name", "User Email", "Role", "Added", "Actions"]
    : ["User Name", "User Email", "Role", "Added"];

  const assignRole = ["Admin", "User"];

  const handleToggleAllRows = (val) => {
    if (!val) {
      setRowChecked([]);
      setSelectedUserName([]);
      setSelectAll(false);
    } else {
      const updatedRowChecked = [];
      const selectedData = [];
      filteredUsers?.forEach((res) => {
        selectedData.push(res);
        updatedRowChecked.push(res?.userId);
      });
      setRowChecked(updatedRowChecked);
      setSelectedUserName(selectedData);
      setSelectAll(true);
    }
  };

  const handleToggleRow = (row, value) => {
    setSelectedData(row);

    if (value) {
      setRowChecked((prev) => [...prev, row.userId]);
      setSelectedUserName((prevUsers) => [...prevUsers, row]);
    } else {
      setRowChecked((prev) => prev.filter((id) => id !== row?.userId));
      setSelectedUserName((prevUsers) => prevUsers.filter((user) => user?.userId !== row?.userId));
    }
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setAssignModalOpen(true);
  };

  const getAllUserQuery = useGetAllUsers({
    data: {
      teamInfo: true,
      name: searchQuery || ""
    },
    config: {
      staleTime: Infinity
    }
  });

  const filteredUsers = useMemo(() => {
    if (!getAllUserQuery?.data) return [];
    return getAllUserQuery.data.filter((user) => !user?.email?.toLowerCase().includes("@petavue.com"));
  }, [getAllUserQuery?.data]);

  useEffect(() => {
    if (!getAllUserQuery.isLoading) {
      setInitLoad(false);
    }
  }, [getAllUserQuery.isLoading]);

  function getInitials(fullName) {
    const names = fullName?.split(" ");
    const initials = names?.map((name) => name[0]);
    return initials?.join("").toUpperCase();
  }

  return (
    <>
      <div className="bg-white rounded-lg m-4 pt-4 min-w-[900px]">
        <div className="flex px-4 items-center justify-between pb-2">
          <div className="flex gap-4 items-center">
            <p className="font-normal text-sm leading-5 text-[var(--pv-neutral-grey-900)]">
              {selectedUsersCount > 0
                ? `Users Selected: ${selectedUsersCount}`
                : `Users: ${filteredUsers?.length || ""}`}
            </p>
            {selectedUsersCount > 0 && (
              <div className="flex gap-4 items-center">
                <Dropdown title="Assign Role" options={assignRole} onSelect={handleRoleSelection} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {initLoad ? (
              <Skeleton width={240} height={36} />
            ) : (
              <Input
                icon={<MagnifyingGlass size={18} className="text-[var(--pv-neutral-grey-400)]" />}
                clearIcon={searchQuery && <X size={15} className="text-[var(--pv-neutral-grey-400)] cursor-pointer" />}
                onClear={() => setSearchQuery("")}
                placeholder="Search by User Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                containerClassName="w-72"
              />
            )}
            {showCheckBox &&
              (getAllUserQuery.isLoading ? (
                <Skeleton width={110} height={36} />
              ) : (
                <Button onClick={() => handleButtonClick(tabButtonText)}>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Plus size={16} className="shrink-0" />
                    {tabButtonText}
                  </span>
                </Button>
              ))}
          </div>
        </div>
        {getAllUserQuery.isLoading ? (
          <div className="flex justify-center pb-4 items-center">
            <UserTableSkeleton len={10} showFullSkeleton={showCheckBox} />
          </div>
        ) : (
          <TableWithPagination
            checkBoxOnChange={handleToggleAllRows}
            checkBoxValue={selectAll}
            items={filteredUsers?.map((row, rowIndex) => ({
              CheckBox: (
                <div>
                  <CheckBox
                    key={`${rowChecked?.includes(row?.userId)}-${row.userId}`}
                    checked={rowChecked?.includes(row?.userId)}
                    onChange={(val) => handleToggleRow(row, val)}
                  />
                </div>
              ),
              "User Name": (
                <div className="flex gap-3 items-center">
                  {row.name && (
                    <>
                      <Avatar name={getInitials(row?.name)} fullName={row?.name} />
                      <span className="text-xs font-normal">{row?.name}</span>
                    </>
                  )}
                </div>
              ),
              "User Email": <p className="text-[var(--pv-neutral-grey-500)] text-xs">{row?.email}</p>,
              Role: row?.role.charAt(0).toUpperCase() + row?.role.slice(1).toLowerCase(),
              Added: (
                <div className="flex gap-3 items-center">
                  <Avatar name={getInitials(row?.createdByName)} fullName={row?.createdByName} />
                  <span className="text-xs font-normal">{formatDate(row?.createdOn)}</span>
                </div>
              ),
              Actions: (
                <Menu
                  trigger={
                    <DotsThree size={32} className="text-[var(--pv-neutral-grey-500)] hover:bg-[var(--pv-primary-100)] rounded-lg cursor-pointer" />
                  }
                  items={[
                    ...(row?.displayInviteUserOption
                      ? [
                          {
                            label: "Resend Invite",
                            onClick: async () => {
                              await reinviteUser.mutateAsync({ data: row });
                            }
                          }
                        ]
                      : []),
                    {
                      label: "Edit",
                      onClick: (e) => handleEditUser(e, row)
                    },
                    {
                      label: "Delete",
                      onClick: (e) => handleDeleteUser(e, row)
                    }
                  ]}
                />
              )
            }))}
            columns={columns}
            itemsPerPage={itemsPerPage || 12}
            tableWrapperClassName={tableWrapperClassName}
            checkBoxDisabled={!filteredUsers?.length}
          />
        )}
      </div>

      <AssignRoleModal
        isModalOpen={isAssignModalOpen}
        isModalClose={() => {
          setAssignModalOpen(false);
          setSelectedRole("");
          setSelectAll(false);
        }}
        selectedUserName={selectedUserName}
        selectedRole={selectedRole}
        onUpdate={() => {
          updateRoleMutation.mutateAsync({
            data: {
              userIds: rowChecked,
              role: selectedRole.toLowerCase()
            }
          });
          setSelectedUserName([]);
          setAssignModalOpen(false);
          setRowChecked([]);
          setSelectedRole("");
          setSelectAll(false);
        }}
      />
      <EditUserModal isOpen={isEditingUser} onClose={() => setEditingUser(false)} selectedData={selectedData} />
      <RemoveUserModal
        isModalOpen={isRemovingUser}
        isModalClose={() => setRemovingUser(false)}
        onDelete={async () => {
          await deleteUserMutation.mutateAsync({ id: selectedData?.userId });
          setRemovingUser(false);
          setRowChecked([]);
          setSelectedUserName([]);
        }}
      />
    </>
  );
};

export default UsersTabTable;
