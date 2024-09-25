<script setup lang="ts">
import { ref } from 'vue';
import { useEntryStore } from '../stores/entry';
import { useExhibitionStore } from '../stores/exhibition';
import { useFoodStore } from '../stores/food';
import { useNodeStore } from '../stores/node';

const nodeStore = useNodeStore();
const foodStore = useFoodStore();
const exhibitionStore = useExhibitionStore();
const entryStore = useEntryStore();

const loading = ref(false);
const buttonValue = ref("Submit");

function toggleButton() {
    buttonValue.value = buttonValue.value === "Submit" ? "Loading..." : "Submit";
    loading.value = !loading.value;
}

async function onSubmit() {
    toggleButton()
    if (nodeStore.key === "") await nodeStore.setKey();
    await nodeStore.getNode();
    switch (nodeStore.type) {
        case "FOODSTALL":
            foodStore.clear();
            await Promise.all([
                foodStore.getFoods(),
                foodStore.getTable(),
                foodStore.getCount(),
                foodStore.getFoodCount()
            ]);

            window.location.reload()
            break;
        case "EXHIBITION":
            exhibitionStore.clear();
            await Promise.all([
                exhibitionStore.getTable(),
                exhibitionStore.getCount(),
            ]);

            window.location.reload()
            break;
        case "ENTRY":
            entryStore.clear();
            await Promise.all([
                entryStore.getTable(),
                entryStore.getCount(),
                entryStore.getEntryCount()
            ]);

            window.location.reload()
            break;
        default:
            break;
    }
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
    </main>
</template>