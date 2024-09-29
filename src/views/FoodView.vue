<script setup lang="ts">
import { type DetectedBarcode } from "barcode-detector/pure";
import { ArcElement, CategoryScale, Chart as ChartJS, Colors, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Check, Pencil, ScanQrCode, Send, X } from "lucide-vue-next";
import Sqids from "sqids";
import { computed, ref } from 'vue';
import { Line, Pie } from "vue-chartjs";
import { QrcodeStream } from 'vue-qrcode-reader';
import { useFoodStore } from '../stores/food';
import { useNodeStore } from '../stores/node';
ChartJS.register(ArcElement, Tooltip, Legend, Colors, CategoryScale, LinearScale, PointElement, LineElement, Filler)

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

const sqids = new Sqids({
    minLength: 7,
    alphabet: '23456789CFGHJMPQRVWX',
    blocklist: new Set([])
})

const editingFoods = ref(new Map<number, boolean>(
    foodStore.foods_table.map(food => [food.id, false])
));

const selectedFoods = ref(new Map(foodStore.foods.map(food => [
    food.id,
    { name: food.name, isSelected: false, quantity: 1 }
])));

const price = computed(() => {
    return Array.from(selectedFoods.value.entries())
        .filter(([_, food]) => food.isSelected)
        .reduce((total, [id, food]) => {
            const foundFood = foodStore.foods.find(f => f.id === id);
            return total + (foundFood ? foundFood.price * food.quantity : 0);
        }, 0)
        .toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
});

const onDetect = async ([firstDetectedCode]: DetectedBarcode[]) => {
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
        const [tableFoodResult] = await Promise.all([
            foodStore.getTable(),
            // foodStore.getCount(),
            foodStore.getFoodCount(),
            foodStore.getData()
        ]);

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
    price: string,
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
        .filter(([_, food]) => food.isSelected)
        .map(([id, food]) => ({
            id: Number(id),
            quantity: Number(food.quantity)
        }))
    );

    if (sendFoodResult) {
        const [tableFoodResult] = await Promise.all([
            foodStore.getTable(),
            // foodStore.getCount(),
            foodStore.getFoodCount(),
            foodStore.getData()
        ]);
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
    foodStore.foods_count.map(food => food.name)
);
const donutDatas = computed(() =>
    foodStore.foods_count.map(food => food.count)
);

const lineLabels = Array.from({ length: 24 }, (_, i) => i.toString());
const lineDatas = computed(() => {
    const datasets = foodStore.foods_line_graph_data.map(food => ({
        label: food.name,
        data: food.foods.map(count => count.count),
    }));

    const totalData = Array.from({ length: 24 }, (_, i) =>
        foodStore.foods_line_graph_data.reduce((acc, food) => acc + (food.foods[i]?.count || 0), 0)
    );

    datasets.push({
        label: "Total",
        data: totalData,
    });

    return datasets;
});
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
                            <fieldset :aria-invalid="foodInvalid" aria-describedby="food-helper">
                                <legend>Foods:</legend>
                                <template v-for="food in foodStore.foods" :key="food.id">
                                    <input type="checkbox" :id="food.id.toString()" :name="food.name"
                                        v-model="selectedFoods.get(food.id)!.isSelected" />
                                    <label :for="food.id.toString()">{{ food.name }}</label>
                                </template>
                            </fieldset>
                            <small v-if="foodInvalid" id="food-helper">
                                Please select a food!
                            </small>
                            <template v-for="food in selectedFoods" :key="food[0]">
                                <label v-if="food[1].isSelected">
                                    {{ food[1].name }}
                                    <input type="number" name="quantity" min="1" v-model="food[1].quantity"
                                        class="!h-10" />
                                </label>
                            </template>
                            <label>
                                Price
                                <input :value="price" name="price" class="!h-10" readonly />
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
                                <th scope="col">Name</th>
                                <th scope="col">Price</th>
                                <th scope="col">Quantity</th>
                                <th scope="col">Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="food in foodStore.foods_count">
                                <th scope="row">{{ food.name }}</th>
                                <td>
                                    {{
                                        foodStore.foods.find(f => f.id === food.id)?.price.toLocaleString("ja-JP",
                                            {
                                                style: "currency", currency: "JPY"
                                            })
                                    }}
                                </td>
                                <td>
                                    {{ food.count }}
                                </td>
                                <td>
                                    {{
                                        (food.count * (foodStore.foods.find(f => f.id === food.id)?.price ??
                                            0)).toLocaleString("ja-JP",
                                                {
                                                    style: "currency", currency: "JPY"
                                                })
                                    }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th scope="row" colspan="2" class="text-align-center">Total</th>
                                <td>
                                    {{
                                        foodStore.foods_count.reduce((acc, food) => acc + food.count, 0)
                                    }}
                                </td>
                                <td>
                                    {{
                                        foodStore.foods_count.reduce((acc, food) => acc + food.count *
                                            foodStore.foods.find(f => f.id
                                                === food.id)!.price, 0).toLocaleString("ja-JP", {
                                                    style: "currency", currency: "JPY"
                                                })
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
                                <th scope="col">Name</th>
                                <th scope="col">Quantity</th>
                                <th scope="col">Price</th>
                                <th scope="col">Bought At</th>
                                <th scope="col" class="text-center">Edit</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="food in foodStore.foods_table">
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
                                    <input type="number" v-model="newQuantity" class="!mb-0 !py-0 !h-8 !w-24"
                                        :disabled="editIsLoading" />
                                </td>
                                <td v-else>{{ food.quantity }}</td>
                                <td>{{ food.price }}</td>
                                <td>{{ food.created_at }}</td>
                                <td>
                                    <div class="flex">
                                        <button v-if="editingFoods.get(food.id)" @click="onClickCancel(food.id)"
                                            :disabled="editIsLoading"
                                            class="flex items-center justify-center size-8 p-0 mr-auto outline secondary">
                                            <X class="m-1 size-5" />
                                        </button>
                                        <button v-if="editingFoods.get(food.id)" @click="onClickSave(food.id)"
                                            :disabled="editIsLoading"
                                            class="flex items-center justify-center size-8 p-0 outline">
                                            <Check class="m-1 size-5" />
                                        </button>
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
                <article>
                    <header>
                        <hgroup class="mb-0">
                            <h2>円グラフ</h2>
                            <p>Pie Chart</p>
                        </hgroup>
                    </header>
                    <div>
                        <Pie :data="{
                            labels: donutLabels,
                            datasets: [{
                                data: donutDatas,
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
                    </div>
                </article>
            </div>
            <div class="Line-Chart">
                <article>
                    <header>
                        <hgroup class="mb-0">
                            <h2>折れ線グラフ</h2>
                            <p>Line Chart</p>
                        </hgroup>
                    </header>
                    <div>
                        <Line :data="{
                            labels: lineLabels,
                            datasets: lineDatas
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
                    </div>
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