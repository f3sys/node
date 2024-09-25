import { defineStore } from "pinia"
import { ref } from "vue"

export const useNodeStore = defineStore("node", () => {
    const key = ref("")
    const name = ref("")
    const type = ref("")

    async function setKey() {
        const url = import.meta.env.VITE_API_URL;
        const response = await fetch(url + "node", {
            method: "POST",
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (data.key !== undefined) {
            key.value = data.key;
        }
    }

    async function getNode() {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + key.value);
        headers.append("Content-Type", "application/json");
        const url = import.meta.env.VITE_API_URL;
        const data = await fetch(url + "protected/" + "info", {
            method: "GET",
            headers: headers,
        }).then((r) => r.json());

        name.value = data.name
        type.value = data.type
    }

    function clear() {
        name.value = "";
        type.value = "";
    }

    return {
        key,
        name,
        type,
        setKey,
        getNode,
        clear
    }
}, {
    persist: true,
})