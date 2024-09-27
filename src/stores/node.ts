import { defineStore } from "pinia"
import { ref } from "vue"

export const useNodeStore = defineStore("node", () => {
    const key = ref("")
    const name = ref("")
    const type = ref("")
    const isReview = ref(false)

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
        isReview.value = data.is_review
    }

    function clear() {
        name.value = "";
        type.value = "";
        isReview.value = false;
    }

    return {
        key,
        name,
        type,
        isReview,
        setKey,
        getNode,
        clear
    }
}, {
    persist: true,
})