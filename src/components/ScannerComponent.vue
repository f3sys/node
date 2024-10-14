<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader';
import { type DetectedBarcode } from "barcode-detector/pure";
import { watch, ref } from 'vue';

const emit = defineEmits<{
    onDetect: [firstDetectedCode: DetectedBarcode]
}>();
const model = defineModel<boolean>({ required: true });

const onDetect = ([firstDetectedCode]: DetectedBarcode[]) => {
    emit('onDetect', firstDetectedCode);
}

const modalIsOpen = ref(false)

watch(model, (isVisible) => {
    if (isVisible) {
        modalIsOpen.value = !modalIsOpen.value
        document.getElementsByTagName("html")[0].setAttribute('class', 'modal-is-open modal-is-opening');
        setTimeout(() => {
            document.getElementsByTagName("html")[0].setAttribute('class', 'modal-is-open')
        }, 400);
    } else {
        document.getElementsByTagName("html")[0].setAttribute('class', 'modal-is-open modal-is-closing');
        setTimeout(() => {
            modalIsOpen.value = !modalIsOpen.value
            document.getElementsByTagName("html")[0].setAttribute('class', '')
        }, 400);
    }
})
</script>

<template>
    <dialog :open="modalIsOpen">
        <article class="max-w-lg">
            <header>
                <hgroup style="margin-bottom: 0px;">
                    <h2>F3SiD</h2>
                    <p>F3SiDをスキャンしてください</p>
                </hgroup>
            </header>
            <QrcodeStream :paused="!model" @detect="onDetect" />
            <footer>
                <button @click="model = !model" class="secondary">
                    Close
                </button>
            </footer>
        </article>
    </dialog>
</template>