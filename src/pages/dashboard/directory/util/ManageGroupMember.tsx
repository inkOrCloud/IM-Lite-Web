import { useState, useMemo, useEffect } from "react";
import { Modal, List, Avatar, Button, Select, Popconfirm, message, Spin, Tag, Form, Flex } from "antd";
import { useDirectoryStore } from "../../../../store/useDirectoryStore";
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "../../../../store/useAuthStore";
import { getFileContent } from "../../../../db/util/FileUtil";
import type { Role } from "../../../../entity/group/GroupMember";
import { setGroupMemberRoleMutation, useGroupMemberQuery } from "../../../../store/useGroupMemberQuery";
import { addMembertoGroup, deleteMemberFromGroup, useGroupMembersQuery } from "../../../../store/useGroupMembersQuery";
import useFriendIdsQuery from "../../../../store/useFriendIdsQuery";
import useUserQuery, { useUserQueries } from "../../../../store/useUserQuery";
import { useDebounceFn } from "ahooks";
import useApp from "antd/es/app/useApp";

const { Option } = Select;

// 自定义Hook用于获取头像URL
function useAvatarUrl(fileId?: string) {
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    const fetchAvatar = async (fileId: string) => {
        try {
            const file = await getFileContent(fileId);
            if (file) {
                const url = URL.createObjectURL(file);
                setAvatarUrl(url);
            }
        } catch (error) {
            console.error("Failed to load avatar:", error);
        }
    };

    if (fileId) {
        fetchAvatar(fileId);
    }

    return avatarUrl;
}

// 用户信息组件
function UserItem({ userId, currentUserRole, groupId }: {
    userId: number;
    currentUserRole: Role;
    groupId: number;
}) {
    const { data: userProfile, isLoading } = useUserQuery(userId);
    const avatarUrl = useAvatarUrl(userProfile?.avatarFileId);
    const { data: memberData } = useGroupMemberQuery(groupId, userId);
    const deleteMemberMutation = deleteMemberFromGroup();
    const setRoleMutation = setGroupMemberRoleMutation();

    const currentUser = useAuthStore(state => state.userInfo);
    const isCurrentUser = currentUser?.userId === userId;

    const handleKick = async () => {
        try {
            await deleteMemberMutation.mutateAsync({
                groupId,
                memberId: userId
            });
            message.success("已成功踢出成员");
        } catch (error) {
            message.error("踢出成员失败");
        }
    };

    const handleRoleChange = async (newRole: Role) => {
        try {
            await setRoleMutation.mutateAsync({
                memberId: userId,
                groupId,
                role: newRole
            });
            message.success("角色修改成功");
        } catch (error) {
            message.error("角色修改失败");
        }
    };

    const canKick = useMemo(() => {
        if (!memberData) return false;

        const targetRole = memberData.role;

        if (currentUserRole === "OWNER") {
            // 群主可以踢出除自己外的所有成员
            return !isCurrentUser;
        }

        if (currentUserRole === "ADMIN") {
            // 管理员只能踢出普通成员
            return targetRole === "MEMBER";
        }

        return false;
    }, [currentUserRole, memberData, isCurrentUser]);

    const canSetRole = useMemo(() => {
        if (!memberData) return false;

        const targetRole = memberData.role;

        // 只有群主可以设置角色，且不能设置自己
        return currentUserRole === "OWNER" && !isCurrentUser && targetRole !== "OWNER";
    }, [currentUserRole, memberData, isCurrentUser]);

    const getRoleText = (role: Role) => {
        const roleMap = {
            OWNER: "群主",
            ADMIN: "管理员",
            MEMBER: "成员"
        };
        return roleMap[role];
    };

    const getRoleColor = (role: Role) => {
        const colorMap = {
            OWNER: "red",
            ADMIN: "blue",
            MEMBER: "default"
        };
        return colorMap[role];
    };

    if (isLoading) {
        return (
            <List.Item>
                <Spin />
            </List.Item>
        );
    }

    if (!userProfile) {
        return null;
    }

    return (
        <List.Item
            actions={[
                canSetRole && (
                    <Select
                        value={memberData?.role}
                        onChange={handleRoleChange}
                        loading={setRoleMutation.isPending}
                        size="small"
                        style={{ width: 100 }}
                    >
                        <Option value="ADMIN">管理员</Option>
                        <Option value="MEMBER">成员</Option>
                    </Select>
                ),
                canKick && (
                    <Popconfirm
                        title="确定要踢出该成员吗？"
                        onConfirm={handleKick}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button
                            size="small"
                            danger
                            loading={deleteMemberMutation.isPending}
                        >
                            踢出
                        </Button>
                    </Popconfirm>
                )
            ].filter(Boolean)}
        >
            <List.Item.Meta
                avatar={<Avatar src={avatarUrl}>{userProfile.name[0]}</Avatar>}
                title={
                    <div>
                        {userProfile.name}
                        {isCurrentUser && <Tag color="green" style={{ marginLeft: 8 }}>自己</Tag>}
                    </div>
                }
                description={
                    <div>
                        <Tag color={getRoleColor(memberData?.role || "MEMBER")}>
                            {getRoleText(memberData?.role || "MEMBER")}
                        </Tag>
                    </div>
                }
            />
        </List.Item>
    );
}

function FriendListItem(props: { friendId: number, name?: string }) {
    const { data: userInfo } = useUserQuery(props.friendId)
    const [avatarUrl, setAvatarUrl] = useState<string>();

    useEffect(() => {
        (async () => {
            if (userInfo?.avatarFileId) {
                const file = await getFileContent(userInfo.avatarFileId)
                if (file) {
                    setAvatarUrl(URL.createObjectURL(file));
                }
            }
        })()
        return () => {
            if (avatarUrl) {
                URL.revokeObjectURL(avatarUrl);
            }
        }
    }, [userInfo, setAvatarUrl])

    return (
        <Flex align="center">
            <Avatar src={avatarUrl} className="mr-2">{userInfo?.name.charAt(0)}</Avatar>
            <span>{userInfo?.name}</span>
        </Flex>
    )
}

function AddGroupMember(props: { groupId: number }) {
    const {message} = useApp()
    const {groupId} = props
    const userId = useAuthStore(state => state.userInfo!.userId)
    const { data: friendIds } = useFriendIdsQuery(userId)
    const queries = useUserQueries(friendIds || [])
    const { mutateAsync } = addMembertoGroup()
    const {run} = useDebounceFn( (groupId, memberId) => {
        mutateAsync({
            groupId: groupId,
            memberId: memberId
        }, {
            onSuccess: () => {
                message.success("添加成员成功")
            },
            onError: () => {
                message.error("添加成员失败")
            }
        })
    }, {wait: 5000, leading: true, trailing: false})
    const onFinish = (values: { memberId: number }) => run(groupId, values.memberId)

    return (
        <Form layout="inline" onFinish={onFinish}>
            <Form.Item className="grow-1" name="memberId">
                <Select
                    showSearch
                    placeholder="请选择要添加的成员"
                    options={queries.map(query => ({
                        value: query.data?.userId,
                        label: query.data?.name
                    }))}
                    optionRender={(option) => <FriendListItem friendId={option.data.value || 0} />}
                    filterOption={(input, option) => {
                        if(option?.value && option.value.toString().includes(input)){
                            return true
                        }
                        if(option?.label && option.label.toLowerCase().includes(input.toLowerCase())) {
                            return true
                        }
                        return false
                    }
                    }
                />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" >添加群成员</Button>
            </Form.Item>
        </Form>
    )
}

export function ManagerGroupMember(props: { groupId: number }) {
    const { groupId } = props;
    const [open, setOpen] = useDirectoryStore(
        useShallow(
            state => [state.manageGroupMemberModalOpen, state.setManageGroupMemberModalOpen]
        )
    );

    useEffect(() => {
        setOpen(false)
    }, [setOpen])

    const currentUser = useAuthStore(state => state.userInfo);
    const { data: members, isLoading } = useGroupMembersQuery(groupId);

    // 获取当前用户在群中的角色
    const currentUserRole = useMemo(() => {
        if (!members || !currentUser) return "MEMBER";
        const currentMember = members.find(member => member.memberId === currentUser.userId);
        return currentMember?.role || "MEMBER";
    }, [members, currentUser]);

    const sortedMembers = useMemo(() => {
        if (!members) return [];

        // 按角色排序：群主 -> 管理员 -> 成员
        const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
        return [...members].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
    }, [members]);

    return (
        <Modal
            open={open}
            onCancel={() => setOpen(false)}
            title="管理群成员"
            footer={null}
            width={600}
            destroyOnHidden={true}
        >
            <AddGroupMember groupId={groupId} />
            <List
                loading={isLoading}
                dataSource={sortedMembers}
                renderItem={(member) => (
                    <UserItem
                        key={member.id}
                        userId={member.memberId}
                        currentUserRole={currentUserRole}
                        groupId={groupId}
                    />
                )}
                locale={{ emptyText: "暂无群成员" }}
            />
        </Modal>
    );
}