import { defineStore } from "pinia"
import { ref } from "vue"
import { useNodeStore } from "./node"

const nodeStore = useNodeStore()

const nodeType = [
    // { name: "House of Horror", type: "EXHIBITION" },
    { name: "テストケバブ店", type: "FOODSTALL" },
    { name: "テスト入り口", type: "ENTRY" },
    { name: "テスト体験", type: "EXHIBITION" },
    { name: "テスト管理1", type: "BATTERY" },
    { name: "技術部", type: "FOODSTALL" },
    { name: "な〜んちゃって縁日", type: "EXHIBITION" },
    { name: "酢虎苦阿兎十", type: "EXHIBITION" },
    { name: "B級グルメオリンピック", type: "EXHIBITION" },
    { name: "House of Horror", type: "EXHIBITION" },
    { name: "水星魔法通り八丁目", type: "EXHIBITION" },
    { name: "帰れま銭湯", type: "EXHIBITION" },
    { name: "火星戦線異状あり", type: "EXHIBITION" },
    { name: "すごろくpeople", type: "EXHIBITION" },
    { name: "足つぼ地獄", type: "EXHIBITION" },
    { name: "Venus宇宙軍基地", type: "EXHIBITION" },
    { name: "美女と野獣 ~Beauty and the beast~", type: "EXHIBITION" },
    { name: "Doki Doki★5 クエスチョン", type: "EXHIBITION" },
    { name: "KMC", type: "FOODSTALL" },
    { name: "MercuDonald's", type: "FOODSTALL" },
    { name: "たこうちまさやき", type: "FOODSTALL" },
    { name: "色とり鶏", type: "FOODSTALL" },
    { name: "〜彩〜", type: "FOODSTALL" },
    { name: "あいびいも", type: "FOODSTALL" },
    { name: "だがし屋あらちゃん", type: "FOODSTALL" },
    { name: "POP  ICE", type: "FOODSTALL" },
    { name: "むらかぬれ", type: "FOODSTALL" },
    { name: "まさたかすてら", type: "FOODSTALL" },
    { name: "せいぼじゃぱん", type: "FOODSTALL" },
    { name: "生徒会販売", type: "FOODSTALL" },
    { name: "ROTA", type: "FOODSTALL" }
]

export const useBatteryStore = defineStore("battery", () => {
    // const dataTable = ref<Array<{ node_name: string, node_id: number, level: number, charging_time: number, discharging_time: number, charging: boolean }>>([])
    const table = ref<Array<{ node_name: string, node_id: number, node_type: string, level: number, charging_time: number, discharging_time: number, charging: boolean }>>([])

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

            // while loop find node_type and add to table
            table.value = table.value.map(item => {
                const node = nodeType.find((node) => node.name === item.node_name)
                return {
                    ...item,
                    node_type: node ? node.type : "UNKNOWN"
                }
            })

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