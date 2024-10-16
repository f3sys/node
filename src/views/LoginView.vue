<script setup lang="ts">
import { ref } from 'vue'
import { useNodeStore } from '../stores/node'
import ScannerComponent from '@/components/ScannerComponent.vue';

const nodeStore = useNodeStore()

const otp = ref("")
const loading = ref(false)
const buttonValue = ref("Login")

const onDetect = async (firstDetectedCode: DetectedBarcode) => {
    // const decoded = sqids.decode(firstDetectedCode.rawValue)
    // if (decoded.length !== 2)
    //     window.location.reload()

    otp.value = firstDetectedCode.rawValue

    if (await nodeStore.sendOTP(otp.value))
        await nodeStore.getNode()

    window.location.reload()
    // await onSubmit()
}

async function onSubmit() {
    buttonValue.value = "Loading..."
    loading.value = !loading.value
    // if (await nodeStore.sendOTP(otp.value))
    //     await nodeStore.getNode()

    // window.location.reload()
}
</script>

<template>
    <main class="container max-w-lg">
        <article>
            <form @submit.prevent="onSubmit">
                <fieldset>
                    <label>
                        OTP
                        <input v-model="otp" :aria-busy="loading" :disabled="loading" name="otp" />
                    </label>
                </fieldset>

                <button type="submit" :aria-busy="loading" :disabled="loading">
                    {{ buttonValue }}
                </button>
            </form>
        </article>
        <ScannerComponent v-model="loading" @onDetect="onDetect" />
    </main>
</template>