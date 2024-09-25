import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

export const useEntryStore = defineStore("entry", () => {
    const entries_count = ref<Array<{ type: string, count: number }>>([])
    const entries_table = ref<Array<{ id: number, f3sid: string, type: string, created_at: string }>>([])

    const count = ref<number>(0)

    function clear() {
        entries_table.value = []
    }

    async function sendEntry(f3sid: string): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key);
        headers.append("Content-Type", "application/json");
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "push/" + "entry", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ f3sid })
            });

            return data.ok
        } catch (e) {
            return false
        }
    }

    async function getTable(): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key);
        headers.append("Content-Type", "application/json");
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "table", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json());

            entries_table.value = []

            data.forEach((entry: { id: number, f3sid: string, type: string, created_at: string }) => {
                const date = new Date(entry.created_at)
                entries_table.value.push({
                    id: entry.id,
                    f3sid: entry.f3sid,
                    type: entry.type,
                    created_at: date.toLocaleTimeString("ja-JP")
                })
            })

            return true
        } catch (e) {
            return false
        }
    }

    async function getCount(): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "count", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json())

            count.value = data.count

            return true
        } catch (e) {
            return false
        }
    }

    async function getEntryCount(): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "entry_count", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json())

            entries_count.value = []

            data.forEach((entry: { type: string, count: number }) => {
                entries_count.value.push({ type: entry.type, count: entry.count })
            })

            return true
        } catch (e) {
            return false
        }
    }

    return {
        entries_count,
        entries_table,
        count,
        sendEntry,
        getTable,
        getCount,
        getEntryCount,
        clear
    }
}, {
    persist: true,
})