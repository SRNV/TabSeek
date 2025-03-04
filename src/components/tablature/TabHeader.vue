<template>
    <div class="tab-header">
        <h3 class="tab-title">Tablature - Mesure {{ currentMeasureIndex + 1 }}</h3>
        <div class="tuning-info">
            Accordage: {{ tuningDisplay }}
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'TabHeader',
    props: {
        currentMeasureIndex: {
            type: Number,
            required: true
        },
        measuresCount: {
            type: Number,
            required: true
        },
        tuningDisplay: {
            type: String,
            required: true
        }
    }
});
</script>

<style scoped lang="scss">
.tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .tab-title {
        margin: 0;
        font-size: 1.2rem;
    }

    .tuning-info {
        font-size: 0.9rem;
        color: #aaa;
        font-family: monospace;
    }
}
</style>