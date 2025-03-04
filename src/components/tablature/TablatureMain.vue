<template>
    <div class="partition-tab-container">
        <div class="tab-header">
            <h3 class="tab-title">Tablature - Mesure {{ store.currentMeasure + 1 }}</h3>
            <div class="tuning-info">
                Accordage: {{ store.tuningDisplay }}
            </div>
        </div>

        <div class="tab-content">
            <TabContent />

            <TabMultiSelection />
        </div>

        <div class="tab-controls">
            <TabNavigation />
            <TabPlayback />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { useTablatureStore } from '../../stores/tablatureStore';
import TabContent from './TabContent.vue';
import TabMultiSelection from './TabMultiSelection.vue';
import TabNavigation from './TabNavigation.vue';
import TabPlayback from './TabPlayback.vue';

const store = useTablatureStore();

// Initialiser le store
onMounted(() => {
    store.initializeMeasures();
});

// Nettoyer les ressources lors de la destruction du composant
onBeforeUnmount(() => {
    store.stopPlayback();
});
</script>

<style scoped lang="scss">
.partition-tab-container {
    max-height: 500px;
    display: flex;
    flex-direction: column;
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: #e0e0e0;

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

    .tab-content {
        flex: 1;
        overflow-y: auto;
        background-color: #333;
        border-radius: 4px;
        padding: 10px;
        max-height: 350px;
    }

    .tab-controls {
        margin-top: 15px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
}

@media (min-width: 768px) {
    .tab-controls {
        flex-direction: row !important;
        justify-content: space-between;

        .measure-navigation,
        .playback-controls {
            flex: 1;
        }
    }
}
</style>