<script setup lang="ts">
import { ref } from 'vue'
import { useNodeStore } from '../stores/node'
import { type DetectedBarcode } from 'barcode-detector'
import { QrcodeStream } from 'vue-qrcode-reader'

const nodeStore = useNodeStore()

const otp = ref("")

const loading = ref(false)
const isScannerVisible = ref(false)
const buttonValue = ref("Login")

function toggleButtonAndScanner() {
    buttonValue.value = buttonValue.value === "Login" ? "Loading..." : "Login"
    loading.value = !loading.value
    isScannerVisible.value = isScannerVisible.value ? false : true
}

const onDetect = async ([firstDetectedCode]: DetectedBarcode[]) => {
    otp.value = firstDetectedCode.rawValue
    isScannerVisible.value = false
    if (await nodeStore.sendOTP(otp.value)) {
        await nodeStore.getNode()
    }
    window.location.reload()
}

async function onSubmit() {
    toggleButtonAndScanner()
}
</script>

<template>
    <main class="container max-w-lg">
        <article>
            <form @submit.prevent="onSubmit">
                <fieldset>
                    <label>
                        Name
                        <input :value="nodeStore.name" :disabled="loading" name="name" readonly />
                    </label>
                    <label>
                        Type
                        <input :value="nodeStore.type" :disabled="loading" name="type" readonly />
                    </label>
                </fieldset>

                <button type="submit" :aria-busy="loading" :disabled="loading">
                    {{ buttonValue }}
                </button>
            </form>
        </article>
        <dialog :open="isScannerVisible">
            <article class="max-w-lg">
                <header>
                    <hgroup style="margin-bottom: 0px">
                        <h2>F3SiD</h2>
                        <p>Scan the F3SiD</p>
                    </hgroup>
                </header>
                <QrcodeStream :paused="!isScannerVisible" @detect="onDetect" />
                <footer>
                    <button @click="toggleButtonAndScanner()" class="secondary">
                        Close
                    </button>
                </footer>
            </article>
        </dialog>
    </main>
</template>