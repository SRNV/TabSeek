<template>
    <div class="measure-navigation">
        <button class="nav-btn" @click="store.previousMeasure" :disabled="store.currentMeasure === 0"
            title="Mesure précédente">
            <span class="nav-icon">◀</span>
        </button>

        <div class="measure-indicator">
            Mesure {{ store.currentMeasure + 1 }}/{{ store.measures.length }}
        </div>

        <button class="nav-btn" @click="store.nextMeasure" title="Mesure suivante">
            <span class="nav-icon">▶</span>
        </button>

        <button class="add-measure-btn" @click="store.addMeasure" title="Ajouter une mesure">
            <span class="nav-icon">+</span>
        </button>

        <button class="delete-measure-btn" @click="store.deleteMeasure" :disabled="store.measures.length <= 1"
            title="Supprimer la mesure actuelle">
            <span class="delete-icon">-</span>
        </button>
    </div>
</template>

<script lang="ts" setup>
import { useTablatureStore } from '../../stores/tablatureStore';

const store = useTablatureStore();
</script>

<style scoped lang="scss">
.measure-navigation {
    display: flex;
    align-items: center;
    gap: 10px;

    .nav-btn,
    .add-measure-btn,
    .delete-measure-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 36px;
        height: 36px;
        background-color: #444;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover:not(:disabled) {
            background-color: #555;
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    .delete-measure-btn {
        background-color: #a53a3a;

        &:hover:not(:disabled) {
            background-color: #b54a4a;
        }
    }

    .measure-indicator {
        flex: 1;
        text-align: center;
        font-size: 0.9rem;
        color: #aaa;
    }
}
</style>