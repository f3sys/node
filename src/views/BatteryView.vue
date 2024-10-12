<script setup lang="ts">
import { useBatteryStore } from '@/stores/battery';
import { onMounted } from 'vue';

const batteryStore = useBatteryStore()

onMounted(() => {
    (async () => {
        await batteryStore.update()
    })()
})
</script>

<template>
    <main class="container">
        <table>
            <thead>
                <tr>
                    <th scope="col">名前</th>
                    <th scope="col">充電状況</th>
                    <th scope="col">満充電までの時間</th>
                    <th scope="col">充電切れまでの時間</th>
                    <th scope="col">バッテリーレベル</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="battery in batteryStore.table" v-bind:key="battery.node_id">
                    <th scope="row">{{ battery.node_name }}</th>
                    <!-- <td>true</td>
                    <td>1000</td>
                    <td>Infinity</td>
                    <td>0.8</td> -->
                    <td>{{ battery.charging ? "充電中" : "充電していません" }}</td>
                    <td>{{ battery.charging_time }}</td>
                    <td>{{ battery.discharging_time }}</td>
                    <td>{{ battery.level }}</td>
                </tr>
            </tbody>
        </table>
    </main>
</template>