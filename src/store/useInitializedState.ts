import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface InitializedState {
    initializedKey: Record<string, boolean>,
    setInitializedKey: (key: string) => void
}

export default create<InitializedState>()(immer(
    (set) => ({
        initializedKey: {},
        setInitializedKey: (key: string) => {set((state) => {
            state.initializedKey = {
                ...state.initializedKey,
                [key]:true
            }
        })}
    })
))