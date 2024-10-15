<script setup lang="ts">
import { ref } from 'vue'
import { useNodeStore } from '../stores/node'

const nodeStore = useNodeStore()

const otp = ref("")
const loading = ref(false)
const buttonValue = ref("Login")

async function onSubmit() {
    buttonValue.value = "Loading..."
    loading.value = !loading.value
    if (await nodeStore.sendOTP(otp.value))
        await nodeStore.getNode()

    window.location.reload()
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
        <!-- <dialog :open="isScannerVisible">
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
        </dialog> -->
    </main>
</template>