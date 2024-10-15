<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader';
import Sqids from 'sqids';
import { computed, ref } from 'vue';
import { type DetectedBarcode } from "barcode-detector";

const sqids = new Sqids({
    minLength: 7,
    alphabet: '23456789CFGHJMPQRVWX',
    blocklist: new Set([])
})

const f3sid = ref<string>('962C7JF');
const id = computed(() => sqids.decode(f3sid.value)[0]);
const rand = computed(() => sqids.decode(f3sid.value)[1]);
const junior_grade_list = ["A", "B", "C", "D", "E"];
const senior_grade_list = ["E", "A", "B", "C", "D"];
const grade = ref<number>(0);
const class_ = ref<string>('A');

const onDetect = async ([firstDetectedCode]: DetectedBarcode[]) => {
    const decoded = sqids.decode(firstDetectedCode.rawValue);
    if (decoded.length !== 2) return;

    f3sid.value = firstDetectedCode.rawValue;
    const url = import.meta.env.VITE_API_URL;
    const data = await fetch(url + "visitor/" + f3sid.value, {
        method: "GET",
    }).then((r) => r.json());

    grade.value = data.grade;
    if (grade.value >= 10)
        class_.value = senior_grade_list[data.class]
    else
        class_.value = junior_grade_list[data.class]
}
</script>

<template>
    <main class="container">
        <div>
            <section class="max-w-sm mx-auto">
                <QrcodeStream :formats="['qr_code']" @detect="onDetect" />
            </section>
            <section class="max-w-2xl mx-auto">
                <article>
                    <hgroup>
                        <h2>{{ f3sid }}</h2>
                        <p>Scanned F3SiD</p>
                    </hgroup>
                    <footer class="grid">
                        <div>
                            <label>
                                ID
                                <input type="text" name="text" :value="id" aria-label="Read-only input" readonly>
                            </label>
                            <label>
                                Rand
                                <input type="text" name="text" :value="rand" aria-label="Read-only input" readonly>
                            </label>
                        </div>
                        <div>
                            <label>
                                Grade
                                <input type="text" name="text" :value="grade" aria-label="Read-only input" readonly>
                            </label>
                            <label>
                                Class
                                <input type="text" name="text" :value="class_" aria-label="Read-only input" readonly>
                            </label>
                        </div>
                    </footer>
                </article>
            </section>
        </div>
    </main>
</template>