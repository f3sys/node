<script setup lang="ts">
import { type DetectedBarcode } from "barcode-detector/pure";
import { ArcElement, CategoryScale, Chart as ChartJS, Colors, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { ScanQrCode, Send } from "lucide-vue-next";
import Sqids from "sqids";
import { computed, onMounted, ref } from 'vue';
import { Doughnut, Line } from "vue-chartjs";
import { QrcodeStream } from 'vue-qrcode-reader';
import { useEntryStore } from "../stores/entry";
import { useNodeStore } from '../stores/node';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Colors)
const MAX_LABELS = 21

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
    if (sqids.decode(firstDetectedCode.rawValue).length !== 2) return;
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
            entryStore.getEntryCount(),
            entryStore.getData()
        ]);
        if (tableFoodResult) {
            f3sid.value = '';
        }
    }

    isLoading.value = false;
}

const donutLabels = computed(() => {
    return entryStore.counts.map(entry => entry.type)
})
const donutCountDataset = computed(() => {
    return entryStore.counts.map(entry => entry.count)
})

let lineLabels = Array(MAX_LABELS).fill(0).reduce((acc, _, i) => {
    if (i % 2 === 0) {
        acc.push((i / 2 + 8).toString().padStart(2, '0') + ":00");
    } else {
        acc.push((Math.floor(i / 2) + 8).toString().padStart(2, '0') + ":30");
    }
    return acc;
}, []);

onMounted(() => {
    (async () => {
        await Promise.all([
            entryStore.getData(),
            entryStore.getEntryCount(),
            entryStore.getCount(),
            entryStore.getTable()
        ])
    })()
})
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
                <article class="text-nowrap">
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
                            <tr v-for="entry in entryStore.counts">
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
                <article class="text-nowrap">
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
                            <tr v-for="entry in entryStore.table">
                                <th scope="row">{{ entry.f3sid }}</th>
                                <td>{{ entry.type }}</td>
                                <td>{{ new Date(entry.created_at).toLocaleTimeString("ja-JP") }}</td>
                            </tr>
                        </tbody>
                    </table>
                </article>
            </div>
            <div class="Donut-Chart">
                <article>
                    <header>
                        <hgroup class="mb-0">
                            <h2>種別人数割合</h2>
                            <p>Percentage of total count by type</p>
                        </hgroup>
                    </header>
                    <Doughnut :data="{
                        labels: donutLabels,
                        datasets: [{
                            label: 'Count',
                            data: donutCountDataset,
                        }]
                    }" :options="{
                        animation: false,
                        plugins: {
                            colors: {
                                forceOverride: true
                            },
                            legend: {
                                labels: {
                                    font: {
                                        size: 15
                                    }
                                }
                            }
                        }
                    }" />
                </article>
            </div>
            <div class="Line-Chart">
                <article>
                    <header>
                        <hgroup class="mb-0">
                            <h2>時間における回数のグラフ</h2>
                            <p>The graph of count vs time</p>
                        </hgroup>
                    </header>
                    <Line :data="{
                        labels: lineLabels,
                        datasets: entryStore.line_graph_data
                    }" :options="{
                        animation: false,
                        plugins: {
                            colors: {
                                forceOverride: true
                            },
                            legend: {
                                labels: {
                                    font: {
                                        size: 15
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    font: {
                                        size: 12
                                    }
                                },
                            },
                            y: {
                                ticks: {
                                    font: {
                                        size: 12
                                    }
                                },
                            }
                        }
                    }" />
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
    grid-template-columns: 1fr 1.5fr;
    grid-template-rows: auto auto auto;
    gap: 0em 1em;
    grid-auto-flow: row;
    grid-template-areas:
        "Order Table"
        "Stats Table"
        "Donut-Chart Line-Chart";
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

.Donut-Chart {
    grid-area: Donut-Chart;
}

.Line-Chart {
    grid-area: Line-Chart;
}
</style>