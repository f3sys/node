import { defineStore } from "pinia"
import { ref } from "vue"

export const useNodeStore = defineStore("node", () => {
    const key = ref("")
    const name = ref("")
    const type = ref("")
    const canSendStatus = ref(false)

    async function setKey(): Promise<boolean> {
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "node", {
                method: "POST",
            }).then((r) => r.json());

            key.value = data.key;
            canSendStatus.value = true;

            return true
        } catch {
            return false
        }
    }

    async function sendOTP(otp: string): Promise<boolean> {
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "node", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ otp }),
            }).then((r) => r.json());

            key.value = data.key;
            canSendStatus.value = true;

            return true
        } catch {
            return false
        }
    }

    async function getNode(): Promise<boolean> {
        const headers = new Headers();
        headers.append("Authorization", "Bearer " + key.value);
        const url = import.meta.env.VITE_API_URL;
        try {
            const data = await fetch(url + "protected/" + "info", {
                method: "GET",
                headers: headers,
            }).then((r) => r.json());

            name.value = data.name
            type.value = data.type

            return true
        } catch {
            return false
        }
    }

    async function sendStatus(charging: boolean, chargingTime: number, dischargingTime: number, level: number) {
        const headers = new Headers()
        headers.append("Authorization", "Bearer " + key.value)
        headers.append("Content-Type", "application/json")
        const url = import.meta.env.VITE_API_URL
        try {
            const response = await fetch(url + "protected/" + "status", {
                method: "PATCH",
                headers: headers,
                body: JSON.stringify({ charging, charging_time: chargingTime ? chargingTime : 0, discharging_time: dischargingTime ? dischargingTime : 0, level })
            })

            return response.ok
        } catch {
            return false
        }
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
        sendOTP,
        getNode,
        sendStatus,
        canSendStatus,
        clear
    }
}, {
    persist: true,
})