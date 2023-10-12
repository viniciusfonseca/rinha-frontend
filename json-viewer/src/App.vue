<template>
  <div class="wrapper">
    <RecycleScroller :key="pageModeFullPage" ref="scroller" class="scroller" :items="items" :item-size="itemHeight"
      :buffer="buffer" :page-mode="pageMode">
      <template #default="props">
        <Row :item="props.item" />
      </template>
    </RecycleScroller>
  </div>
</template>

<script>
import Row from './Row.vue';

export default {
  data() {
    return {
      items: window.rows,
      count: 10000,
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
    itemHeight() { return 20; },
  },
  components: { Row }
}
</script>