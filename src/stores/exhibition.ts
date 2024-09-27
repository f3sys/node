import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

export const useExhibitionStore = defineStore("exhibition", () => {
    const exhibitions_table = ref<Array<{ id: number, f3sid: string, created_at: string }>>([])

    const count = ref<number>(0)

    function clear() {
        exhibitions_table.value = []
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

            exhibitions_table.value = []

            data.forEach((food: { id: number, f3sid: string, created_at: string }) => {
                const date = new Date(food.created_at)
                exhibitions_table.value.push({
                    id: food.id,
                    f3sid: food.f3sid,
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

    async function sendReview(f3sid: string, rating: number): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key);
        headers.append("Content-Type", "application/json");
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "review/" + "exhibition", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ f3sid, rating })
            });

            return data.ok
        } catch (e) {
            return false
        }
    }

    return {
        exhibitions_table,
        count,
        sendExhibition,
        sendReview,
        getTable,
        getCount,
        clear
    }
}, {
    persist: true,
})