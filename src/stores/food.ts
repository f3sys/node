import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

export const useFoodStore = defineStore("food", () => {
    const foods = ref<Array<{ id: number, name: string, price: number, quantity: number }>>([])
    const quantity = ref<number>(0)
    const count = ref<number>(0)
    const counts = ref<Array<{ id: number, name: string, count: number, quantity: number, price: number }>>([])
    const table = ref<Array<{ id: number, f3sid: string, food_id: number, food_name: string, quantity: number, price: number, created_at: string }>>([])
    const line_graph_data = ref<Array<{ label: string, data: number[] }>>([])

    function clear() {
        foods.value = []
        count.value = 0
        quantity.value = 0
        counts.value = []
        table.value = []
        line_graph_data.value = []
    }

    async function getFoods(): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key);
        headers.append("Content-Type", "application/json");
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "foods", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json());

            foods.value = data

            return true
        } catch (e) {
            return false
        }
    }


    async function sendFood(f3sid: string, sendFoods: { id: number; quantity: number; }[]): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + nodeStore.key);
        headers.append("Content-Type", "application/json");
        // change the foods name into id
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "push/" + "foodstall", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ f3sid, foods: sendFoods })
            })

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

    async function getQuantity(): Promise<boolean> {
        const headers = new Headers()
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "quantity", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json())

            quantity.value = data.quantity

            return true
        } catch (e) {
            return false
        }
    }

    async function getFoodCount(): Promise<boolean> {
        const headers = new Headers()
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "food_count", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json())

            counts.value = data

            return true
        } catch (e) {
            return false
        }
    }

    async function updateFood(id: number, food_id: number, quantity: number): Promise<boolean> {
        const headers = new Headers()
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "push/" + "foodstall", {
                method: "PATCH",
                headers: headers,
                body: JSON.stringify({ id, food_id, quantity })
            })

            return data.ok
        } catch (e) {
            return false
        }
    }

    async function getData(): Promise<boolean> {
        const headers = new Headers()
        headers.append("Authorization", "Bearer " + nodeStore.key)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const data = await fetch(url + "protected/" + "data/" + "foodstall", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json())

            line_graph_data.value = data;

            return true
        } catch (e) {
            return false
        }
    }

    // async function getQuantityData(): Promise<boolean> {
    //     const headers = new Headers()
    //     headers.append("Authorization", "Bearer " + nodeStore.key)
    //     headers.append("Content-Type", "application/json")
    //     const url = import.meta.env.VITE_API_URL
    //     try {
    //         const data = await fetch(url + "protected/" + "data/" + "foodstall/" + "quantity", {
    //             method: "GET",
    //             headers: headers,
    //         }).then((r) => r.json())

    //         quantity_data.value = data;

    //         return true
    //     } catch (e) {
    //         return false
    //     }
    // }

    return {
        foods,
        quantity,
        counts,
        count,
        table,
        line_graph_data,
        getFoods,
        sendFood,
        getTable,
        getCount,
        getQuantity,
        getFoodCount,
        getData,
        updateFood,
        clear
    }
})