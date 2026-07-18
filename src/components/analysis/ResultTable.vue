<script setup>
import CellValue from "./CellValue.vue";

defineProps({
  table: { type: Object, required: true },
});
</script>

<template>
  <div class="result-table-block">
    <h4 class="rt-title">{{ table.title }}</h4>
    <div class="rt-scroll">
      <table class="rt">
        <thead>
          <tr>
            <th v-for="col in table.columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in table.rows"
            :key="i"
            :class="{ sig: row.significant }"
          >
            <td v-for="col in table.columns" :key="col.key">
              <CellValue :value="row.cells[col.key]" />
              <span v-if="col.key === table.columns[0].key && row.method" class="method-tag">
                {{ row.method }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <ul v-if="table.notes && table.notes.length" class="rt-notes">
      <li v-for="(n, i) in table.notes" :key="i">{{ n }}</li>
    </ul>
  </div>
</template>

<style scoped>
.result-table-block {
  background: var(--s1);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  padding: 18px 20px;
}
.rt-title {
  font-family: 'Instrument Serif', serif;
  font-size: 1.15rem;
  margin-bottom: 14px;
}
.rt-scroll {
  overflow-x: auto;
}
.rt {
  width: 100%;
  border-collapse: collapse;
}
.rt th {
  text-align: left;
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--t3);
  padding: 8px 12px;
  border-bottom: 1px solid var(--bd2);
  white-space: nowrap;
}
.rt td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--bd);
  font-size: .84rem;
  color: var(--t2);
  vertical-align: top;
}
.rt td:first-child {
  color: var(--t1);
  font-weight: 600;
}
.rt tr.sig td {
  background: rgba(79, 110, 247, .05);
}
.method-tag {
  display: inline-block;
  margin-left: 8px;
  font-size: .6rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--t3);
  border: 1px solid var(--bd);
  border-radius: 10px;
  padding: 1px 7px;
}
.rt-notes {
  list-style: none;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--bd);
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rt-notes li {
  font-size: .74rem;
  color: var(--t3);
  line-height: 1.5;
  padding-left: 14px;
  position: relative;
}
.rt-notes li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--a1);
}
</style>
