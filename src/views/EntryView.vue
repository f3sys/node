<script setup lang="ts">
import { type DetectedBarcode } from "barcode-detector/pure";
import { ScanQrCode, Send } from "lucide-vue-next";
import Sqids from "sqids";
import { ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { useEntryStore } from "../stores/entry";
import { useNodeStore } from '../stores/node';

const nodeStore = useNodeStore()
const entryStore = useEntryStore()

const isLoading = ref(false);

const isScannerVisible = ref(false)
const isF3SiDScanned = ref(false)

const f3sid = ref("")

const f3sidInvalid = ref(false)

const sqids = new Sqids({
    minLength: 7,
    alphabet: '23456789CFGHJMPQRVWX',
    blocklist: new Set([])
})

const onDetect = async ([firstDetectedCode]: DetectedBarcode[]) => {
    if (sqids.decode(f3sid.value).length !== 2) return;
    f3sid.value = firstDetectedCode.rawValue;
    isF3SiDScanned.value = true;
    isScannerVisible.value = false;
};

const onClickScan = (() => {
    isScannerVisible.value = isScannerVisible.value ? false : true;
})

const onSubmit = async () => {
    isLoading.value = true;

    if (f3sid.value === '' || sqids.decode(f3sid.value).length !== 2) {
        isLoading.value = false;
        f3sidInvalid.value = true;
    } else {
        f3sidInvalid.value = false;
    }

    if (f3sidInvalid.value) {
        isLoading.value = false;
        return;
    }

    const sendFoodResult = await entryStore.sendEntry(f3sid.value);

    if (sendFoodResult) {
        const [tableFoodResult] = await Promise.all([
            entryStore.getTable(),
            entryStore.getCount(),
            entryStore.getEntryCount()
        ]);
        if (tableFoodResult) {
            f3sid.value = '';
        }
    }

    isLoading.value = false;
}
</script>

<template>
    <main class="container-fluid">
        <div class="parent">
            <div class="Order">
                <article>
                    <header>
                        <hgroup class="mb-0">
                            <h2>{{ nodeStore.name }}</h2>
                            <p>{{ nodeStore.type.charAt(0) + nodeStore.type.toLowerCase().slice(1) }}
                            </p>
                        </hgroup>
                    </header>
                    <form @submit.prevent="onSubmit">
                        <fieldset :disabled="isLoading">
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

                        <button type="submit" class="mb-0 flex items-center" :aria-busy="isLoading"
                            :disabled="isLoading">
                            <div class="flex items-center mx-auto">
                                <Send class="size-4 mr-1" />
                                <span class="text-size-lg">Send</span>
                            </div>
                        </button>
                    </form>
                </article>
            </div>
            <div class="Stats">
                <article>
                    <header>
                        <hgroup class="mb-0">
                            <h2>統計</h2>
                            <p>Stats</p>
                        </hgroup>
                    </header>
                    <table class="striped mb-0">
                        <thead>
                            <tr>
                                <th scope="col">Type</th>
                                <th scope="col">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="entry in entryStore.entries_count">
                                <th scope="row">
                                    {{
                                        entry.type
                                    }}
                                </th>
                                <td>
                                    {{
                                        entry.count.toLocaleString("ja-JP")
                                    }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th scope="row">Total</th>
                                <td>
                                    {{
                                        entryStore.count.toLocaleString("ja-JP")
                                    }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </article>
            </div>
            <div class="Table">
                <article>
                    <header>
                        <hgroup class="mb-0">
                            <h2>表</h2>
                            <p>Table</p>
                        </hgroup>
                    </header>
                    <table class="striped mb-0">
                        <thead>
                            <tr>
                                <th scope="col">F3SiD</th>
                                <th scope="col">Type</th>
                                <th scope="col">Entered At</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="entry in entryStore.entries_table">
                                <th scope="row">{{ entry.f3sid }}</th>
                                <td>{{ entry.type }}</td>
                                <td>{{ entry.created_at }}</td>
                            </tr>
                        </tbody>
                    </table>
                </article>
            </div>
        </div>
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

<style lang="css" scoped>
.parent {
    display: grid;
    grid-template-columns: 0.7fr 1.3fr;
    grid-template-rows: 1fr 1fr;
    gap: 0em 1em;
    grid-auto-flow: row;
    grid-template-areas:
        "Order Table"
        "Stats Table";
}

.Order {
    grid-area: Order;
}

.Stats {
    grid-area: Stats;
}

.Table {
    grid-area: Table;
}
</style>