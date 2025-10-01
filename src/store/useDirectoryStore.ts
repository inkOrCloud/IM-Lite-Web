import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type DirectoryType = "person" | "group"

interface DirectoryStore {
  addFriendModalOpen: boolean
  createGroupModalOpen: boolean
  manageGroupModalOpen: boolean
  manageGroupMemberModalOpen: boolean
  selectedKey?: number
  directoryType: DirectoryType
  setSelectedKey: (key?: number) => void
  setDirectoryType: (type: DirectoryType) => void
  setAddFriendModalOpen: (open: boolean) => void
  setCreateGroupModalOpen: (open: boolean) => void
  setManageGroupModalOpen: (open: boolean) => void
  setManageGroupMemberModalOpen: (open: boolean) => void
}

export const useDirectoryStore = create<DirectoryStore>()(
  immer<DirectoryStore>((set) => ({
    addFriendModalOpen: false,
    createGroupModalOpen: false,
    directoryType: "person",
    selectedKey: undefined,
    manageGroupModalOpen: false,
    manageGroupMemberModalOpen: false,
    setSelectedKey: (key) => set({selectedKey: key}),
    setDirectoryType: (type) => set({directoryType: type}),
    setAddFriendModalOpen: (open) => set({addFriendModalOpen: open}),
    setCreateGroupModalOpen: (open) => set({createGroupModalOpen: open}),
    setManageGroupModalOpen: (open) => set({manageGroupModalOpen: open}),
    setManageGroupMemberModalOpen: (open) => set({manageGroupMemberModalOpen: open})
  })
))
