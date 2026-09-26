import { VocabListener, VocabRecord } from "./vocabListener";
import { getEnabledVocabFields, VOCAB_FIELDS } from "./vocabFields";
import { getPref, setPref } from "../utils/prefs";
import { VocabExporter } from "./vocabExporter";
import {
  CATEGORY_PRESETS,
  HighlightMapping,
  cleanSlug,
  getCategoryOptions,
  getHighlightMappings,
  getMappingForColor,
  setHighlightMappings,
  validateAndNormalizeMappings,
} from "./highlightMappings";

export class VocabWindow {

  private static selectedAnnotationKeys = new Set<string>();


  static registerMenuItem() {
    ztoolkit.Menu.register("menuTools", {
      tag: "menuitem",
      label: "Highlight Collector: Show Dataset",
      oncommand: "Zotero.VocabListener.hooks.onDialogEvents('showVocabulary')",
    });
  }

  static show(categorySlug = "all") {
    const records = VocabListener.getRecords();
    const dialogData: { categorySlug: string; loadCallback: () => void } = {
      categorySlug,
      loadCallback: () => {
        this.renderPanel(
          addon.data.dialog?.window,
          VocabListener.getRecords(),
          categorySlug,
        );
      },

    };

    addon.data.dialog = new ztoolkit.Dialog(1, 1)
      .addCell(0, 0, {
        tag: "div",
        namespace: "html",
        id: "highlight-collector-root",
        styles: {
          boxSizing: "border-box",
          width: "100%",
          height: "100%",
          overflow: "auto",
          padding: "16px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          color: "#222",
        },
      })
      .setDialogData(dialogData)
      .open("Highlight Collector", {
        width: 1120,
        height: 740,
        centerscreen: true,
        resizable: true,
        noDialogMode: true,
      });
  }

  private static renderPanel(
    win: Window | undefined,
    records: VocabRecord[],
    categorySlug = "all",
  ) {
    const doc = win?.document;
    const root = doc?.querySelector("#highlight-collector-root") as
      | HTMLDivElement
      | undefined;
    if (!doc || !root) {
      return;
    }

    root.innerHTML = "";
    const activeRecords = records
      .filter(
        (record) =>
          !record.sourceState || record.sourceState === "active",
      )
      .map((record) => this.withCategory(record));

    const visibleRecords =
      categorySlug === "all"
        ? activeRecords
        : activeRecords.filter(
          (record) => record.categorySlug === categorySlug,
        );
    //清理selectedAnnotationKeys中不在activeRecords中的annotationKey
    this.selectedAnnotationKeys.forEach((key) => {
      if (!activeRecords.some((record) => record.annotationKey === key)) {
        this.selectedAnnotationKeys.delete(key);
      }
    })

    root.append(this.createToolbar(doc, activeRecords, categorySlug));

    if (!visibleRecords.length) {
      const empty = doc.createElement("p");
      empty.textContent = "No matching highlights have been captured yet.";
      root.append(empty);
      return;
    }

    const table = doc.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "13px";
    table.append(this.createHeader(doc, visibleRecords));

    const body = doc.createElement("tbody");
    for (const record of visibleRecords) {
      body.append(this.createRow(doc, record));
    }
    table.append(body);
    root.append(table);
  }

  private static refresh(win: Window | undefined, categorySlug?: string) {
    const nextCategorySlug =
      categorySlug || addon.data.dialog?.dialogData?.categorySlug || "all";
    this.renderPanel(win, VocabListener.getRecords(), nextCategorySlug);
  }

  private static createToolbar(
    doc: Document,
    records: VocabRecord[],
    categorySlug: string,
  ) {
    const wrapper = doc.createElement("div");
    wrapper.style.position = "sticky";
    wrapper.style.top = "0";
    wrapper.style.zIndex = "2";
    wrapper.style.padding = "0 0 14px";
    wrapper.style.background = "#fff";
    wrapper.style.borderBottom = "1px solid #d8d8d8";
    wrapper.style.marginBottom = "12px";

    const topRow = doc.createElement("div");
    topRow.style.display = "flex";
    topRow.style.alignItems = "center";
    topRow.style.justifyContent = "space-between";
    topRow.style.gap = "12px";

    const title = doc.createElement("h1");
    title.textContent = `Highlight Dataset (${records.length})`;
    title.style.margin = "0";
    title.style.fontSize = "22px";
    topRow.append(title);

    const actions = doc.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.append(
      this.createButton(doc, "Export selected CSV", () => {
        const selectedRecords = records.filter((record) =>
          this.selectedAnnotationKeys.has(record.annotationKey),
        );

        ztoolkit.log("Export selected CSV", {
          totalRecords: records.length,
          selectedKeys: Array.from(this.selectedAnnotationKeys),
          selectedCount: selectedRecords.length,
          selectedRecords,
        });

        if (!selectedRecords.length) {
          new ztoolkit.ProgressWindow(addon.data.config.addonName)
            .createLine({
              text: "No highlights selected for export.",
              type: "warning",
            })
            .show();
          return;
        }

        return VocabExporter.exportCSV(selectedRecords);
      }),
      this.createButton(doc, "Export Anki", () => VocabExporter.exportAnki()),
      this.createButton(doc, "Refresh", () => {
        this.refresh(addon.data.dialog?.window);
      }),
      this.createButton(doc, "Scan Existing Highlights", async () => {
        const result = await VocabListener.scanExistHighlights(false);

        if (result.skipped) {
          new ztoolkit.ProgressWindow(addon.data.config.addonName)
            .createLine({
              text: "Historical highlights have already been scanned.",
              type: "default",
            })
            .show();
          return;
        }

        this.refresh(addon.data.dialog?.window);

        new ztoolkit.ProgressWindow(addon.data.config.addonName)
          .createLine({
            text: `Scanned ${result.scanned} items; imported ${result.updated} highlight(s).`,
            type: "success",
          })
          .show();
      }),
      this.createButton(doc, "Rescan Historical Highlights", async () => {
        const result = await VocabListener.scanExistHighlights(true);

        this.refresh(addon.data.dialog?.window);

        new ztoolkit.ProgressWindow(addon.data.config.addonName)
          .createLine({
            text: `Rescanned ${result.scanned} items; imported ${result.updated} highlight(s).`,
            type: "success",
          })
          .show();
      }),


    );
    topRow.append(actions);
    wrapper.append(topRow);

    const settings = doc.createElement("div");
    settings.style.display = "grid";
    settings.style.gridTemplateColumns = "minmax(460px, 1.2fr) minmax(360px, 1fr)";
    settings.style.gap = "16px";
    settings.style.marginTop = "12px";
    settings.append(
      this.createMappingSettings(doc),
      this.createFieldAndFilterSettings(doc, categorySlug),
    );
    wrapper.append(settings);
    return wrapper;
  }

  private static createMappingSettings(doc: Document) {
    const section = doc.createElement("section");
    const title = doc.createElement("div");
    title.textContent = "Color to category mapping";
    title.style.fontWeight = "600";
    title.style.marginBottom = "6px";
    section.append(title);

    const mappings = getHighlightMappings();
    const rows = doc.createElement("div");
    rows.style.display = "grid";
    rows.style.gap = "6px";
    for (const [index, mapping] of mappings.entries()) {
      rows.append(this.createMappingRow(doc, mapping, index, mappings));
    }

    const addButton = this.createButton(doc, "+ Add Mapping", () => {
      setHighlightMappings([
        ...getHighlightMappings(),
        { color: "#cccccc", label: "Other", slug: "other" },
      ]);
      this.refresh(addon.data.dialog?.window);
    });
    addButton.style.marginTop = "8px";
    section.append(rows, addButton);
    return section;
  }

  private static createMappingRow(
    doc: Document,
    mapping: HighlightMapping,
    index: number,
    mappings: HighlightMapping[],
  ) {
    const row = doc.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "28px 90px minmax(130px, 1fr) minmax(110px, 0.8fr) 72px";
    row.style.gap = "6px";
    row.style.alignItems = "center";

    const swatch = doc.createElement("span");
    swatch.style.width = "20px";
    swatch.style.height = "20px";
    swatch.style.border = "1px solid #888";
    swatch.style.background = mapping.color;

    const colorInput = doc.createElement("input");
    colorInput.type = "text";
    colorInput.value = mapping.color;
    this.styleTextInput(colorInput);
    colorInput.addEventListener("change", () => {
      this.updateMapping(index, { color: colorInput.value });
    });

    const labelInput = doc.createElement("input");
    labelInput.type = "text";
    labelInput.value = mapping.label;
    labelInput.setAttribute("list", "highlight-category-presets");
    this.styleTextInput(labelInput);
    labelInput.addEventListener("change", () => {
      this.updateMapping(index, {
        label: labelInput.value,
        slug: cleanSlug(labelInput.value),
      });
    });

    const slugInput = doc.createElement("input");
    slugInput.type = "text";
    slugInput.value = mapping.slug;
    this.styleTextInput(slugInput);
    slugInput.addEventListener("change", () => {
      this.updateMapping(index, { slug: cleanSlug(slugInput.value) });
    });

    const removeButton = this.createButton(doc, "Remove", () => {
      const nextMappings = mappings.filter((_, mappingIndex) => mappingIndex !== index);
      setHighlightMappings(nextMappings);
      this.refresh(addon.data.dialog?.window);
    });

    row.append(swatch, colorInput, labelInput, slugInput, removeButton);
    this.ensurePresetDatalist(doc);
    return row;
  }

  private static createFieldAndFilterSettings(
    doc: Document,
    categorySlug: string,
  ) {
    const section = doc.createElement("section");
    section.append(this.createCategoryFilter(doc, categorySlug));

    const label = doc.createElement("div");
    label.textContent = "Visible / exported fields";
    label.style.fontWeight = "600";
    label.style.marginBottom = "4px";
    label.style.marginTop = "10px";
    section.append(label);

    const fields = doc.createElement("div");
    fields.style.display = "flex";
    fields.style.flexWrap = "wrap";
    fields.style.gap = "8px 14px";
    for (const field of VOCAB_FIELDS) {
      const fieldLabel = doc.createElement("label");
      fieldLabel.style.whiteSpace = "nowrap";
      const checkbox = doc.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(getPref(field.prefKey));
      checkbox.style.marginRight = "4px";
      checkbox.addEventListener("change", () => {
        setPref(field.prefKey, checkbox.checked);
        this.refresh(addon.data.dialog?.window);
      });
      fieldLabel.append(checkbox, field.label);
      fields.append(fieldLabel);
    }
    section.append(fields);
    return section;
  }

  private static createCategoryFilter(doc: Document, categorySlug: string) {
    const wrapper = doc.createElement("div");
    const label = doc.createElement("label");
    label.textContent = "Filter category";
    label.style.display = "block";
    label.style.fontWeight = "600";
    label.style.marginBottom = "4px";

    const select = doc.createElement("select");
    select.style.padding = "6px 8px";
    select.style.border = "1px solid #aaa";
    select.style.borderRadius = "4px";
    select.style.minWidth = "220px";

    const allOption = doc.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All categories";
    select.append(allOption);

    for (const option of getCategoryOptions()) {
      const categoryOption = doc.createElement("option");
      categoryOption.value = option.slug;
      categoryOption.textContent = option.label;
      select.append(categoryOption);
    }
    select.value = categorySlug;
    select.addEventListener("change", () => {
      if (addon.data.dialog?.dialogData) {
        addon.data.dialog.dialogData.categorySlug = select.value;
      }
      this.refresh(addon.data.dialog?.window, select.value);
    });

    wrapper.append(label, select);
    return wrapper;
  }

  private static createButton(
    doc: Document,
    label: string,
    onClick: () => void | Promise<void>,
  ) {
    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.padding = "6px 10px";
    button.style.border = "1px solid #aaa";
    button.style.borderRadius = "4px";
    button.style.background = "#f7f7f7";
    button.addEventListener("click", () => {
      void Promise.resolve(onClick()).catch((error) => {
        ztoolkit.log(`Button action  failed:${label}`, error);
      })
    });
    return button;
  }
  private static updateMapping(
    index: number,
    patch: Partial<HighlightMapping>,
  ): boolean {
    const mappings = getHighlightMappings();

    const updatedMappings = mappings.map((mapping, i) =>
      i === index
        ? {
          ...mapping,
          ...patch,
        }
        : mapping,
    );

    try {
      const normalizedMappings =
        validateAndNormalizeMappings(updatedMappings);

      setHighlightMappings(normalizedMappings);
      this.refresh(addon.data.dialog?.window);

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      ztoolkit.log(message);

      return false;
    }
  }
  private static styleTextInput(input: HTMLInputElement) {
    input.style.boxSizing = "border-box";
    input.style.width = "100%";
    input.style.padding = "5px 6px";
    input.style.border = "1px solid #aaa";
    input.style.borderRadius = "4px";
  }

  private static ensurePresetDatalist(doc: Document) {
    if (doc.querySelector("#highlight-category-presets")) {
      return;
    }

    const datalist = doc.createElement("datalist");
    datalist.id = "highlight-category-presets";
    for (const preset of CATEGORY_PRESETS) {
      const option = doc.createElement("option");
      option.value = preset;
      datalist.append(option);
    }
    doc.body?.append(datalist);
  }

  private static createHeader(doc: Document, records: VocabRecord[]) {
    const header = doc.createElement("thead");
    const row = doc.createElement("tr");

    const selectCell = doc.createElement("th");
    selectCell.style.padding = "8px";
    selectCell.style.borderBottom = "1px solid #bbb";
    selectCell.style.background = "#f6f6f6";

    const selectAll = doc.createElement("input");
    selectAll.type = "checkbox";

    const selectedCount = records.filter((record) =>
      this.selectedAnnotationKeys.has(record.annotationKey),
    ).length;

    selectAll.checked = records.length > 0 && selectedCount === records.length;
    selectAll.indeterminate =
      selectedCount > 0 && selectedCount < records.length;

    selectAll.addEventListener("change", () => {
      if (selectAll.checked) {
        for (const record of records) {
          this.selectedAnnotationKeys.add(record.annotationKey);
        }
      } else {
        for (const record of records) {
          this.selectedAnnotationKeys.delete(record.annotationKey);
        }
      }

      this.refresh(addon.data.dialog?.window);
    });

    selectCell.append(selectAll);
    row.append(selectCell);

    for (const { label } of getEnabledVocabFields()) {
      const cell = doc.createElement("th");
      cell.textContent = label;
      cell.style.position = "sticky";
      cell.style.top = "0";
      cell.style.zIndex = "1";
      cell.style.padding = "8px";
      cell.style.borderBottom = "1px solid #bbb";
      cell.style.background = "#f6f6f6";
      cell.style.textAlign = "left";
      row.append(cell);
    }
    header.append(row);
    return header;
  }

  private static createRow(doc: Document, record: VocabRecord) {
    const row = doc.createElement("tr");
    const values = getEnabledVocabFields().map((field) => field.value(record));
    const selectCell = doc.createElement("td");
    selectCell.style.padding = "8px";
    selectCell.style.borderBottom = "1px solid #e5e5e5";
    selectCell.style.verticalAlign = "top";

    const checkbox = doc.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = this.selectedAnnotationKeys.has(record.annotationKey);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        this.selectedAnnotationKeys.add(record.annotationKey);
      } else {
        this.selectedAnnotationKeys.delete(record.annotationKey);
      }
    });

    selectCell.append(checkbox);
    row.append(selectCell);
    for (const value of values) {
      const cell = doc.createElement("td");
      cell.textContent = value;
      cell.style.padding = "8px";
      cell.style.borderBottom = "1px solid #e5e5e5";
      cell.style.verticalAlign = "top";
      cell.style.lineHeight = "1.35";
      row.append(cell);
    }
    return row;
  }

  private static withCategory(record: VocabRecord): VocabRecord {
    const mapping = getMappingForColor(record.annotationColor);

    return {
      ...record,
      categoryLabel: mapping?.label ?? "",
      categorySlug: mapping?.slug ?? "",
    };
  }
}
