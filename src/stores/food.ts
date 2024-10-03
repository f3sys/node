import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

export const useFoodStore = defineStore("food", () => {
    const foods = ref<Array<{ id: number, name: string, price: number, quantity: number }>>([])
    const foods_count = ref<Array<{ id: number, name: string, count: number, quantity: number }>>([])
    const foods_table = ref<Array<{ id: number, f3sid: string, food_id: number, food_name: string, quantity: number, price: string, created_at: string }>>([])
    // const foods_line_graph_data = ref<Array<{ name: string, foods: Array<{ count: number, hour: number, minute: number }> }>>([])
    const foods_line_graph_data = ref<Array<{ label: string, data: number[] }>>([])
    const MAX_LABELS = 21;

    // const count = ref<number>(0)

    function clear() {
        foods.value = []
        foods_count.value = []
        foods_table.value = []
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

            foods.value = []

            data.forEach((food: { id: number, name: string, price: number, quantity: number }) => {
                foods.value.push({ id: food.id, name: food.name, price: food.price, quantity: food.quantity })
            })

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

            foods_table.value = []

            data.forEach((food: { id: number, f3sid: string, food_id: number, food_name: string, quantity: number, price: number, created_at: string }) => {
                const date = new Date(food.created_at)
                foods_table.value.push({
                    id: food.id,
                    f3sid: food.f3sid,
                    food_id: food.food_id,
                    food_name: food.food_name,
                    quantity: food.quantity,
                    price: (food.price * food.quantity).toLocaleString("ja-JP", { style: "currency", currency: "JPY" }),
                    created_at: date.toLocaleTimeString("ja-JP")
                })
            })

            return true
        } catch (e) {
            return false
        }
    }

    // async function getCount(): Promise<boolean> {
    //     const headers = new Headers();
    //     headers.append("Authorization", "Bearer " + nodeStore.key)
    //     headers.append("Content-Type", "application/json")
    //     const url = import.meta.env.VITE_API_URL
    //     try {
    //         const data = await fetch(url + "protected/" + "count", {
    //             method: "GET",
    //             headers: headers,
    //         }).then((r) => r.json())

    //         count.value = data.count

    //         return true
    //     } catch (e) {
    //         return false
    //     }
    // }


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

            foods_count.value = []

            data.forEach((food: { id: number, name: string, count: number, quantity: number }) => {
                foods_count.value.push({ id: food.id, name: food.name, count: food.count, quantity: food.quantity })
            })

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

    function hour(i: number): number {
        return Math.floor(i / 2) + 8;
    }
    function minute(i: number): number {
        return (i % 2) * 30;
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

            const formattedData: Array<{
                name: string,
                foods: {
                    count: number;
                    hour: number;
                    minute: number;
                }[];
            }> = data;

            const datasets = formattedData.map(food => ({
                label: food.name,
                data: Array.from({ length: MAX_LABELS }, (_, i) => {
                    const foodData = food.foods.find(f => f.hour === hour(i) && f.minute === minute(i));
                    return foodData ? foodData.count : 0;
                }),
            }));

            const totalCountData = Array.from({ length: MAX_LABELS }, (_, i) => {
                return formattedData.reduce((acc, food) => {
                    const foodData = food.foods.find(f => f.hour === hour(i) && f.minute === minute(i));
                    return acc + (foodData ? foodData.count : 0);
                }, 0);
            });

            const totalQuantityData = Array.from({ length: MAX_LABELS }, (_, i) => {
                return formattedData.reduce((acc, food) => {
                    const foodLocalData = foods.value.find(f => f.name === food.name);
                    const foodData = food.foods.find(f => f.hour === hour(i) && f.minute === minute(i));
                    return acc + (foodData && foodLocalData ? foodData.count * (foodLocalData.quantity || 0) : 0);
                }, 0);
            });

            datasets.push({
                label: "Total Count",
                data: totalCountData,
            });

            datasets.push({
                label: "Total Quantity",
                data: totalQuantityData,
            });

            foods_line_graph_data.value = datasets;

            return true
        } catch (e) {
            return false
        }
    }

    // async function sendReview(f3sid: string, rating: number): Promise<boolean> {
    //     const headers = new Headers();
    //     headers.append("Authorization", "Bearer " + nodeStore.key);
    //     headers.append("Content-Type", "application/json");
    //     const url = import.meta.env.VITE_API_URL;
    //     try {
    //         const data = await fetch(url + "protected/" + "review/" + "foodstall", {
    //             method: "POST",
    //             headers: headers,
    //             body: JSON.stringify({ f3sid, rating })
    //         });

    //         return data.ok
    //     } catch (e) {
    //         return false
    //     }
    // }

    return {
        foods,
        foods_count,
        foods_table,
        foods_line_graph_data,
        getFoods,
        sendFood,
        getTable,
        // getCount,
        getFoodCount,
        getData,
        updateFood,
        // sendReview,
        clear
    }
})