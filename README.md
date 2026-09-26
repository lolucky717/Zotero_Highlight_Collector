# Zotero Highlight Collector

Zotero Highlight Collector turns Zotero PDF highlights into a personal research
dataset. Map highlight colors to meanings such as Vocabulary, Core Claim,
Quote, Method, Conclusion, or Idea, and the plugin will collect matching
annotations with source metadata for filtering and export.

> Status: early MVP. Tested locally with Zotero 9 during development.

## Features

- Listen for new or modified Zotero PDF highlight annotations.
- Map each watched highlight color to a category.
- Record category, highlight text, paper title, excerpt date, annotation
  comment translation, context sentence, and page label.
- Show a unified Highlight Dataset panel from Zotero's Tools menu.
- Edit color-to-category mappings in the panel.
- Filter records by category.
- Configure visible/exported fields.
- Export the dataset as CSV.
- Export Anki-friendly tab-separated text for vocabulary review.
- Store data locally in Zotero preferences.

## Privacy

This plugin works locally inside Zotero. It does not upload your papers,
annotations, vocabulary, translations, highlights, or metadata to any external
service.

See [PRIVACY.md](PRIVACY.md) for details.

## Installation

1. Download the latest `.xpi` from GitHub Releases.
2. Open Zotero.
3. Go to `Tools` -> `Add-ons`.
4. Click the gear icon.
5. Choose `Install Add-on From File...`.
6. Select the downloaded `.xpi`.
7. Restart Zotero.

## Usage

1. Open a PDF in Zotero.
2. Highlight text using a color that you mapped to a research category.
3. Open `Tools` -> `Highlight Collector: Show Dataset`.
4. Review captured highlights, edit color/category mappings, filter by
   category, or export CSV/Anki text.

## Suggested Color Categories

You can choose your own system. A common setup is:

| Color | Category |
| --- | --- |
| Gray | Vocabulary |
| Yellow | Core Claim |
| Blue | Quote |
| Green | Method |
| Red | Conclusion |
| Purple | Idea |

## Translation Plugin Workflow

This plugin does not translate text by itself. It reads Zotero annotation
comments and stores them as the Translation field.

If you use a Zotero Translate / PDF Translate plugin, enable the option that
automatically fills translations into annotation comments. Then this plugin can
capture both the highlighted text and its translation.

## Anki Import

The Anki export is a tab-separated `.txt` file with three fields:

```text
Front    Back    Tags
```

When importing into Anki, choose a note type with at least two fields, map
`Front` to the word/phrase and `Back` to the combined category,
translation/context/source content. The third field can be imported as tags.

## Development

Install dependencies:

```sh
npm ci
```

Build the plugin:

```sh
npm run build
```

The XPI is generated at:

```text
.scaffold/build/zotero-highlight-collector.xpi
```

## Release

Create a GitHub release and upload the generated XPI, or push a version tag to
run the included release workflow.

## Roadmap

- Scan existing highlights on demand.
- Jump from a dataset row back to the source annotation.
- Improve context extraction using annotation position/page text.
- Add richer export templates, such as literature review CSV and quote bank
  Markdown.

## Credits

Bootstrapped from
[windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template).
可以。结合我们刚刚已经完成的功能，README 中文部分建议把**使用流程、历史扫描、分类映射、字段选择、选择性导出**补上。下面这版可以直接放进 `README.md`，不改你原来的英文内容的话，建议作为一个“中文使用说明”章节追加。

## 中文使用说明

### 1. 插件功能

Highlight Collector 用于自动捕获 Zotero 中的高亮内容，并将符合条件的高亮保存为可管理的数据集。

插件会根据高亮颜色进行类别映射，并记录高亮文本、类别、批注、论文标题、页码、上下文等信息。

主要功能包括：

* 自动捕获新建或修改的 Zotero 高亮
* 扫描 Zotero 中已有的历史高亮
* 根据高亮颜色映射不同类别
* 自定义类别名称和类别标识
* 按类别筛选高亮
* 自定义数据集显示和导出字段
* 手动选择指定高亮进行 CSV 导出
* 将高亮数据导出为 Anki 可导入的文本格式
* 支持重新扫描历史高亮

---

### 2. 打开数据集

在 Zotero 中打开：

**Tools → Highlight Collector: Show Dataset**

打开后可以查看插件已经捕获的高亮数据。

数据集窗口中会显示当前已经保存的有效高亮数量，并提供扫描、筛选、导出和分类映射等功能。

---

### 3. 自动捕获高亮

插件启用后，当 Zotero 中出现符合条件的高亮时，插件会自动进行捕获。

只有满足以下条件的高亮才会被纳入数据集：

1. Zotero 项目中的内容属于高亮批注；
2. 高亮存在文本内容；
3. 高亮颜色已经配置了对应的类别映射。

捕获的数据会保存在插件的数据集中。

如果修改了已经捕获的高亮，例如修改高亮文本或批注，插件会更新对应的数据记录，而不是重复创建一条记录。

---

### 4. 扫描已有高亮

对于插件启用之前已经存在于 Zotero 中的高亮，可以使用：

**Scan Existing Highlights**

进行历史高亮扫描。

首次扫描完成后，插件会记录历史扫描状态。再次点击该按钮时，如果当前版本的历史数据已经扫描过，则不会重复执行完整扫描。

扫描完成后会显示扫描和导入结果。

---

### 5. 重新扫描历史高亮

如果修改了高亮类别映射、数据处理逻辑，或者希望重新检查 Zotero 中已有的高亮，可以使用：

**Rescan Historical Highlights**

该功能会强制重新扫描历史高亮，而不会受到之前历史扫描状态的限制。

因此：

* `Scan Existing Highlights`：正常的历史扫描入口；
* `Rescan Historical Highlights`：强制重新扫描入口。

---

### 6. 高亮颜色与类别映射

在 **Color to category mapping** 区域，可以配置 Zotero 高亮颜色与数据类别之间的对应关系。

每个映射包含：

* **Color**：Zotero 高亮颜色；
* **Label**：类别名称；
* **Slug**：类别标识。

例如：

| 颜色        | 类别名称     | 类别标识                        |
| --------- | -------- | --------------------------- |
| `#ffd400` | 定义       | `definition`                |
| `#ff6666` | 重要结论     | `important`                 |
| `#2ea8e5` | 方法，实验，过程 | `method-experiment-process` |

类别名称和类别标识不能重复，颜色也不能重复。

点击 **+ Add Mapping** 可以增加新的颜色映射。

如果修改已有映射，插件会对颜色、类别名称和类别标识进行检查。存在重复或为空的情况时，不会保存无效配置。

---

### 7. 按类别筛选

使用：

**Filter category**

可以按照类别查看高亮。

可以选择：

* **All categories**：显示所有类别；
* 具体类别：只显示对应类别的高亮。

类别筛选只影响当前数据集窗口中的显示内容。

---

### 8. 选择需要导出的高亮

数据表格最左侧提供选择框。

可以：

* 单独勾选某一条高亮；
* 取消某一条高亮；
* 点击表头的选择框选择当前显示的数据；
* 再次点击取消选择。

选中的高亮会保存在当前窗口的选择状态中。

---

### 9. 导出选中的高亮为 CSV

选择需要导出的高亮后，点击：

**Export selected CSV**

插件只会导出当前选中的高亮，而不会导出整个数据集。

例如数据集中共有 450 条记录，只选择其中 2 条：

> Export selected CSV

最终 CSV 文件只包含这 2 条记录。

CSV 的导出字段由 **Visible / exported fields** 中启用的字段决定。

导出的 CSV 使用 UTF-8 编码，并加入 UTF-8 BOM，以提高使用 Excel 打开中文 CSV 文件时的兼容性。

---

### 10. 导出字段设置

在：

**Visible / exported fields**

区域，可以选择需要显示和导出的字段。

取消某个字段后，该字段不会出现在数据表格和 CSV 导出结果中。

因此可以根据不同用途配置不同的数据集，例如只导出：

* Highlight
* Category
* Translation
* Context
* Paper
* Page

等字段。

---

### 11. 导出 Anki

点击：

**Export Anki**

可以将当前数据集导出为适合导入 Anki 的文本文件。

Anki 导出内容主要包括：

* 高亮文本
* 类别
* 翻译或批注
* 上下文
* 论文标题
* 页码
* 类别标签

导出的数据使用制表符分隔，可以在 Anki 中进一步进行字段映射和导入。

---

### 12. 数据状态

插件会区分有效记录和已经失效的记录。

正常显示和导出的数据以 `active` 状态的记录为主。

如果 Zotero 中对应的高亮被删除，插件可以保留原有数据记录，同时标记其来源状态，从而避免历史数据直接丢失。

因此，数据集中的记录数量与当前 Zotero 中实际存在的高亮数量可能存在差异。

---

### 13. 推荐使用流程

第一次使用插件时，建议按照以下流程进行：

1. 配置需要使用的高亮颜色；
2. 在 **Color to category mapping** 中设置颜色与类别；
3. 在 **Visible / exported fields** 中选择需要的数据字段；
4. 点击 **Scan Existing Highlights** 扫描 Zotero 中已有的高亮；
5. 后续在 Zotero 中正常添加高亮，插件会自动捕获；
6. 在数据集窗口中按照类别进行筛选；
7. 勾选需要使用的高亮；
8. 使用 **Export selected CSV** 导出选中的数据；
9. 或使用 **Export Anki** 将数据整理后导入 Anki。

如果修改了类别映射或希望重新检查历史数据，可以使用 **Rescan Historical Highlights**。

这版基本对应你现在已经实现的功能，尤其把刚刚新增的 **“勾选记录 → 只导出选中 CSV → UTF-8/BOM”** 以及 **“普通历史扫描 / 强制重新扫描”** 都补进去了。你原来的 README 如果还有英文的项目介绍、安装和开发部分，可以继续保留，不需要全部改成中文。
