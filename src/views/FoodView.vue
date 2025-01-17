<script setup lang="ts">
import { ArcElement, CategoryScale, Chart as ChartJS, Colors, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Check, Pencil, ScanQrCode, Send, X } from "lucide-vue-next";
import { useBattery, useIntervalFn } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';
import { Doughnut, Line } from "vue-chartjs";
import { useFoodStore } from '../stores/food';
import { useNodeStore } from '../stores/node';
import ScannerComponent from '@/components/ScannerComponent.vue';
import { newSqids } from '@/utils/sqids';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Colors)

const BORDER_COLORS = [
    'rgb(54, 162, 235)', // blue
    'rgb(255, 99, 132)', // red
    'rgb(255, 159, 64)', // orange
    'rgb(255, 205, 86)', // yellow
    'rgb(75, 192, 192)', // green
    'rgb(153, 102, 255)', // purple
    'rgb(201, 203, 207)' // grey
];
const MAX_LABELS = 21;

// const total_price = ref("")

const total_price = computed(() => {
    return foodStore.counts.reduce((acc, food) => acc + food.price * food.count, 0).toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
});

const nodeStore = useNodeStore()
const foodStore = useFoodStore()

const isLoading = ref(false);

const isScannerVisible = ref(false)
const isF3SiDScanned = ref(false)

const newId = ref(0)
const newFoodId = ref(0)
const newQuantity = ref(1)
const editIsLoading = ref(false)

const f3sid = ref("")

const f3sidInvalid = ref(false)
const foodInvalid = ref(false)

const sqids = newSqids();

const editingFoods = ref(new Map<number, boolean>(
    foodStore.table.map(food => [food.id, false])
));

const selectedFoods = ref<Map<number, {
    name: string;
    isSelected: boolean;
    quantity: number;
}>>(new Map());

const price = computed(() => {
    return Array.from(selectedFoods.value.entries())
        .filter(([, food]) => food.isSelected)
        .reduce((total, [id, food]) => {
            const foundFood = foodStore.foods.find(f => f.id === id);
            return total + (foundFood ? foundFood.price * food.quantity : 0);
        }, 0)
        .toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
});

const onDetect = async (firstDetectedCode: DetectedBarcode) => {
    if (sqids.decode(firstDetectedCode.rawValue).length !== 2) return;
    f3sid.value = firstDetectedCode.rawValue;
    isF3SiDScanned.value = true;
    isScannerVisible.value = false;
};

const onClickScan = (() => {
    isScannerVisible.value = isScannerVisible.value ? false : true;
})
const onClickSave = (async (id: number) => {
    console.log(newId.value, newFoodId.value, newQuantity.value);
    editIsLoading.value = true;

    const updateFoodResult = await foodStore.updateFood(Number(newId.value), Number(newFoodId.value), Number(newQuantity.value));
    if (updateFoodResult) {
        const tableFoodResult = await foodStore.update();

        if (tableFoodResult) {
            editIsLoading.value = false;
            editingFoods.value.set(id, false);
        }
    }
})
const onClickCancel = ((id: number) => {
    editingFoods.value.set(id, false);
})
const onClickEdit = ((food: {
    id: number,
    f3sid: string,
    food_id: number,
    food_name: string,
    quantity: number,
    price: number,
    created_at: string
}) => {
    // Check if other food is being edited
    for (const [id, isEditing] of editingFoods.value) {
        if (isEditing && id !== food.id) {
            return;
        }
    }
    // Reset the new values
    newFoodId.value = food.food_id;
    newQuantity.value = food.quantity;
    newId.value = food.id;
    // Set the food to be edited
    editingFoods.value.set(food.id, true);
})

const onSubmit = async () => {
    isLoading.value = true;

    if (f3sid.value === '' || sqids.decode(f3sid.value).length !== 2) {
        isLoading.value = false;
        f3sidInvalid.value = true;
    } else {
        f3sidInvalid.value = false;
    }
    const anyFoodSelected = Array.from(selectedFoods.value.values()).some(food => food.isSelected && food.quantity >= 1);
    if (!anyFoodSelected) {
        isLoading.value = false;
        foodInvalid.value = true;
    } else {
        foodInvalid.value = false;
    }

    if (f3sidInvalid.value || foodInvalid.value) {
        isLoading.value = false;
        return;
    }

    const sendFoodResult = await foodStore.sendFood(f3sid.value, Array.from(selectedFoods.value.entries())
        .filter(([, food]) => food.isSelected)
        .map(([id, food]) => ({
            id: Number(id),
            quantity: Number(food.quantity)
        }))
    );

    if (sendFoodResult) {
        const tableFoodResult = await foodStore.update();
        if (tableFoodResult) {
            f3sid.value = '';
            selectedFoods.value = new Map(foodStore.foods.map(food => [
                food.id,
                { name: food.name, isSelected: false, quantity: 1 }
            ]));
        }
    }

    isLoading.value = false;
}

const donutLabels = computed(() =>
    foodStore.counts.map(food => food.name)
);

const groupedFoodsByDate = computed(() => {
    return foodStore.counts.reduce((acc, food) => {
        const date = food.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(food);
        return acc;
    }, {} as Record<string, typeof foodStore.counts>);
});

const donutCountDatas = computed(() =>
    foodStore.counts.map(food => food.count)
);
const donutQuantityDatas = computed(() =>
    foodStore.counts.map(food => food.quantity)
);

const lineLabels = Array(MAX_LABELS).fill(0).reduce((acc, _, i) => {
    if (i % 2 === 0) {
        acc.push((i / 2 + 8).toString().padStart(2, '0') + ":00");
    } else {
        acc.push((Math.floor(i / 2) + 8).toString().padStart(2, '0') + ":30");
    }
    return acc;
}, []);

const { charging, chargingTime, dischargingTime, level } = useBattery()

const { resume, isActive } = useIntervalFn(async () => {
    await nodeStore.sendStatus(charging.value, chargingTime.value, dischargingTime.value, level.value)
}, 60000, { immediate: false }) // 1 minute


onMounted(() => {
    (async () => {
        await foodStore.getFoods()
        await foodStore.update()

        // total_price.value = foodStore.counts.reduce((acc, food) => acc + food.price * food.count, 0).toLocaleString("ja-JP", { style: "currency", currency: "JPY" });

        selectedFoods.value = new Map(foodStore.foods.map(food => [
            food.id,
            { name: food.name, isSelected: false, quantity: 1 }
        ]));
    })()

    if (!isActive.value && nodeStore.canSendStatus)
        resume()
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
                    <form v-on:keydown.enter.prevent @submit.prevent="onSubmit">
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
                                    F3SiDが無効です
                                </small>
                            </label>
                            <fieldset :aria-invalid="foodInvalid" aria-describedby="food-helper">
                                <legend>商品:</legend>
                                <!-- <template v-for="food in selectedFoods" :key="food[0].toString()">
                                    <input type="checkbox" :id="food[0].toString()" :name="food[1].name"
                                        v-model="food[1].isSelected" />
                                    <label :for="food[0].toString()">{{ food[1].name }}</label>
                                </template> -->
                                <label v-for="food in selectedFoods" :key="food[0].toString()">
                                    <input type="checkbox" :id="food[0].toString()" :name="food[1].name"
                                        v-model="food[1].isSelected" />
                                    <!-- <label :for="food[0].toString()">{{ food[1].name }} -->
                                    {{ food[1].name }}
                                </label>
                            </fieldset>
                            <small v-if="foodInvalid" id="food-helper">
                                商品を選択してください
                            </small>
                            <template v-for="food in selectedFoods" :key="food[0]">
                                <label v-if="food[1].isSelected">
                                    {{ food[1].name }}
                                    <input type="number" name="quantity" min="1" v-model="food[1].quantity"
                                        class="!h-10" />
                                </label>
                            </template>
                            <label>
                                値段
                                <input :value="price" name="price" class="!h-10" readonly />
                            </label>
                        </fieldset>

                        <button type="submit" class="mb-0 flex items-center" :aria-busy="isLoading"
                            :disabled="isLoading">
                            <div class="flex items-center mx-auto">
                                <Send class="size-4 mr-1" />
                                <span class="text-size-lg">送信する</span>
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
                    <div>
                        <template v-for="(foods, date) in groupedFoodsByDate" :key="date">
                            <hroup>
                                <h3>{{ date + "日" }}</h3>
                            </hroup>
                            <table class="striped mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">商品名</th>
                                        <th scope="col">値段</th>
                                        <th scope="col">回数</th>
                                        <th scope="col">個数</th>
                                        <th scope="col">総額</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="food in foods" v-bind:key="food.id">
                                        <th scope="row" class="text-sm">{{ food.name }}</th>
                                        <td>
                                            {{
                                                food.price.toLocaleString("ja-JP", {
                                                    style: "currency",
                                                    currency: "JPY"
                                                })
                                            }}
                                        </td>
                                        <td>
                                            {{ food.count }}
                                        </td>
                                        <td>
                                            {{ food.quantity }}
                                        </td>
                                        <td>
                                            {{
                                                (food.count * food.price).toLocaleString("ja-JP", {
                                                    style: "currency",
                                                    currency: "JPY"
                                                })
                                            }}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th scope="row" colspan="2" class="text-align-center">合計</th>
                                        <td>
                                            {{
                                                foods.reduce((acc, food) => acc + food.count, 0)
                                            }}
                                        </td>
                                        <td>
                                            {{
                                                foods.reduce((acc, food) => acc + food.quantity, 0)
                                            }}
                                        </td>
                                        <td>
                                            {{
                                                foods.reduce((acc, food) => acc + (food.count * food.price),
                                                    0).toLocaleString("ja-JP", {
                                                        style: "currency",
                                                        currency: "JPY"
                                                    })
                                            }}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                            <hr class="mt-0" />
                        </template>
                        <template v-if="Object.keys(groupedFoodsByDate).length > 1">
                            <hgroup>
                                <h3>合計</h3>
                            </hgroup>
                            <table class="stripped mb-0">
                                <thead>
                                    <tr>
                                        <th scope="col">商品名</th>
                                        <th scope="col">日付</th>
                                        <th scope="col">値段</th>
                                        <th scope="col">回数</th>
                                        <th scope="col">個数</th>
                                        <th scope="col">総額</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="food in foodStore.counts" v-bind:key="food.id">
                                        <th scope="row" class="text-sm">{{ food.name }}</th>
                                        <td>
                                            {{ food.date }}
                                        </td>
                                        <td>
                                            {{
                                                food.price.toLocaleString("ja-JP", {
                                                    style: "currency",
                                                    currency: "JPY"
                                                })
                                            }}
                                        </td>
                                        <td>
                                            {{ food.count }}
                                        </td>
                                        <td>
                                            {{ food.quantity }}
                                        </td>
                                        <td>
                                            {{
                                                (food.count * food.price).toLocaleString("ja-JP", {
                                                    style: "currency",
                                                    currency: "JPY"
                                                })
                                            }}
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th scope="row" colspan="3" class="text-align-center">
                                            合計
                                        </th>
                                        <td>
                                            {{
                                                foodStore.count
                                            }}
                                        </td>
                                        <td>
                                            {{
                                                foodStore.quantity
                                            }}
                                        </td>
                                        <td>
                                            {{
                                                total_price
                                            }}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                            <hr class="m-0" />
                        </template>
                    </div>
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
                                <th scope="col">商品名</th>
                                <th scope="col">回数</th>
                                <th scope="col">値段</th>
                                <th scope="col">購入時刻</th>
                                <th scope="col" class="text-center">編集</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="food in foodStore.table" v-bind:key="food.f3sid + food.created_at">
                                <th scope="row">{{ food.f3sid }}</th>
                                <td v-if="editingFoods.get(food.id)">
                                    <select :disabled="editIsLoading" name="newFoodId" v-model="newFoodId"
                                        class="!mb-0 !py-0 !h-8" required>
                                        <option v-for="foodStoreFood in foodStore.foods" :value="foodStoreFood.id"
                                            :key="foodStoreFood.id">
                                            {{ foodStoreFood.name }}
                                        </option>
                                    </select>
                                </td>
                                <td v-else>{{ food.food_name }}</td>
                                <td v-if="editingFoods.get(food.id)">
                                    <input type="number" v-model="newQuantity" class="!mb-0 !py-0 !h-8 !w-20"
                                        :disabled="editIsLoading" />
                                </td>
                                <td v-else>{{ food.quantity }}</td>
                                <td>
                                    {{
                                        (food.price * food.quantity).toLocaleString("ja-JP", {
                                            style: "currency",
                                            currency: "JPY"
                                        })
                                    }}
                                </td>
                                <td>{{ new Date(food.created_at).toLocaleTimeString("ja-JP") }}</td>
                                <td>
                                    <div class="grid grid-cols-1 gap-2">
                                        <template v-if="editingFoods.get(food.id)">
                                            <button @click="onClickCancel(food.id)" :disabled="editIsLoading"
                                                class="flex items-center justify-center size-8 p-0 mr-auto outline secondary">
                                                <X class="m-1 size-5" />
                                            </button>
                                            <button @click="onClickSave(food.id)" :disabled="editIsLoading"
                                                class="flex items-center justify-center size-8 p-0 outline">
                                                <Check class="m-1 size-5" />
                                            </button>
                                        </template>
                                        <button v-else @click="onClickEdit(food)" :disabled="editIsLoading"
                                            class="flex items-center justify-center size-8 p-0 mx-auto outline contrast">
                                            <Pencil class="m-2 size-3" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </article>
            </div>
            <div class="Donut-Chart">
                <article style="zoom: 1.1;">
                    <header>
                        <hgroup class="mb-0">
                            <h2>セット別売上割合</h2>
                            <p>Percentage of total count and quantity by set</p>
                        </hgroup>
                    </header>
                    <Doughnut :data="{
                        labels: donutLabels,
                        datasets: [{
                            label: '回数',
                            data: donutCountDatas,
                            backgroundColor: [...BORDER_COLORS.slice(0, donutCountDatas.length)],
                        }, {
                            label: '個数',
                            data: donutQuantityDatas,
                            backgroundColor: [...BORDER_COLORS.slice(0, donutCountDatas.length)],
                        }]
                    }" :options="{
                        animation: false,
                        plugins: {
                            // colors: {
                            //     forceOverride: true
                            // },
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
                <article style="zoom: 1.1;">
                    <header>
                        <hgroup class="mb-0">
                            <h2>時間における回数と個数のグラフ</h2>
                            <p>The graph of count and quantity vs time</p>
                        </hgroup>
                    </header>
                    <Line :data="{
                        labels: lineLabels,
                        datasets: foodStore.line_graph_data
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
        <ScannerComponent v-model="isScannerVisible" @onDetect="onDetect" />
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