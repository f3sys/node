import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

export const useExhibitionStore = defineStore("exhibition", () => {
    const count = ref<number>(0)
    const table = ref<Array<{ id: number, f3sid: string, created_at: string }>>([])
    const line_graph_data = ref<Array<{ label: string, data: number[] }>>([])

    function clear() {
        count.value = 0
        table.value = []
        line_graph_data.value = []
    }

    async function update(): Promise<boolean> {
        const [updateResult] = await Promise.all([
            getCount(),
            getTable(),
            getData(),
        ])

        return updateResult
    }

    async function sendExhibition(f3sid: string): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key);
        headers.append("Content-Type", "application/json");
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "push/" + "exhibition", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ f3sid })
            });

            return data.ok
        } catch {
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

            table.value = data

            return true
        } catch {
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
        } catch {
            return false
        }
    }

    async function getData(): Promise<boolean> {
        const headers = new Headers()
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "data/" + "exhibition", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json())

            line_graph_data.value = data;

            return true
        } catch {
            return false
        }
    }

    return {
        table,
        count,
        line_graph_data,
        sendExhibition,
        getTable,
        getCount,
        getData,
        update,
        clear
    }
})