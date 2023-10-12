<template>
  <div class="wrapper">
    <h1> {{ filename }} </h1>
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
}
.wrapper h1 {
  max-width: 720px;
  width: 100%;
  text-align: left;
  margin-block-start: 0.67em;
  margin-block-end: 0.67em;
}
.scroller {
  display: flex;
  flex: 1;
  flex-direction: column;
  max-width: 720px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
</style>

<script>
import Row from './Row.vue';

export default {
  data() {
    return {
      filename: window.filename,
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
  components: { Row }
}
</script>