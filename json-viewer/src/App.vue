<template>
  <div class="wrapper">
    <RecycleScroller :key="pageModeFullPage" ref="scroller" class="scroller" :items="items" :item-size="28"
      :buffer="buffer" :page-mode="pageMode" key-field="i">
      <template #default="props">
        <Row :item="props.item.s" />
      </template>
    </RecycleScroller>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: stretch;
  height: 100vh;
  width: 100vw;
}
.scroller {
  display: flex;
  flex: 1;
  flex-direction: column;
  max-width: 720px;
  height: 100%;
  overflow-y: auto;
}
</style>

<script>
import Row from './Row.vue';

export default {
  data() {
    return {
      items: window.rows,
      renderScroller: true,
      showScroller: true,
      scopedSlots: false,
      buffer: 200,
      poolSize: 2000,
      enableLetters: true,
      pageMode: false,
      pageModeFullPage: true,
      scrollTo: 100,
      updateParts: { viewStartIdx: 0, viewEndIdx: 0, visibleStartIdx: 0, visibleEndIdx: 0 },
      showMessageBeforeItems: true,
    };
  },
  computed: {
    itemHeight() { return 22; },
  },
  components: { Row }
}
</script>