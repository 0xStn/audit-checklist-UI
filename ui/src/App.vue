<template>
  <div class="page">
    <header class="header">
      <h1>Solodit Audit Checklist Explorer</h1>
      <p>
        Browse, filter, and sort the aggregated audit checklist locally. Filters match
        category names at any depth, and text search covers questions, descriptions,
        remediations, and category paths.
      </p>
      <div class="toolbar">
        <div class="card">
          <label for="search">Search</label>
          <input
            id="search"
            v-model="searchQuery"
            class="input"
            type="search"
            placeholder="Search by category, description, remediation, or ID"
          />
        </div>
        <div class="card">
          <label for="sort">Sort by</label>
          <select id="sort" v-model="sortKey" class="select">
            <option value="category">Category</option>
            <option value="question">Question</option>
            <option value="id">ID</option>
          </select>
        </div>
        <div class="card">
          <label for="group">Grouping</label>
          <select id="group" v-model="groupMode" class="select">
            <option value="top">Group by top category</option>
            <option value="none">No grouping</option>
          </select>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div class="card">
          <div class="group-header">
            <h2>Categories</h2>
            <span class="counts">{{ uniqueCategories.length }}</span>
          </div>
          <p class="counts">Matches any depth in the category tree.</p>
          <div class="tag-list">
            <button
              v-for="category in uniqueCategories"
              :key="category"
              class="tag"
              :class="{ active: selectedCategories.includes(category) }"
              type="button"
              @click="toggleCategory(category)"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <div class="card">
          <div class="group-header">
            <h2>Tags</h2>
            <span class="counts">{{ uniqueTags.length }}</span>
          </div>
          <p class="counts">Empty tags are ignored.</p>
          <div class="tag-list">
            <button
              v-for="tag in uniqueTags"
              :key="tag"
              class="tag"
              :class="{ active: selectedTags.includes(tag) }"
              type="button"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="card">
          <div class="group-header">
            <h2>Stats</h2>
            <span class="counts">{{ filteredCount }}/{{ totalCount }}</span>
          </div>
          <div class="meta">
            <span class="badge">Filtered: {{ filteredCount }}</span>
            <span class="badge green">Total: {{ totalCount }}</span>
          </div>
        </div>
      </aside>

      <section>
        <div v-if="loadError" class="empty">
          {{ loadError }}
        </div>
        <div v-else-if="filteredCount === 0" class="empty">
          No results. Try clearing filters or broadening your search.
        </div>
        <div v-else>
          <div v-if="groupMode === 'top'" class="group">
            <section v-for="group in groupedItems" :key="group.key" class="group">
              <div class="group-header">
                <h2>{{ group.key }}</h2>
                <span class="counts">{{ group.items.length }} items</span>
              </div>
              <div class="list">
                <article v-for="item in group.items" :key="item.id" class="item">
                  <div class="meta">
                    <span class="badge">{{ item.id }}</span>
                    <span class="badge warn">{{ item.categoryPathString }}</span>
                  </div>
                  <h3>{{ item.question }}</h3>
                  <p v-if="item.description">{{ item.description }}</p>
                  <p v-if="item.remediation">
                    <strong>Remediation:</strong> {{ item.remediation }}
                  </p>

                  <div v-if="item.tags.length" class="tag-list">
                    <span v-for="tag in item.tags" :key="tag" class="tag">
                      {{ tag }}
                    </span>
                  </div>

                  <div v-if="item.safeReferences.length" class="meta">
                    <span>References:</span>
                    <span v-for="ref in item.safeReferences" :key="ref">
                      <a :href="ref" target="_blank" rel="noopener noreferrer">
                        {{ ref }}
                      </a>
                    </span>
                  </div>
                </article>
              </div>
            </section>
          </div>
          <div v-else class="list">
            <article v-for="item in sortedFiltered" :key="item.id" class="item">
              <div class="meta">
                <span class="badge">{{ item.id }}</span>
                <span class="badge warn">{{ item.categoryPathString }}</span>
              </div>
              <h3>{{ item.question }}</h3>
              <p v-if="item.description">{{ item.description }}</p>
              <p v-if="item.remediation">
                <strong>Remediation:</strong> {{ item.remediation }}
              </p>

              <div v-if="item.tags.length" class="tag-list">
                <span v-for="tag in item.tags" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>

              <div v-if="item.safeReferences.length" class="meta">
                <span>References:</span>
                <span v-for="ref in item.safeReferences" :key="ref">
                  <a :href="ref" target="_blank" rel="noopener noreferrer">
                    {{ ref }}
                  </a>
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import checklistRaw from "../../checklist.json";

const searchQuery = ref("");
const sortKey = ref("category");
const groupMode = ref("top");
const selectedCategories = ref([]);
const selectedTags = ref([]);
const loadError = ref("");

const normalizeChecklist = (data, parentPath = []) => {
  if (!Array.isArray(data)) {
    return [];
  }

  const results = [];

  for (const node of data) {
    if (node && typeof node === "object" && "id" in node) {
      const categoryPath = [...parentPath];
      const tags = Array.isArray(node.tags) ? node.tags.filter(Boolean) : [];
      const references = Array.isArray(node.references) ? node.references : [];
      const categoryPathString = categoryPath.join(" > ") || "Uncategorized";
      const safeReferences = references.filter(isSafeUrl);

      const searchText = [
        node.id,
        node.question,
        node.description,
        node.remediation,
        categoryPathString,
        ...tags
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      results.push({
        id: node.id,
        question: node.question || "Untitled question",
        description: node.description || "",
        remediation: node.remediation || "",
        references,
        safeReferences,
        tags,
        categoryPath,
        categoryPathString,
        topCategory: categoryPath[0] || "Uncategorized",
        searchText
      });
      continue;
    }

    if (node && typeof node === "object" && "category" in node) {
      const nextPath = [...parentPath, node.category];
      const childData = Array.isArray(node.data) ? node.data : [];
      results.push(...normalizeChecklist(childData, nextPath));
    }
  }

  return results;
};

const isSafeUrl = (value) => {
  if (typeof value !== "string") {
    return false;
  }
  return value.startsWith("https://") || value.startsWith("http://");
};

let normalized = [];
try {
  normalized = normalizeChecklist(checklistRaw);
} catch (error) {
  loadError.value = "Failed to load checklist data. Please verify checklist.json.";
}

const items = ref(normalized);

const uniqueCategories = computed(() => {
  const set = new Set();
  for (const item of items.value) {
    for (const category of item.categoryPath) {
      set.add(category);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const uniqueTags = computed(() => {
  const set = new Set();
  for (const item of items.value) {
    for (const tag of item.tags) {
      if (tag) {
        set.add(tag);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const categoryFilters = selectedCategories.value;
  const tagFilters = selectedTags.value;

  return items.value.filter((item) => {
    const matchesQuery = !query || item.searchText.includes(query);
    const matchesCategory =
      categoryFilters.length === 0 ||
      item.categoryPath.some((category) => categoryFilters.includes(category));
    const matchesTags =
      tagFilters.length === 0 ||
      item.tags.some((tag) => tagFilters.includes(tag));

    return matchesQuery && matchesCategory && matchesTags;
  });
});

const sortedFiltered = computed(() => {
  const list = [...filteredItems.value];
  const sort = sortKey.value;

  list.sort((a, b) => {
    if (sort === "question") {
      return a.question.localeCompare(b.question);
    }
    if (sort === "id") {
      return a.id.localeCompare(b.id);
    }
    return a.categoryPathString.localeCompare(b.categoryPathString) ||
      a.id.localeCompare(b.id);
  });

  return list;
});

const groupedItems = computed(() => {
  const groups = new Map();
  for (const item of sortedFiltered.value) {
    if (!groups.has(item.topCategory)) {
      groups.set(item.topCategory, []);
    }
    groups.get(item.topCategory).push(item);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, groupItems]) => ({ key, items: groupItems }));
});

const totalCount = computed(() => items.value.length);
const filteredCount = computed(() => sortedFiltered.value.length);

const toggleCategory = (category) => {
  const next = new Set(selectedCategories.value);
  if (next.has(category)) {
    next.delete(category);
  } else {
    next.add(category);
  }
  selectedCategories.value = Array.from(next);
};

const toggleTag = (tag) => {
  const next = new Set(selectedTags.value);
  if (next.has(tag)) {
    next.delete(tag);
  } else {
    next.add(tag);
  }
  selectedTags.value = Array.from(next);
};
</script>
