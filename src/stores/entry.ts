import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

export const useEntryStore = defineStore("entry", () => {
    const count = ref<number>(0)
    const counts = ref<Array<{ type: string, count: number }>>([])
    const table = ref<Array<{ id: number, f3sid: string, type: string, created_at: string }>>([])
    const line_graph_data = ref<Array<{ label: string, data: number[] }>>([])

    function clear() {
        count.value = 0
        counts.value = []
        table.value = []
        line_graph_data.value = []
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

            table.value = data

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

            counts.value = data

            return true
        } catch (e) {
            return false
        }
    }

    // function hour(i: number): number {
    //     return Math.floor(i / 2) + 8;
    // }
    // function minute(i: number): number {
    //     return (i % 2) * 30;
    // }
    async function getData(): Promise<boolean> {
        const headers = new Headers()
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "data/" + "entry", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json())

            // const formattedData: Array<{
            //     name: string,
            //     entries: {
            //         count: number;
            //         hour: number;
            //         minute: number;
            //     }[];
            // }> = data;

            // const datasets = formattedData.map(entry => ({
            //     label: entry.name,
            //     data: Array.from({ length: MAX_LABELS }, (_, i) => {
            //         const data = entry.entries.find(e => e.hour === hour(i) && e.minute === minute(i));
            //         return data ? data.count : 0;
            //     }),
            // }));

            line_graph_data.value = data;

            return true
        } catch (e) {
            return false
        }
    }

    return {
        counts,
        table,
        line_graph_data,
        count,
        sendEntry,
        getTable,
        getCount,
        getEntryCount,
        getData,
        clear
    }
})