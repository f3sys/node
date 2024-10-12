import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

export const useBatteryStore = defineStore("battery", () => {
    const table = ref<Array<{ node_name: string, node_id: number, level: number, charging_time: number, discharging_time: number, charging: boolean }>>([])

    function clear() {
        table.value = []
    }

    async function update(): Promise<boolean> {
        const [updateResult] = await Promise.all([
            getTable(),
        ])

        return updateResult
    }

    async function getTable(): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key);
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "battery", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json());

            table.value = data

            return true
        } catch {
            return false
        }
    }

    return {
        table,
        clear,
        update,
    }
})