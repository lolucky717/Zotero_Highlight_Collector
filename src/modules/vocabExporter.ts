import { getEnabledVocabFields } from "./vocabFields";
import { VocabListener, type VocabRecord } from "./vocabListener";

export class VocabExporter {

  static async exportCSV(records = VocabListener.getRecords()) {
    const activeRecords = records.filter(
      (record) => !record.sourceState || record.sourceState === "active",
    );

    const path = await this.pickSavePath(
      "Export Highlight Dataset CSV",
      "highlight-dataset.csv",
      [
        ["CSV File(*.csv)", "*.csv"],
        ["Any", "*.*"],
      ],
    );

    if (!path) {
      return;
    }

    try {
      const targetPath = this.ensureExtension(path, ".csv");
      const csv = this.toCSV(activeRecords);

      const csvWithBOM = "\uFEFF" + csv; //避免csv出现中文乱码

      await Zotero.File.putContentsAsync(targetPath, csvWithBOM);

      this.showExportToast(activeRecords.length, "CSV");
    } catch (error) {
      ztoolkit.log("CSV export failed", error);
      this.showExportToast(-1, error instanceof Error ? error.message : String(error));
    }
  }

  static async exportAnki(records = VocabListener.getRecords()) {
    const activeRecords = records.filter(
      (record) => !record.sourceState || record.sourceState === "active",
    );

    const path = await this.pickSavePath(
      "Export Highlights for Anki",
      "highlight-anki.txt",
      [
        ["Text File(*.txt)", "*.txt"],
        ["Any", "*.*"],
      ],
    );

    if (!path) {
      return;
    }

    try {
      const targetPath = this.ensureExtension(path, ".txt");
      const ankiText = this.toAnkiTSV(activeRecords);

      await Zotero.File.putContentsAsync(targetPath, ankiText);

      this.showExportToast(activeRecords.length, "Anki text");
    } catch (error) {
      ztoolkit.log("Anki export failed", error);
      this.showExportToast(-1, error instanceof Error ? error.message : String(error));
    }
  }

  private static toCSV(records: VocabRecord[]) {
    const fields = getEnabledVocabFields();
    const rows = [
      fields.map((field) => this.escapeCSV(field.label)).join(","),
      ...records.map((record) =>
        fields.map((field) => this.escapeCSV(field.value(record))).join(","),
      ),
    ];
    return `${rows.join("\n")}\n`;
  }
  private static async pickSavePath(
    title: string,
    defaultName: string,
    filters: [string, string][],
  ): Promise<string | null> {
    try {
      const file = await new ztoolkit.FilePicker(
        title,
        "save",
        filters,
        defaultName,
      ).open();

      return file || null;
    } catch (error) {
      ztoolkit.log("File picker failed", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  }

  private static toAnkiTSV(records: VocabRecord[]) {
    const rows = records.map((record) => {
      const front = record.text;
      const back = [
        record.categoryLabel ? `Category: ${record.categoryLabel}` : "",
        record.translation || record.annotationComment || "",
        record.contextSentence ? `Context: ${record.contextSentence}` : "",
        record.paperTitle || record.itemTitle
          ? `Paper: ${record.paperTitle || record.itemTitle}`
          : "",
        record.pageLabel ? `Page: ${record.pageLabel}` : "",
      ]
        .filter(Boolean)
        .join("<br>");
      const tags = `zotero highlight-collector ${record.categorySlug || "uncategorized"
        }`;
      return [front, back, tags].map((value) => this.escapeTSV(value)).join("\t");
    });
    return `${rows.join("\n")}\n`;
  }

  private static escapeCSV(value: string) {
    const normalizedValue = this.normalizeText(value);
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  private static escapeTSV(value: string) {
    return this.normalizeText(value).replace(/\t/g, " ");
  }

  private static normalizeText(value: string) {
    return String(value || "").replace(/\r?\n/g, " ").trim();
  }

  private static ensureExtension(path: string, extension: string) {
    return path.toLowerCase().endsWith(extension) ? path : `${path}${extension}`;
  }

  private static showExportToast(count: number, kind: string) {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: `Exported ${count} record(s) as ${kind}.`,
        type: "success",
      })
      .show();
  }
}
