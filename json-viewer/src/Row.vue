<template>
  <div class="row">
    &nbsp;
    <span v-for="_ in indent" class="indent"></span>
    <template v-if="!isNaN(index)">
      <span class="index"> {{ index }}:&nbsp;</span>
    </template>
    <template v-else-if="field">
      <span class="field"> {{ field }}&nbsp;</span>
    </template>
    <template v-if="openbracket">
      <span class="openbracket"> {{ openbracket }} </span>
    </template>
    <template v-else-if="closebracket">
      <span class="closebracket"> {{ closebracket }} </span>
    </template>
    <template v-else>
      <span class="display"> {{ display }} </span>
    </template>
  </div>
</template>

<style>
.row {
  display: flex;
  align-items: center;
  height: 28px;
}
.field {
  color: #4E9590
}
.index {
  color: #BFBFBF;
}
.openbracket {
  color: #F2CAB8;
  font-weight: bold;
}
.closebracket {
  color: #F2CAB8;
  font-weight: bold;
  transform: translateX(2px);
}
.indent {
  width: 1px;
  height: 28px;
  margin-left: 4px;
  margin-right: 12px;
  background-color: #BFBFBF;
}
</style>

<script>
export default {
  props: ['item'],
  data(props) {
    const [ field, display, indent ] = props.item.split('\x1F')
    return {
      field: field && (field + ':'),
      display,
      index: parseInt(field) && field,
      indent: +indent,
      openbracket: display === '[' && display,
      closebracket: display === ']' && display
    }
  }
}
</script>