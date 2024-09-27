<script setup lang="ts">
import { DetectedBarcode } from 'barcode-detector/pure';
import { ScanQrCode } from 'lucide-vue-next';
import Sqids from 'sqids';
import { ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { useExhibitionStore } from '../stores/exhibition';
import { useNodeStore } from '../stores/node';

const nodeStore = useNodeStore();
const exhibitionStore = useExhibitionStore();

const loading = ref(false);
const buttonValue = ref("Send");

const f3sidInvalid = ref(false)
const f3sid = ref("")
const rating = ref(1)

const isScannerVisible = ref(false)
const isF3SiDScanned = ref(false)

const sqids = new Sqids({
    minLength: 7,
    alphabet: '23456789CFGHJMPQRVWX',
    blocklist: new Set([])
})

const onDetect = async ([firstDetectedCode]: DetectedBarcode[]) => {
    if (sqids.decode(firstDetectedCode.rawValue).length !== 2) return;
    f3sid.value = firstDetectedCode.rawValue;
    isF3SiDScanned.value = true;
    isScannerVisible.value = false;
};

const onClickScan = (() => {
    isScannerVisible.value = isScannerVisible.value ? false : true;
})

function toggleButton() {
    buttonValue.value = buttonValue.value === "Send" ? "Loading..." : "Send";
    loading.value = !loading.value;
}

async function onSubmit() {
    toggleButton()
    if (f3sid.value === '' || sqids.decode(f3sid.value).length !== 2) {
        loading.value = false;
        f3sidInvalid.value = true;
    } else {
        f3sidInvalid.value = false;
    }

    if (f3sidInvalid.value) {
        loading.value = false;
        return;
    }

    const sendFoodResult = await exhibitionStore.sendReview(f3sid.value, Number(rating.value));

    if (sendFoodResult) {
        f3sid.value = '';
        rating.value = 1;
    }

    toggleButton()
}
</script>
<template>
    <main class="container max-w-lg">
        <article>
            <header>
                <hgroup class="mb-0">
                    <h2>{{ nodeStore.name }}</h2>
                    <p>{{ nodeStore.type.charAt(0) + nodeStore.type.toLowerCase().slice(1) }}
                    </p>
                </hgroup>
            </header>
            <form @submit.prevent="onSubmit">
                <fieldset>
                    <fieldset :disabled="loading">
                        <label>
                            F3SiD
                            <fieldset role="group" style="margin-top: calc(var(--pico-spacing) * .25)"
                                :aria-invalid="f3sidInvalid" aria-describedby="f3sid-helper">
                                <input v-model="f3sid" name="f3sid" class="!h-10" />
                                <button type="submit" @click.prevent="onClickScan"
                                    class="flex items-center justify-center !size-10 !p-0">
                                    <ScanQrCode class="m-2 size-6" />
                                </button>
                            </fieldset>
                            <small v-if="f3sidInvalid" id="f3sid-helper">
                                Please provide a valid F3SiD!
                            </small>
                        </label>
                    </fieldset>
                    <label>
                        Rating: <span class="!text-[--pico-primary]">{{ rating }}</span>
                        <input type="range" v-model="rating" min="1" max="5" :disabled="loading" />
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
                    <hgroup style="margin-bottom: 0px;">
                        <h2>F3SiD</h2>
                        <p>Scan the F3SiD</p>
                    </hgroup>
                </header>
                <QrcodeStream :paused="!isScannerVisible" @detect="onDetect" />
                <footer>
                    <button @click="isScannerVisible = isScannerVisible ? false : true;" class="secondary">
                        Close
                    </button>
                </footer>
            </article>
        </dialog>
    </main>
</template>